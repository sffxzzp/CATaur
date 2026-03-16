import { Entity, Column, PrimaryColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Company {
    @ApiProperty()
    @PrimaryColumn('char', { length: 26 })
    id: string;

    @ApiProperty()
    @Column()
    name: string;

    @ApiProperty()
    @Column({ type: 'blob' })
    email: Buffer | string;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 255, nullable: true })
    contact: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'blob', nullable: true })
    phone: Buffer | string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 255, nullable: true })
    website: string | null;

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
    @Column({ type: 'text', nullable: true })
    keyTechnologies: string | null;

    @ManyToOne(() => User, user => user.companies, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'clientId' })
    client: User;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'char', length: 26, nullable: true })
    clientId: string | null;

    @ApiProperty({ required: false, type: String })
    @Column({ type: 'varchar', length: 255, nullable: true })
    owner: string | null;

    @ApiProperty()
    @CreateDateColumn()
    createdAt: Date;
}
