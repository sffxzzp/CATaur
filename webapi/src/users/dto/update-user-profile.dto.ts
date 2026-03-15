import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserProfileDto {
    @ApiPropertyOptional({ description: 'The nickname of the user', maxLength: 50 })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    nickname?: string;

    @ApiPropertyOptional({ description: 'The email of the user' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ description: 'The phone number of the user' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    phone?: string;
}
