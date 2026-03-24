import { IsString, IsNotEmpty, IsOptional, Matches, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
}

export const BUILTIN_AI_PROVIDERS = Object.values(AIProvider);

export class AIProviderConfigDto {
  @ApiProperty({ example: 'openai' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  defaultModel?: string;

  @ApiProperty({ required: false, description: 'Azure OpenAI endpoint base URL' })
  @IsString()
  @IsOptional()
  baseUrl?: string;

  @ApiProperty({ required: false, description: 'Azure OpenAI API version' })
  @IsString()
  @IsOptional()
  apiVersion?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class AIProviderResponseDto {
  @ApiProperty({ example: 'openai' })
  provider: string;

  @ApiProperty()
  apiKey: string;

  @ApiProperty()
  defaultModel?: string;

  @ApiProperty({ required: false })
  baseUrl?: string;

  @ApiProperty({ required: false })
  apiVersion?: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  updatedAt: number;
}

export class AIProvidersListResponseDto {
  @ApiProperty({ type: [AIProviderResponseDto] })
  providers: AIProviderResponseDto[];
}

export class CustomAIProviderDto {
  @ApiProperty({ example: 'my-provider' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9][a-z0-9_-]{2,48}$/)
  id: string;

  @ApiProperty({ example: 'My Provider' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'https://api.example.com' })
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({ enum: ['openai', 'anthropic', 'gemini', 'ollama'] })
  @IsString()
  @IsNotEmpty()
  providerType: 'openai' | 'anthropic' | 'gemini' | 'ollama';
}

export class CustomAIProvidersListResponseDto {
  @ApiProperty({ type: [CustomAIProviderDto] })
  providers: CustomAIProviderDto[];
}

export class AIProviderModelsResponseDto {
  @ApiProperty({ example: 'openai' })
  provider: string;

  @ApiProperty({ type: [String] })
  models: string[];

  @ApiProperty({ required: false })
  defaultModel?: string;

  @ApiProperty()
  enabled: boolean;

  @ApiProperty()
  updatedAt: number;
}
