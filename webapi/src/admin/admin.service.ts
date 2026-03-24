import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole, Role } from '../database/entities/user-role.entity';
import { UlidService } from '../common/ulid.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedUsersResponseDto, UserListItemDto } from './dto/user-list-response.dto';
import { Company } from '../database/entities/company.entity';
import { SystemConfig } from '../database/entities/system-config.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuditLog } from '../database/entities/audit-log.entity';
import { PaginatedAuditLogResponseDto, AuditLogItemDto } from './dto/audit-log-response.dto';
import { EmailConfigService } from '../common/email-config.service';
import { EmailConfigDto } from '../common/dto/email-config.dto';
import { EmailService } from '../common/email.service';
import { AIProviderConfigService } from './services/ai-provider-config.service';
import { AIProviderConfigDto, AIProviderResponseDto, AIProvidersListResponseDto, AIProviderModelsResponseDto, CustomAIProviderDto, CustomAIProvidersListResponseDto } from './dto/ai-provider.dto';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class AdminService {

    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserRole)
        private userRolesRepository: Repository<UserRole>,
        @InjectRepository(Company)
        private companiesRepository: Repository<Company>,
        @InjectRepository(SystemConfig)
        private systemConfigsRepository: Repository<SystemConfig>,
        @InjectRepository(AuditLog)
        private auditLogsRepository: Repository<AuditLog>,
        private ulidService: UlidService,
        private emailConfigService: EmailConfigService,
        private emailService: EmailService,
        private aiProviderConfigService: AIProviderConfigService,
        private encryptionService: EncryptionService,
    ) { }

    async listUsers(page: number, limit: number, role?: Role, search?: string): Promise<PaginatedUsersResponseDto> {
        const queryBuilder = this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'roles');

        if (role) {
            queryBuilder.andWhere('roles.role = :role', { role });
        }
        else {
            queryBuilder.andWhere('roles.role <> :role', { role: Role.CANDIDATE });
        }

        if (search) {
            queryBuilder.andWhere('(user.email LIKE :search OR user.nickname LIKE :search)', { search: `%${search}%` });
        }

        const [users, total] = await queryBuilder
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const sanitizedUsers = users.map(({ id, nickname, email, phone, roles, isActive, createdAt }) => ({
            id,
            nickname,
            email,
            phone: phone
                ? (this.encryptionService.decryptText(phone as unknown as Buffer) as any)
                : phone,
            roles: roles?.map(r => ({
                userId: r.userId,
                role: r.role
            })) || [],
            isActive,
            createdAt
        }));

        return {
            data: sanitizedUsers,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async createUser(createUserDto: CreateUserDto) {
        // Check if email already exists
        const existingUser = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const userId = this.ulidService.generate();
        const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

        const newUser = this.usersRepository.create({
            id: userId,
            email: createUserDto.email,
            nickname: createUserDto.accountName,
            phone: createUserDto.phone
                ? (this.encryptionService.encryptText(createUserDto.phone) as unknown as string)
                : createUserDto.phone,
            isActive: createUserDto.isActive ?? true,
            passwordHash: hashedPassword,
        });

        await this.usersRepository.save(newUser);

        // Save role
        const userRole = this.userRolesRepository.create({
            userId: userId,
            role: createUserDto.role,
        });
        await this.userRolesRepository.save(userRole);

        const savedUser = await this.usersRepository.findOne({ where: { id: userId }, relations: ['roles'] });
        const { passwordHash, ...safeUser } = savedUser!;
        return safeUser;
    }

    async updateUser(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.usersRepository.findOne({ where: { id }, relations: ['roles'] });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.usersRepository.findOne({ where: { email: updateUserDto.email } });
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
            user.email = updateUserDto.email;
        }

        if (updateUserDto.accountName !== undefined) user.nickname = updateUserDto.accountName;
        if (updateUserDto.phone !== undefined) {
            user.phone = updateUserDto.phone
                ? (this.encryptionService.encryptText(updateUserDto.phone) as unknown as string)
                : updateUserDto.phone;
        }
        if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;

        if (updateUserDto.password) {
            user.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
        }

        await this.usersRepository.save(user);

        if (updateUserDto.role) {
            // Delete existing roles and replace with the new one
            await this.userRolesRepository.delete({ userId: id });
            const userRole = this.userRolesRepository.create({
                userId: id,
                role: updateUserDto.role,
            });
            await this.userRolesRepository.save(userRole);
        }
    }

    async deleteUser(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.usersRepository.remove(user);
    }

    // --- Companies Management ---

    async listCompanies(page: number, limit: number, search?: string) {
        const queryBuilder = this.companiesRepository.createQueryBuilder('company')
            .leftJoinAndSelect('company.client', 'client');

        if (search) {
            queryBuilder.where('company.name LIKE :search OR company.email LIKE :search', { search: `%${search}%` });
        }

        const [companies, total] = await queryBuilder
            .orderBy('company.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        // Sanitize client info
        const sanitizedCompanies = companies.map(company => {
            company.email = this.encryptionService.decryptText(company.email as unknown as Buffer) as any;
            company.phone = company.phone
                ? (this.encryptionService.decryptText(company.phone as unknown as Buffer) as any)
                : company.phone;
            if (company.client) {
                const { passwordHash, totpSecretEnc, ...safeClient } = company.client;
                company.client = safeClient as User;
            }
            return company;
        });

        return {
            data: sanitizedCompanies,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getCompanyById(id: string) {
        const company = await this.companiesRepository.findOne({ where: { id }, relations: ['client'] });
        if (!company) {
            throw new NotFoundException('Company not found');
        }

        company.email = this.encryptionService.decryptText(company.email as unknown as Buffer) as any;
        company.phone = company.phone
            ? (this.encryptionService.decryptText(company.phone as unknown as Buffer) as any)
            : company.phone;

        if (company.client) {
            const { passwordHash, totpSecretEnc, ...safeClient } = company.client;
            company.client = safeClient as User;
        }

        return company;
    }

    async createCompany(createCompanyDto: CreateCompanyDto, owner?: string) {
        const companyId = this.ulidService.generate();
        let clientId: string | null = null;

        if (createCompanyDto.clientAccountId) {
            const clientUser = await this.usersRepository.findOne({ where: { id: createCompanyDto.clientAccountId } });
            if (!clientUser) {
                throw new NotFoundException('Client User not found');
            }
            clientId = clientUser.id;
        }

        const newCompany = this.companiesRepository.create({
            id: companyId,
            name: createCompanyDto.name,
            email: this.encryptionService.encryptText(createCompanyDto.email) as unknown as string,
            contact: createCompanyDto.contact,
            phone: createCompanyDto.phone
                ? (this.encryptionService.encryptText(createCompanyDto.phone) as unknown as string)
                : createCompanyDto.phone,
            website: createCompanyDto.website,
            locationCountry: createCompanyDto.locationCountry,
            locationState: createCompanyDto.locationState,
            locationCity: createCompanyDto.locationCity,
            keyTechnologies: createCompanyDto.keyTechnologies,
            clientId: clientId,
            owner: owner || null,
        });

        await this.companiesRepository.save(newCompany);
        const savedCompany = await this.companiesRepository.findOne({ where: { id: companyId }, relations: ['client'] });
        if (savedCompany) {
            savedCompany.email = this.encryptionService.decryptText(savedCompany.email as unknown as Buffer) as any;
            savedCompany.phone = savedCompany.phone
                ? (this.encryptionService.decryptText(savedCompany.phone as unknown as Buffer) as any)
                : savedCompany.phone;
        }
        return savedCompany;
    }

    async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto) {
        const company = await this.companiesRepository.findOne({ where: { id } });
        if (!company) {
            throw new NotFoundException('Company not found');
        }

        if (updateCompanyDto.clientAccountId !== undefined) {
            if (updateCompanyDto.clientAccountId === null) {
                // Front-end implies unlinking
                company.clientId = null;
            } else {
                const clientUser = await this.usersRepository.findOne({ where: { id: updateCompanyDto.clientAccountId } });
                if (!clientUser) {
                    throw new NotFoundException('Client User not found');
                }
                company.clientId = clientUser.id;
            }
        }

        Object.assign(company, updateCompanyDto);
        delete company['clientAccountId']; // Don't assign this verbatim, we mapped it to clientId

        if (updateCompanyDto.email !== undefined) {
            company.email = this.encryptionService.encryptText(updateCompanyDto.email) as unknown as string;
        }
        if (updateCompanyDto.phone !== undefined) {
            company.phone = updateCompanyDto.phone
                ? (this.encryptionService.encryptText(updateCompanyDto.phone) as unknown as string)
                : updateCompanyDto.phone;
        }
        if (updateCompanyDto.locationCountry !== undefined) company.locationCountry = updateCompanyDto.locationCountry ?? null;
        if (updateCompanyDto.locationState !== undefined) company.locationState = updateCompanyDto.locationState ?? null;
        if (updateCompanyDto.locationCity !== undefined) company.locationCity = updateCompanyDto.locationCity ?? null;

        await this.companiesRepository.save(company);
        const savedCompany = await this.companiesRepository.findOne({ where: { id }, relations: ['client'] });
        if (savedCompany) {
            savedCompany.email = this.encryptionService.decryptText(savedCompany.email as unknown as Buffer) as any;
            savedCompany.phone = savedCompany.phone
                ? (this.encryptionService.decryptText(savedCompany.phone as unknown as Buffer) as any)
                : savedCompany.phone;
        }
        return savedCompany;
    }

    async deleteCompany(id: string) {
        const company = await this.companiesRepository.findOne({ where: { id } });
        if (!company) {
            throw new NotFoundException('Company not found');
        }
        await this.companiesRepository.remove(company);
        return { success: true };
    }

    // --- System Configs Management ---

    async getConfigs(category: string) {
        const configs = await this.systemConfigsRepository.find({ where: { category: category.toUpperCase() } });
        return configs.map((config) => ({
            ...config,
            value: config.value
                ? (this.encryptionService.decryptText(config.value as unknown as Buffer) as any)
                : config.value,
        }));
    }

    async updateConfigs(category: string, updateConfigDto: UpdateConfigDto) {
        const uppercaseCat = category.toUpperCase();
        for (const config of updateConfigDto.configs) {
            const existingConfig = await this.systemConfigsRepository.findOne({ where: { key: config.key, category: uppercaseCat } });
            const encryptedValue = config.value
                ? (this.encryptionService.encryptText(config.value) as unknown as string)
                : config.value;

            if (existingConfig) {
                existingConfig.value = encryptedValue;
                await this.systemConfigsRepository.save(existingConfig);
            } else {
                const newConfig = this.systemConfigsRepository.create({
                    key: config.key,
                    value: encryptedValue,
                    category: uppercaseCat,
                });
                await this.systemConfigsRepository.save(newConfig);
            }
        }
        return this.getConfigs(uppercaseCat);
    }

    async getEmailConfig(): Promise<EmailConfigDto> {
        return this.emailConfigService.getEmailConfig();
    }

    async updateEmailConfig(emailConfig: EmailConfigDto): Promise<EmailConfigDto> {
        return this.emailConfigService.setEmailConfig(emailConfig);
    }

    async sendTestEmail(email: string): Promise<void> {
        await this.emailService.sendTestEmail(email);
    }

    // --- Audit Logs Management ---

    async getAuditLogs(page: number, limit: number, search?: string): Promise<PaginatedAuditLogResponseDto> {
        const queryBuilder = this.auditLogsRepository.createQueryBuilder('log')
            .leftJoinAndSelect('log.actor', 'actor')
            .leftJoinAndSelect('actor.roles', 'roles');

        if (search) {
            const searchPattern = `%${search}%`;
            queryBuilder.andWhere(
                new Brackets(qb => {
                    qb.where('actor.email LIKE :search', { search: searchPattern })
                        .orWhere('actor.nickname LIKE :search', { search: searchPattern })
                        .orWhere('log.actionType LIKE :search', { search: searchPattern })
                        .orWhere('log.route LIKE :search', { search: searchPattern })
                        .orWhere('log.ipAddress LIKE :search', { search: searchPattern })
                        .orWhere('CAST(log.httpRequestBody AS CHAR) LIKE :search', { search: searchPattern });
                })
            );
        }

        const [logs, total] = await queryBuilder
            .orderBy('log.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const data: AuditLogItemDto[] = logs.map(log => ({
            id: log.id,
            createdAt: log.createdAt,
            actor: log.actor ? {
                nickname: log.actor.nickname,
                email: log.actor.email,
                roles: log.actor.roles?.map(r => r.role) || [],
            } : null,
            route: log.route,
            httpMethod: log.httpMethod,
            actionType: log.actionType,
            httpRequestBody: log.httpRequestBody,
            ipAddress: log.ipAddress,
        }));

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async exportAuditLogs(search?: string): Promise<string> {
        const queryBuilder = this.auditLogsRepository.createQueryBuilder('log')
            .leftJoinAndSelect('log.actor', 'actor')
            .leftJoinAndSelect('actor.roles', 'roles');

        if (search) {
            const searchPattern = `%${search}%`;
            queryBuilder.andWhere(
                new Brackets(qb => {
                    qb.where('actor.email LIKE :search', { search: searchPattern })
                        .orWhere('actor.nickname LIKE :search', { search: searchPattern })
                        .orWhere('log.actionType LIKE :search', { search: searchPattern })
                        .orWhere('log.route LIKE :search', { search: searchPattern })
                        .orWhere('log.ipAddress LIKE :search', { search: searchPattern })
                        .orWhere('CAST(log.httpRequestBody AS CHAR) LIKE :search', { search: searchPattern });
                })
            );
        }

        const logs = await queryBuilder
            .orderBy('log.createdAt', 'DESC')
            .getMany();

        const headers = [
            'ID',
            'Created At',
            'Actor Nickname',
            'Actor Email',
            'Actor Roles',
            'Route',
            'HTTP Method',
            'Action Type',
            'HTTP Request Body',
            'IP Address'
        ];

        const escapeCsv = (val: any): string => {
            if (val === null || val === undefined) return '';
            let str = '';
            if (val instanceof Date) {
                str = val.toISOString();
            } else if (typeof val === 'object') {
                str = JSON.stringify(val);
            } else {
                str = String(val);
            }
            str = str.replace(/"/g, '""');
            return `"${str}"`;
        };

        const rows = logs.map(log => {
            const actorRoles = log.actor?.roles?.map(r => r.role).join('; ') || '';
            return [
                escapeCsv(log.id),
                escapeCsv(log.createdAt),
                escapeCsv(log.actor?.nickname),
                escapeCsv(log.actor?.email),
                escapeCsv(actorRoles),
                escapeCsv(log.route),
                escapeCsv(log.httpMethod),
                escapeCsv(log.actionType),
                escapeCsv(log.httpRequestBody),
                escapeCsv(log.ipAddress)
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    // --- Module: AI Provider Configuration ---

    /**
     * Save AI provider configuration
     */
    async saveAIProviderConfig(config: AIProviderConfigDto): Promise<AIProviderResponseDto> {
        return await this.aiProviderConfigService.saveConfig(config);
    }

    /**
     * Get specific AI provider configuration
     */
    async getAIProviderConfig(provider: string): Promise<AIProviderResponseDto | null> {
        return await this.aiProviderConfigService.getMaskedConfig(provider);
    }

    /**
     * Get all AI provider configurations
     */
    async getAllAIProviderConfigs(): Promise<AIProvidersListResponseDto> {
        const providers = await this.aiProviderConfigService.getAllConfigs();
        return {
            providers,
        };
    }

    async getAIProviderModels(provider: string): Promise<AIProviderModelsResponseDto | null> {
        const models = await this.aiProviderConfigService.refreshProviderModels(provider);
        if (!models) {
            return null;
        }
        return {
            provider,
            models: models.models,
            defaultModel: models.defaultModel,
            updatedAt: models.updatedAt,
        };
    }

    async refreshAIProviderModels(provider: string, apiKey?: string): Promise<AIProviderModelsResponseDto | null> {
        const models = await this.aiProviderConfigService.refreshProviderModels(provider, apiKey);
        if (!models) {
            return null;
        }
        return {
            provider,
            models: models.models,
            defaultModel: models.defaultModel,
            updatedAt: models.updatedAt,
        };
    }

    async getCustomAIProviders(): Promise<CustomAIProvidersListResponseDto> {
        const providers = await this.aiProviderConfigService.getCustomProviders();
        return { providers };
    }

    async saveCustomAIProvider(dto: CustomAIProviderDto): Promise<CustomAIProviderDto> {
        return this.aiProviderConfigService.saveCustomProvider(dto);
    }

    async deleteCustomAIProvider(id: string): Promise<void> {
        return this.aiProviderConfigService.deleteCustomProvider(id);
    }

    /**
     * Delete specific AI provider configuration
     */
    async deleteAIProviderConfig(provider: string): Promise<void> {
        return await this.aiProviderConfigService.deleteConfig(provider);
    }
}
