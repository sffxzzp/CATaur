import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { IsStrongPassword } from '../../common/decorators/is-strong-password.decorator';
import { Role } from '../../database/entities/user-role.entity';

export class RegisterDto {
    @ApiProperty({ description: 'The email of the user', example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'The password for the account', example: 'SecurePass123!' })
    @IsString()
    @IsStrongPassword()
    password: string;

    @ApiProperty({ description: 'The nickname of the user', example: 'user123' })
    @IsString()
    nickname: string;

    @ApiProperty({ description: 'The role of the user', enum: Role, required: false })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
