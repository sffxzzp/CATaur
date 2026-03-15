import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Candidate } from './candidate.entity';

export type CandidateSkillLevel = 'Expert' | 'Intermediate' | 'Beginner';

@Entity()
@Index(['candidateId'])
export class CandidateSkill {
    @ApiProperty()
    @PrimaryColumn('char', { length: 26 })
    id: string;

    @ApiProperty()
    @Column({ type: 'char', length: 26 })
    candidateId: string;

    @ManyToOne(() => Candidate, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'candidateId' })
    candidate: Candidate;

    @ApiProperty()
    @Column({ type: 'varchar', length: 100 })
    skillName: string;

    @ApiProperty({ enum: ['Expert', 'Intermediate', 'Beginner'] })
    @Column({ type: 'varchar', length: 20 })
    skillLevel: CandidateSkillLevel;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}

