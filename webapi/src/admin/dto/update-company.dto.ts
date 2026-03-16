import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    contact?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    locationCountry?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    locationState?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    locationCity?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    keyTechnologies?: string;

    @ApiPropertyOptional({ description: 'ID of a Client user to link to this company' })
    @IsOptional()
    @IsString()
    clientAccountId?: string;
}
