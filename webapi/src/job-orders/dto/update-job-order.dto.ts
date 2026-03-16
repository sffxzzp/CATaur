import { IsString, IsOptional, IsArray, IsInt, IsIn, Min, IsISO31661Alpha2 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type { JobOrderEmploymentType, JobOrderWorkArrangement } from '../../database/entities/job-order.entity';

export class UpdateJobOrderDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    companyId?: string;

    @ApiProperty({ enum: ['high', 'medium', 'low'], required: false })
    @IsOptional()
    @IsIn(['high', 'medium', 'low'])
    priority?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    openings?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    salary?: string;

    @ApiProperty({ required: false, enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Permanent'] })
    @IsOptional()
    @IsIn(['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Permanent'])
    employmentType?: JobOrderEmploymentType;

    @ApiProperty({ required: false, enum: ['Remote', 'Hybrid', 'Onsite'] })
    @IsOptional()
    @IsIn(['Remote', 'Hybrid', 'Onsite'])
    workArrangement?: JobOrderWorkArrangement;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsISO31661Alpha2()
    locationCountry?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    locationState?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    locationCity?: string;

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

export class UpdateJobOrderStatusDto {
    @ApiProperty({ enum: ['active', 'onhold', 'closed'] })
    @IsIn(['active', 'onhold', 'closed'])
    status: string;
}
