import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Candidate {
    @ApiProperty()
    @PrimaryColumn('char', { length: 26 })
    id: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id' })
    user: User;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 500, nullable: true })
    resumeUrl: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 500, nullable: true })
    portfolioUrl: string | null;

    // ── Profile Extensions (Candidate Profile API) ────────────────────────
    @ApiProperty({ required: false, type: String })
    @Column({ type: 'text', nullable: true })
    summary: string | null;

    @ApiProperty({ required: false, type: Number })
    @Column({ type: 'int', nullable: true })
    yearsOfExperience: number | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 100, nullable: true })
    targetSalary: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 200, nullable: true })
    preferredLocation: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 500, nullable: true })
    linkedin: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    currentLocationCountry: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    currentLocationState: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 64, nullable: true })
    currentLocationCity: string | null;

    @ApiProperty({ required: false, type: Number })
    @Column({ type: 'int', nullable: true })
    noticePeriod: number | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'date', nullable: true })
    availableDate: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 50, nullable: true })
    profileStatus: string | null;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty()
    @UpdateDateColumn()
    updatedAt: Date;
}
