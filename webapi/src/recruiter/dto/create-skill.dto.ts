import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export class CreateSkillDto {
    @ApiProperty()
    @IsString()
    skillName: string;

    @ApiProperty({ enum: ['Expert', 'Intermediate', 'Beginner'] })
    @IsIn(['Expert', 'Intermediate', 'Beginner'])
    skillLevel: 'Expert' | 'Intermediate' | 'Beginner';
}

