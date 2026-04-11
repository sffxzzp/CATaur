import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContentSafetyCheckDto {
    @ApiProperty({ description: 'Job title to check' })
    @IsString()
    @MaxLength(500)
    title: string;

    @ApiPropertyOptional({ description: 'Job description to check' })
    @IsString()
    @IsOptional()
    @MaxLength(20000)
    description?: string;
}
