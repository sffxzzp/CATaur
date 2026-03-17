import { Entity, Column, PrimaryColumn, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { UserRole } from './user-role.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from './company.entity';
import { Candidate } from './candidate.entity';

@Entity()
export class User {
    @ApiProperty({ description: 'The unique identifier of the user' })
    @PrimaryColumn('char', { length: 26 })
    id: string;



    @ApiProperty({ description: 'The email of the user' })
    @Column({ unique: true })
    email: string;

    @ApiProperty({ description: 'The nickname of the user' })
    @Column({ type: 'varchar', length: 200 })
    nickname: string;

    @ApiProperty({ description: 'The avatar URL of the user', required: false, type: String })
    @Column({ type: 'varchar', length: 255, nullable: true })
    avatarUrl: string | null;

    @ApiProperty({ description: 'A short bio of the user', required: false, type: String })
    @Column({ type: 'text', nullable: true })
    bio: string | null;

    @ApiProperty({ description: 'The phone number of the user', required: false, type: String })
    @Column({ type: 'blob', nullable: true })
    phone: Buffer | string | null;

    @ApiProperty({ description: 'Whether the user is active' })
    @Column({ default: false })
    isActive: boolean;

    @ApiProperty({ description: 'The password hash of the user', writeOnly: true })
    @Column({ nullable: false })
    passwordHash: string;

    @ApiProperty({ description: 'Whether TOTP MFA is enabled', default: false, writeOnly: true })
    @Column({ default: false })
    totpEnabled: boolean;

    @ApiProperty({ description: 'Encrypted TOTP secret', required: false, type: String, writeOnly: true })
    @Column({ type: 'text', nullable: true })
    totpSecretEnc: string | null;

    @ApiProperty({ description: 'TOTP verification time', required: false, type: Date, writeOnly: true })
    @Column({ type: 'datetime', nullable: true })
    totpVerifiedAt: Date | null;

    @ApiProperty({ description: 'The date the user was created' })
    @CreateDateColumn()
    createdAt: Date;

    @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
    roles: UserRole[];

    @OneToMany(() => Company, (company) => company.client)
    companies: Company[];

    @OneToOne(() => Candidate, (candidate) => candidate.user)
    candidateProfile: Candidate;
}
