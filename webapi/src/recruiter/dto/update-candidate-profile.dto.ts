import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, IsDateString } from 'class-validator';

export class UpdateCandidateProfileDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    summary?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    yearsOfExperience?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    targetSalary?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    preferredLocation?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    linkedin?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentLocationCountry?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentLocationState?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentLocationCity?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    currentLocation?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    noticePeriod?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    availableDate?: string;

    @ApiPropertyOptional({ description: 'Profile status (draft | active)' })
    @IsOptional()
    @IsString()
    profileStatus?: string;
}

