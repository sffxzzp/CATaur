import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GithubLoginDto {
    @ApiProperty({ description: 'The Firebase ID Token obtained from the client side' })
    @IsString()
    @IsNotEmpty()
    idToken: string;
}
