import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateEducationDto {
    @ApiProperty()
    @IsString()
    school: string;

    @ApiProperty()
    @IsString()
    degree: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    fieldOfStudy?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(0)
    graduationYear?: number;
}

