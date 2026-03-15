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
export class CandidateWorkExperience {
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
    role: string;

    @ApiProperty()
    @Column({ type: 'varchar', length: 200 })
    company: string;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'date', nullable: true })
    startDate: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'date', nullable: true })
    endDate: string | null;

    @ApiProperty({ required: false, type: Boolean })
    @Column({ type: 'boolean', default: false })
    isCurrent: boolean;

    /**
     * Stored as JSON string array in DB for MVP simplicity.
     * Example: ["Did X", "Improved Y"]
     */
    @ApiProperty({ required: false, type: String })
    @Column({ type: 'text', nullable: true })
    highlights: string | null;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}

