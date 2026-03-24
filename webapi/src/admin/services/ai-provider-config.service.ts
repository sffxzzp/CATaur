import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import type { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import axios from 'axios';
import { AIProviderConfigDto, AIProviderResponseDto, BUILTIN_AI_PROVIDERS, CustomAIProviderDto } from '../dto/ai-provider.dto';
import { EncryptionService } from '../../common/encryption.service';
import { SystemConfig } from '../../database/entities/system-config.entity';

const AI_PROVIDER_CONFIG_PREFIX = 'ai_provider_config:';
const AI_PROVIDERS_LIST_KEY = 'ai_providers_list';
const AI_CUSTOM_PROVIDERS_KEY = 'ai_custom_providers';
const AI_PROVIDER_MODELS_PREFIX = 'ai_provider_models:';

const AI_PROVIDER_CONFIG_CATEGORY = 'AI_PROVIDER';
const AI_CUSTOM_PROVIDER_CATEGORY = 'AI_PROVIDER_CUSTOM';

@Injectable()
export class AIProviderConfigService {
  private readonly logger = new Logger(AIProviderConfigService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(SystemConfig)
    private readonly systemConfigsRepository: Repository<SystemConfig>,
    private readonly encryptionService: EncryptionService,
  ) { }

  /**
   * Save or update AI provider configuration
   */
  async saveConfig(config: AIProviderConfigDto): Promise<AIProviderResponseDto> {
    try {
      this.ensureProviderAllowed(config.provider);
      const existing = await this.getConfig(config.provider);
      const key = this.getConfigKey(config.provider);
      const apiKey = config.apiKey ?? existing?.apiKey ?? '';
      if (!apiKey.trim()) {
        throw new BadRequestException('API key is required');
      }

      const responseDto: AIProviderResponseDto = {
        ...existing,
        ...config,
        apiKey,
        enabled: config.enabled ?? existing?.enabled ?? false,
        updatedAt: Date.now(),
      };

      if (responseDto.enabled) {
        await this.disableAllProvidersExcept(config.provider);
      }

      await this.saveConfigToDb(config.provider, responseDto);

      // Save configuration to Redis cache
      const encryptedPayload = this.encryptionService.encryptJson(responseDto);
      await this.cacheManager.set(key, encryptedPayload, 0); // 0 means no expiration

      // Update provider list
      await this.updateProvidersList();

      // Refresh model cache
      await this.refreshProviderModels(config.provider).catch((error) => {
        this.logger.warn(`Failed to refresh models for ${config.provider}: ${error.message}`);
      });

      this.logger.log(`AI Provider config saved: ${config.provider}`);
      return this.maskConfig(responseDto);
    } catch (error) {
      this.logger.error(`Failed to save AI Provider config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get specific AI provider configuration
   */
  async getConfig(provider: string): Promise<AIProviderResponseDto | null> {
    try {
      const key = this.getConfigKey(provider);
      const cached = await this.cacheManager.get<Buffer>(key);

      if (cached) {
        const decrypted = this.encryptionService.decryptJson<AIProviderResponseDto>(cached);
        await this.ensureConfigPersisted(provider, decrypted);
        return decrypted;
      }

      const fromDb = await this.loadConfigFromDb(provider);
      if (fromDb) {
        await this.cacheManager.set(key, this.encryptionService.encryptJson(fromDb), 0);
        return fromDb;
      }

      const migrated = await this.migrateConfigFromCache(provider);
      if (migrated) {
        await this.cacheManager.set(key, this.encryptionService.encryptJson(migrated), 0);
        return migrated;
      }

      this.logger.warn(`AI Provider config not found: ${provider}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get AI Provider config: ${error.message}`);
      throw error;
    }
  }

  async getMaskedConfig(provider: string): Promise<AIProviderResponseDto | null> {
    const config = await this.getConfig(provider);
    return config ? this.maskConfig(config) : null;
  }

  /**
   * Get all AI provider configurations
   */
  async getAllConfigs(): Promise<AIProviderResponseDto[]> {
    try {
      const providers = await this.getAllProviderIds();
      const configs: AIProviderResponseDto[] = [];

      for (const provider of providers) {
        const config = await this.getMaskedConfig(provider);
        if (config) {
          configs.push(config);
        }
      }

      return configs;
    } catch (error) {
      this.logger.error(`Failed to get all AI Provider configs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete specific AI provider configuration
   */
  async deleteConfig(provider: string): Promise<void> {
    try {
      const key = this.getConfigKey(provider);
      await this.deleteConfigFromDb(provider);
      await this.cacheManager.del(key);
      await this.cacheManager.del(this.getModelsKey(provider));
      await this.updateProvidersList();
      this.logger.log(`AI Provider config deleted: ${provider}`);
    } catch (error) {
      this.logger.error(`Failed to delete AI Provider config: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a provider configuration exists
   */
  async hasConfig(provider: string): Promise<boolean> {
    const config = await this.getConfig(provider);
    return config !== null;
  }

  async refreshProviderModels(provider: string, apiKey?: string): Promise<{ models: string[]; defaultModel?: string; enabled: boolean; updatedAt: number } | null> {
    const config = await this.getConfig(provider);
    apiKey = apiKey ?? config?.apiKey;
    if (!apiKey) {
      throw new BadRequestException('API key is required');
    }


    const models = await this.fetchModelsForProvider(provider, apiKey);
    const payload = {
      models,
      defaultModel: config?.defaultModel,
      enabled: config?.enabled ?? false,
      updatedAt: Date.now(),
    };
    await this.cacheManager.set(this.getModelsKey(provider), this.encryptionService.encryptJson(payload), 0);
    return payload;
  }

  async getCustomProviders(): Promise<CustomAIProviderDto[]> {
    const cached = await this.cacheManager.get<Buffer>(AI_CUSTOM_PROVIDERS_KEY);
    if (cached) {
      const decrypted = this.encryptionService.decryptJson<CustomAIProviderDto[]>(cached);
      await this.ensureCustomProvidersPersisted(decrypted);
      return decrypted;
    }

    const fromDb = await this.loadCustomProvidersFromDb();
    if (fromDb.length > 0) {
      await this.cacheManager.set(AI_CUSTOM_PROVIDERS_KEY, this.encryptionService.encryptJson(fromDb), 0);
      return fromDb;
    }

    const migrated = await this.migrateCustomProvidersFromCache();
    if (migrated.length > 0) {
      await this.cacheManager.set(AI_CUSTOM_PROVIDERS_KEY, this.encryptionService.encryptJson(migrated), 0);
      return migrated;
    }

    return [];
  }

  async saveCustomProvider(dto: CustomAIProviderDto): Promise<CustomAIProviderDto> {
    if (!['openai', 'anthropic', 'gemini', 'ollama'].includes(dto.providerType)) {
      throw new BadRequestException('Invalid custom provider type');
    }
    const providers = await this.getCustomProviders();
    const existingIndex = providers.findIndex((provider) => provider.id === dto.id);
    if (existingIndex === -1) {
      providers.push(dto);
    } else {
      providers[existingIndex] = dto;
    }

    await this.saveCustomProviderToDb(dto);
    await this.cacheManager.set(AI_CUSTOM_PROVIDERS_KEY, this.encryptionService.encryptJson(providers), 0);
    await this.updateProvidersList();
    return dto;
  }

  async deleteCustomProvider(id: string): Promise<void> {
    const providers = await this.getCustomProviders();
    const next = providers.filter((provider) => provider.id !== id);
    await this.deleteCustomProviderFromDb(id);
    await this.cacheManager.set(AI_CUSTOM_PROVIDERS_KEY, this.encryptionService.encryptJson(next), 0);
    await this.updateProvidersList();
  }

  async getAllProviderIds(): Promise<string[]> {
    const builtin = BUILTIN_AI_PROVIDERS;
    const custom = (await this.getCustomProviders()).map((provider) => provider.id);
    return Array.from(new Set([...builtin, ...custom]));
  }

  /**
   * Get configuration key in Redis
   */
  private getConfigKey(provider: string): string {
    return `${AI_PROVIDER_CONFIG_PREFIX}${provider}`;
  }

  private getModelsKey(provider: string): string {
    return `${AI_PROVIDER_MODELS_PREFIX}${provider}`;
  }

  private maskConfig(config: AIProviderResponseDto): AIProviderResponseDto {
    return {
      ...config,
      apiKey: this.maskApiKey(config.apiKey),
      enabled: config.enabled ?? false,
    };
  }

  private maskApiKey(value: string): string {
    if (!value) {
      return '';
    }
    const visible = 4;
    if (value.length <= visible * 2) {
      return `${'*'.repeat(Math.max(0, value.length - visible))}${value.slice(-visible)}`;
    }
    return `${value.slice(0, visible)}${'*'.repeat(value.length - visible * 2)}${value.slice(-visible)}`;
  }

  private ensureProviderAllowed(provider: string): void {
    if ((BUILTIN_AI_PROVIDERS as string[]).includes(provider)) {
      return;
    }
    const matchesCustom = /^[a-z0-9][a-z0-9_-]{2,48}$/.test(provider);
    if (!matchesCustom) {
      throw new BadRequestException('Invalid provider id');
    }
  }

  private async fetchModelsForProvider(provider: string, apiKey: string): Promise<string[]> {
    if (!apiKey) {
      throw new BadRequestException('API key not configured');
    }

    if (provider === 'openai') {
      const response = await axios.get<{ data: Array<{ id: string }> }>('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return response.data.data.map((model) => model.id);
    }

    if (provider === 'anthropic') {
      const response = await axios.get<{ data: Array<{ id: string }> }>('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });
      return response.data.data.map((model) => model.id);
    }

    if (provider === 'google') {
      const response = await axios.get<{ models: Array<{ name: string }> }>(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      );
      return response.data.models.map((model) => model.name);
    }

    throw new BadRequestException('Unsupported custom provider type');
  }

  /**
   * Update provider list cache
   */
  private async updateProvidersList(): Promise<void> {
    try {
      const configs = await this.getAllConfigs();
      const providersList = configs.map((c) => c.provider);
      await this.cacheManager.set(
        AI_PROVIDERS_LIST_KEY,
        JSON.stringify(providersList),
        0,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update providers list: ${error.message}`,
      );
    }
  }

  private getConfigDbKey(provider: string): string {
    return `provider:${provider}`;
  }

  private getCustomDbKey(id: string): string {
    return `custom:${id}`;
  }

  private async loadConfigFromDb(provider: string): Promise<AIProviderResponseDto | null> {
    const key = this.getConfigDbKey(provider);
    const record = await this.systemConfigsRepository.findOne({
      where: { key, category: AI_PROVIDER_CONFIG_CATEGORY },
    });

    if (!record?.value) {
      return null;
    }

    return this.encryptionService.decryptJson<AIProviderResponseDto>(record.value as Buffer);
  }

  private async saveConfigToDb(provider: string, payload: AIProviderResponseDto): Promise<void> {
    const key = this.getConfigDbKey(provider);
    const encrypted = this.encryptionService.encryptJson(payload);
    const existing = await this.systemConfigsRepository.findOne({
      where: { key, category: AI_PROVIDER_CONFIG_CATEGORY },
    });

    if (existing) {
      existing.value = encrypted as unknown as string;
      await this.systemConfigsRepository.save(existing);
      return;
    }

    const created = this.systemConfigsRepository.create({
      key,
      category: AI_PROVIDER_CONFIG_CATEGORY,
      value: encrypted as unknown as string,
    });
    await this.systemConfigsRepository.save(created);
  }

  private async deleteConfigFromDb(provider: string): Promise<void> {
    const key = this.getConfigDbKey(provider);
    await this.systemConfigsRepository.delete({ key, category: AI_PROVIDER_CONFIG_CATEGORY });
  }

  private async loadCustomProvidersFromDb(): Promise<CustomAIProviderDto[]> {
    const records = await this.systemConfigsRepository.find({
      where: { category: AI_CUSTOM_PROVIDER_CATEGORY },
    });

    return records
      .filter((record) => record.value)
      .map((record) => this.encryptionService.decryptJson<CustomAIProviderDto>(record.value as Buffer));
  }

  private async saveCustomProviderToDb(dto: CustomAIProviderDto): Promise<void> {
    const key = this.getCustomDbKey(dto.id);
    const encrypted = this.encryptionService.encryptJson(dto);
    const existing = await this.systemConfigsRepository.findOne({
      where: { key, category: AI_CUSTOM_PROVIDER_CATEGORY },
    });

    if (existing) {
      existing.value = encrypted as unknown as string;
      await this.systemConfigsRepository.save(existing);
      return;
    }

    const created = this.systemConfigsRepository.create({
      key,
      category: AI_CUSTOM_PROVIDER_CATEGORY,
      value: encrypted as unknown as string,
    });
    await this.systemConfigsRepository.save(created);
  }

  private async deleteCustomProviderFromDb(id: string): Promise<void> {
    const key = this.getCustomDbKey(id);
    await this.systemConfigsRepository.delete({ key, category: AI_CUSTOM_PROVIDER_CATEGORY });
  }

  private async migrateConfigFromCache(provider: string): Promise<AIProviderResponseDto | null> {
    const key = this.getConfigKey(provider);
    const cached = await this.cacheManager.get<Buffer>(key);
    if (!cached) {
      return null;
    }

    const decrypted = this.encryptionService.decryptJson<AIProviderResponseDto>(cached);
    await this.saveConfigToDb(provider, decrypted);
    return decrypted;
  }

  private async migrateCustomProvidersFromCache(): Promise<CustomAIProviderDto[]> {
    const cached = await this.cacheManager.get<Buffer>(AI_CUSTOM_PROVIDERS_KEY);
    if (!cached) {
      return [];
    }

    const providers = this.encryptionService.decryptJson<CustomAIProviderDto[]>(cached);
    for (const provider of providers) {
      await this.saveCustomProviderToDb(provider);
    }

    return providers;
  }

  private async disableAllProvidersExcept(currentProvider: string): Promise<void> {
    const allConfigs = await this.systemConfigsRepository.find({
      where: { category: AI_PROVIDER_CONFIG_CATEGORY },
    });

    const currentDbKey = this.getConfigDbKey(currentProvider);

    for (const record of allConfigs) {
      if (record.key === currentDbKey) continue;

      if (record.value) {
        const config = this.encryptionService.decryptJson<AIProviderResponseDto>(record.value as Buffer);
        if (config.enabled) {
          config.enabled = false;
          config.updatedAt = Date.now();
          const encrypted = this.encryptionService.encryptJson(config);
          record.value = encrypted as unknown as string;
          await this.systemConfigsRepository.save(record);

          // Also update cache
          const providerId = record.key.replace('provider:', '');
          const cacheKey = this.getConfigKey(providerId);
          await this.cacheManager.set(cacheKey, encrypted, 0);
        }
      }
    }
  }

  private async ensureConfigPersisted(provider: string, payload: AIProviderResponseDto): Promise<void> {
    const key = this.getConfigDbKey(provider);
    const existing = await this.systemConfigsRepository.findOne({
      where: { key, category: AI_PROVIDER_CONFIG_CATEGORY },
    });
    if (!existing) {
      await this.saveConfigToDb(provider, payload);
    }
  }

  private async ensureCustomProvidersPersisted(providers: CustomAIProviderDto[]): Promise<void> {
    for (const provider of providers) {
      const key = this.getCustomDbKey(provider.id);
      const existing = await this.systemConfigsRepository.findOne({
        where: { key, category: AI_CUSTOM_PROVIDER_CATEGORY },
      });
      if (!existing) {
        await this.saveCustomProviderToDb(provider);
      }
    }
  }
}
