import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsEmail()
    email: string;

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
