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

@Entity()
@Index(['candidateId'])
export class CandidateEducation {
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
    @Column({ type: 'varchar', length: 200 })
    school: string;

    @ApiProperty()
    @Column({ type: 'varchar', length: 200 })
    degree: string;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 200, nullable: true })
    fieldOfStudy: string | null;

    @ApiProperty({ required: false, type: Number })
    @Column({ type: 'int', nullable: true })
    graduationYear: number | null;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}

