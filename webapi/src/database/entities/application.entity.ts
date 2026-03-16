import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { JobOrder } from './job-order.entity';
import { ApiProperty } from '@nestjs/swagger';

export type ApplicationStatus = 'new' | 'interview' | 'offer' | 'closed';
export type ApplicationSource = 'self_applied' | 'recruiter_import';
export type ClientDecisionType = 'request-offer' | 'pass' | 'hold';

@Entity()
export class Application {
    @ApiProperty()
    @PrimaryColumn('char', { length: 26 })
    id: string;

    // ── Core Relations ─────────────────────────────────────
    @Column({ type: 'char', length: 26 })
    jobOrderId: string;

    @ManyToOne(() => JobOrder, { onDelete: 'CASCADE', eager: false })
    @JoinColumn({ name: 'jobOrderId' })
    jobOrder: JobOrder;

    /** The candidate (User with role=Candidate) */
    @Column({ type: 'char', length: 26 })
    candidateId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'candidateId' })
    candidate: User;

    // ── Status ────────────────────────────────────────────
    @ApiProperty()
    @Column({ type: 'varchar', length: 20, default: 'new' })
    status: ApplicationStatus;

    @ApiProperty()
    @Column({ type: 'varchar', length: 20, default: 'recruiter_import' })
    source: ApplicationSource;

    // ── Candidate Info ────────────────────────────────────
    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 2, nullable: true })
    locationCountry: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    locationState: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    locationCity: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'longblob', nullable: true })
    recruiterNotes: Buffer | string | null;

    // ── Interview Details (populated when status → interview) ──
    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 50, nullable: true })
    interviewType: string | null;  // Zoom | Phone | Onsite

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 100, nullable: true })
    interviewDate: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 100, nullable: true })
    interviewTime: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'blob', nullable: true })
    interviewSubject: Buffer | string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'longblob', nullable: true })
    interviewContent: Buffer | string | null;

    @ApiProperty({ required: false, type: Date })
    @Column({ type: 'datetime', nullable: true })
    interviewSentAt: Date | null;

    // ── Client Decision ───────────────────────────────────
    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 20, nullable: true })
    clientDecisionType: ClientDecisionType | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'longblob', nullable: true })
    clientDecisionNote: Buffer | string | null;

    @ApiProperty({ required: false, type: Date })
    @Column({ type: 'datetime', nullable: true })
    clientDecisionAt: Date | null;

    // ── Timestamps ────────────────────────────────────────
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
