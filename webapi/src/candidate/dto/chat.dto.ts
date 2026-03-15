import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ChatMessageDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;
}

export class ChatResponseDto {
    @ApiProperty()
    reply: string;
}
