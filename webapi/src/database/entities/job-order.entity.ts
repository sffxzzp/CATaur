import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { Application } from './application.entity';
import { ApiProperty } from '@nestjs/swagger';

export type JobOrderStatus = 'active' | 'onhold' | 'closed';
export type JobOrderPriority = 'high' | 'medium' | 'low';
export type JobOrderEmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Temporary' | 'Internship' | 'Permanent';
export type JobOrderWorkArrangement = 'Remote' | 'Hybrid' | 'Onsite';

@Entity()
export class JobOrder {
    @ApiProperty()
    @PrimaryColumn('char', { length: 26 })
    id: string;

    @ApiProperty()
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'text', nullable: true })
    description: string | null;

    @ApiProperty()
    @Column({
        type: 'varchar',
        length: 20,
        default: 'active',
    })
    status: JobOrderStatus;

    @ApiProperty()
    @Column({
        type: 'varchar',
        length: 10,
        default: 'medium',
    })
    priority: JobOrderPriority;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'blob', nullable: true })
    location: Buffer | string | null;

    @ApiProperty()
    @Column({ type: 'int', default: 1 })
    openings: number;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'blob', nullable: true })
    salary: Buffer | string | null;

    /** JSON array of tag strings, e.g. ["Go", "PostgreSQL"] */
    @ApiProperty({ required: false, type: [String] })
    @Column({ type: 'simple-json', nullable: true })
    tags: string[] | null;

    // ── Relations ──────────────────────────────────────────
    @ApiProperty({ required: false, type: String })
    @Column({ type: 'char', length: 26, nullable: true })
    companyId: string | null;

    @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @OneToMany(() => Application, application => application.jobOrder)
    applications: Application[];

    @ApiProperty({ required: false, enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Permanent'] })
    @Column({ type: 'varchar', length: 20, nullable: true })
    employmentType: JobOrderEmploymentType | null;

    @ApiProperty({ required: false, enum: ['Remote', 'Hybrid', 'Onsite'] })
    @Column({ type: 'varchar', length: 10, nullable: true })
    workArrangement: JobOrderWorkArrangement | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    locationCountry: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    locationState: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    locationCity: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 255, nullable: true })
    owner: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
