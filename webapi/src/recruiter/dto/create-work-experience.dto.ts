import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateWorkExperienceDto {
    @ApiProperty()
    @IsString()
    role: string;

    @ApiProperty()
    @IsString()
    company: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isCurrent?: boolean;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    highlights?: string[];
}

