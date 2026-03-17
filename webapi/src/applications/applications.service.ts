import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Application } from '../database/entities/application.entity';
import { JobOrder } from '../database/entities/job-order.entity';
import { User } from '../database/entities/user.entity';
import {
    CreateApplicationDto,
    UpdateApplicationStatusDto,
    SubmitDecisionDto,
    BulkImportDto,
} from './dto/application.dto';
import { UlidService } from '../common/ulid.service';
import { EmailService } from '../common/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class ApplicationsService {
    private readonly logger = new Logger(ApplicationsService.name);

    constructor(
        @InjectRepository(Application)
        private repo: Repository<Application>,
        @InjectRepository(JobOrder)
        private jobOrderRepo: Repository<JobOrder>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private ulidService: UlidService,
        private emailService: EmailService,
        private notificationsService: NotificationsService,
        private encryptionService: EncryptionService,
    ) {}

    /**
     * scope:
     *   Client    → { jobOrder: { companyId: In([...]) } }
     *   Admin     → {}
     */
    async findAll(
        scope: Partial<{ companyIds: string[]; candidateId: string }>,
        opts: { page?: number; limit?: number; status?: string; jobOrderId?: string; search?: string; location?: string } = {},
    ) {
        const { page = 1, limit = 20, status, jobOrderId, search, location } = opts;

        const qb = this.repo.createQueryBuilder('app')
            .leftJoinAndSelect('app.candidate', 'candidate')
            .leftJoinAndSelect('app.jobOrder', 'jobOrder')
            .leftJoinAndSelect('jobOrder.company', 'company');

        if (scope.companyIds?.length) {
            qb.andWhere('jobOrder.companyId IN (:...cids)', { cids: scope.companyIds });
        }
        if (scope.candidateId) {
            qb.andWhere('app.candidateId = :candidateId', { candidateId: scope.candidateId });
        }
        if (status) qb.andWhere('app.status = :status', { status });
        if (jobOrderId) qb.andWhere('app.jobOrderId = :jobOrderId', { jobOrderId });
        if (search) {
            qb.andWhere('(candidate.nickname LIKE :s OR candidate.email LIKE :s OR jobOrder.title LIKE :s)', {
                s: `%${search}%`,
            });
        }
        if (location) {
            // Filter by location (city or state)
            const all = await qb.orderBy('app.createdAt', 'DESC').getMany();
            const normalized = location.trim().toLowerCase();
            const filtered = all
                .map((a) => this.decryptApplication(a))
                .filter((a) => {
                    const city = (a.locationCity ?? '').toLowerCase();
                    const state = (a.locationState ?? '').toLowerCase();
                    return city.includes(normalized) || state.includes(normalized);
                });

            const total = filtered.length;
            const start = (page - 1) * limit;
            const end = start + limit;

            return {
                data: filtered.slice(start, end),
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            };
        }

        const [data, total] = await qb
            .orderBy('app.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            data: data.map((app) => this.decryptApplication(app)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findOne(
        id: string,
        scope: Partial<{ companyIds: string[] }> = {},
    ): Promise<Application> {
        const app = await this.getApplication(id, scope);
        return this.decryptApplication(app);
    }

    async create(
        dto: CreateApplicationDto,
        source: 'self_applied' | 'recruiter_import',
    ): Promise<Application> {
        const app = this.repo.create({
            id: this.ulidService.generate(),
            jobOrderId: dto.jobOrderId,
            candidateId: dto.candidateId,
            status: 'new',
            source,
            locationCountry: dto.locationCountry ?? null,
            locationState: dto.locationState ?? null,
            locationCity: dto.locationCity ?? null,
            recruiterNotes: dto.recruiterNotes
                ? this.encryptionService.encryptText(dto.recruiterNotes)
                : dto.recruiterNotes ?? null,
        });
        await this.repo.save(app);
        this.logger.log(`Application created: ${app.id} (${source}) candidate=${dto.candidateId} job=${dto.jobOrderId}`);
        const saved = await this.findOne(app.id);
        return saved;
    }

    async bulkImport(dto: BulkImportDto): Promise<Application[]> {
        const results: Application[] = [];
        for (const c of dto.candidates) {
            // Find or create a ghost user for the candidate
            let candidate = await this.userRepo.findOne({ where: { email: c.email } });
            if (!candidate) {
                candidate = this.userRepo.create({
                    id: this.ulidService.generate(),
                    email: c.email,
                    nickname: c.name,
                    passwordHash: '',  // no login allowed until they self-register
                    isActive: false,
                    phone: c.phone
                        ? (this.encryptionService.encryptText(c.phone) as unknown as string)
                        : c.phone ?? null,
                });
                await this.userRepo.save(candidate);
            }
            const app = await this.create(
                {
                    jobOrderId: dto.jobOrderId,
                    candidateId: candidate.id,
                    locationCountry: c.locationCountry,
                    locationState: c.locationState,
                    locationCity: c.locationCity,
                },
                'recruiter_import',
            );
            results.push(app);
        }
        this.logger.log(`Bulk import: ${results.length} applications created for job ${dto.jobOrderId}`);
        return results;
    }

    async updateStatus(
        id: string,
        dto: UpdateApplicationStatusDto,
        scope: Partial<{ companyIds: string[] }> = {},
    ): Promise<Application> {
        const app = await this.getApplication(id, scope);
        const prevStatus = app.status;
        app.status = dto.status as any;

        if (dto.status === 'interview') {
            if (!dto.interviewDate || !dto.interviewContent) {
                throw new BadRequestException('Interview date and content are required');
            }
            app.interviewSubject = dto.interviewSubject
                ? (this.encryptionService.encryptText(dto.interviewSubject) as unknown as string)
                : (this.encryptionService.encryptText(`Interview Invitation — ${app.jobOrder?.title}`) as unknown as string);
            app.interviewType = dto.interviewType ?? 'Zoom';
            app.interviewDate = dto.interviewDate;
            app.interviewTime = dto.interviewTime ?? '';
            app.interviewContent = this.encryptionService.encryptText(dto.interviewContent) as unknown as string;

            const emailSubject = dto.interviewSubject
                ? dto.interviewSubject
                : `Interview Invitation — ${app.jobOrder?.title}`;
            const emailContent = dto.interviewContent;
            app.interviewSentAt = new Date();

            // Send interview email to candidate
            await this.emailService.sendInterviewInvitation(
                app.candidate.email,
                emailSubject,
                emailContent,
            ).catch((err) => {
                this.logger.error(`Failed to send interview email for application ${id}: ${err?.message}`);
            });

            // Create in-app notification for candidate
            const when = `${dto.interviewDate ?? ''}${dto.interviewTime ? ` ${dto.interviewTime}` : ''}`.trim();
            const title = 'Interview Scheduled';
            const jobTitle = app.jobOrder?.title ?? 'the role';
            const body = `Your interview for ${jobTitle}${when ? ` is scheduled on ${when}` : ''}. Please check your email for details.`;
            await this.notificationsService.create(
                app.candidateId,
                'interview_scheduled',
                title,
                body,
                app.id,
            ).catch((err) => {
                this.logger.error(`Failed to create interview notification for candidate (app ${id}): ${err?.message}`);
            });
        }

        if (dto.status === 'offer' && prevStatus !== 'offer') {
            const jobTitle = app.jobOrder?.title ?? 'the role';
            const companyName = app.jobOrder?.company?.name ?? 'our client';

            // Notify the candidate (in-app + email)
            await this.notificationsService.create(
                app.candidateId,
                'offer_extended',
                'Offer Extended',
                `An offer has been extended for ${jobTitle} at ${companyName}. Please check your email for details.`,
                app.id,
            ).catch((err) => {
                this.logger.error(`Failed to create offer notification for candidate (app ${id}): ${err?.message}`);
            });

            const offerEmailContent = dto.offerContent?.trim()
                ? dto.offerContent.trim()
                : [
                    `Hi ${app.candidate?.nickname ?? ''}`.trim() || 'Hi,',
                    '',
                    `Good news — an offer has been extended for ${jobTitle} at ${companyName}.`,
                    '',
                    'Please reply to this email or contact your recruiter for the next steps.',
                    '',
                    'CATaur Recruiting Platform',
                ].join('\n');

            await this.emailService.sendOfferNotification(
                app.candidate.email,
                jobTitle,
                offerEmailContent,
            ).catch((err) => {
                this.logger.error(`Failed to send offer email for application ${id}: ${err?.message}`);
            });

            // Notify the client that an offer is being extended
            const jo = await this.jobOrderRepo.findOne({
                where: { id: app.jobOrderId },
                relations: ['company'],
            });
            if (jo?.company?.clientId) {
                await this.notificationsService.create(
                    jo.company.clientId,
                    'offer_extended',
                    'Offer Extended',
                    `An offer has been extended to ${app.candidate.nickname} for ${jo.title}.`,
                    app.id,
                );
            }
        }

        await this.repo.save(app);
        this.logger.log(`Application ${id} status updated to "${dto.status}"`);
        return this.decryptApplication(app);
    }

    async submitDecision(
        id: string,
        dto: SubmitDecisionDto,
        companyIds: string[],
    ): Promise<Application> {
        const app = await this.getApplication(id, { companyIds });
        app.clientDecisionType = dto.type as any;
        app.clientDecisionNote = dto.note
            ? (this.encryptionService.encryptText(dto.note) as unknown as string)
            : dto.note ?? null;
        app.clientDecisionAt = new Date();
        await this.repo.save(app);

        this.logger.log(`Client decision "${dto.type}" received for application ${id}`);
        return this.decryptApplication(app);
    }

    async findRecruiterCandidates(
        recruiterId: string,
        opts: { page?: number; limit?: number; status?: string; jobOrderId?: string; search?: string; location?: string } = {},
    ) {
        return this.findAll({}, opts);
    }

    async findRecruiterCandidateById(recruiterId: string, id: string) {
        return this.findOne(id, {});
    }

    async updateRecruiterCandidate(
        recruiterId: string,
        id: string,
        dto: {
            location?: string;
            availability?: string;
            recruiterNotes?: string;
            status?: 'new' | 'interview' | 'offer' | 'closed';
            nickname?: string;
            email?: string;
            phone?: string;
        },
    ) {
        return this.updateApplicationCandidate(id, dto, {});
    }

    async updateApplicationCandidate(
        id: string,
        dto: {
            locationCountry?: string;
            locationState?: string;
            locationCity?: string;
            recruiterNotes?: string;
            status?: 'new' | 'interview' | 'offer' | 'closed';
            nickname?: string;
            email?: string;
            phone?: string;
        },
        scope: Partial<{ companyIds: string[] }> = {},
    ) {
        const app = await this.getApplication(id, scope);

        if (dto.locationCountry !== undefined) app.locationCountry = dto.locationCountry ?? null;
        if (dto.locationState !== undefined) app.locationState = dto.locationState ?? null;
        if (dto.locationCity !== undefined) app.locationCity = dto.locationCity ?? null;
        if (dto.recruiterNotes !== undefined) {
            app.recruiterNotes = dto.recruiterNotes
                ? this.encryptionService.encryptText(dto.recruiterNotes)
                : dto.recruiterNotes;
        }
        if (dto.status !== undefined) app.status = dto.status;

        const candidate = await this.userRepo.findOne({ where: { id: app.candidateId } });
        if (!candidate) {
            throw new NotFoundException('Candidate user not found');
        }

        if (dto.email !== undefined && dto.email !== candidate.email) {
            const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
            if (existingUser) {
                throw new ConflictException('Email already in use');
            }
            candidate.email = dto.email;
        }

        if (dto.nickname !== undefined) candidate.nickname = dto.nickname;
        if (dto.phone !== undefined) {
            candidate.phone = dto.phone
                ? (this.encryptionService.encryptText(dto.phone) as unknown as string)
                : dto.phone;
        }

        await this.userRepo.save(candidate);
        await this.repo.save(app);

        return this.findOne(id, scope);
    }

    async delete(id: string): Promise<void> {
        const app = await this.repo.findOne({ where: { id } });
        if (!app) throw new NotFoundException('Application not found');
        await this.repo.remove(app);
        this.logger.log(`Application deleted: ${id}`);
    }

    private async getApplication(
        id: string,
        scope: Partial<{ companyIds: string[] }> = {},
    ): Promise<Application> {
        const app = await this.repo.findOne({
            where: { id },
            relations: ['candidate', 'candidate.candidateProfile', 'jobOrder', 'jobOrder.company'],
        });
        if (!app) throw new NotFoundException('Application not found');

        if (scope.companyIds?.length && !scope.companyIds.includes(app.jobOrder?.companyId ?? '')) {
            throw new NotFoundException('Application not found');
        }

        if (app.candidate?.phone) {
            app.candidate.phone = this.encryptionService.decryptText(
                app.candidate.phone as unknown as Buffer,
            ) as any;
        }
        if (app.jobOrder?.salary) {
            app.jobOrder.salary = this.encryptionService.decryptText(
                app.jobOrder.salary as unknown as Buffer,
            ) as any;
        }
        if (app.jobOrder?.location) {
            app.jobOrder.location = this.encryptionService.decryptText(
                app.jobOrder.location as unknown as Buffer,
            ) as any;
        }
        if (app.jobOrder?.company?.email) {
            app.jobOrder.company.email = this.encryptionService.decryptText(
                app.jobOrder.company.email as unknown as Buffer,
            ) as any;
        }
        if (app.jobOrder?.company?.phone) {
            app.jobOrder.company.phone = this.encryptionService.decryptText(
                app.jobOrder.company.phone as unknown as Buffer,
            ) as any;
        }

        return app;
    }

    private decryptApplication(application: Application): Application {
        application.recruiterNotes = Buffer.isBuffer(application.recruiterNotes)
            ? (this.encryptionService.decryptText(application.recruiterNotes) as any)
            : application.recruiterNotes;
        application.interviewSubject = Buffer.isBuffer(application.interviewSubject)
            ? (this.encryptionService.decryptText(application.interviewSubject) as any)
            : application.interviewSubject;
        application.interviewContent = Buffer.isBuffer(application.interviewContent)
            ? (this.encryptionService.decryptText(application.interviewContent) as any)
            : application.interviewContent;
        application.clientDecisionNote = Buffer.isBuffer(application.clientDecisionNote)
            ? (this.encryptionService.decryptText(application.clientDecisionNote) as any)
            : application.clientDecisionNote;
        if (application.candidate?.phone && Buffer.isBuffer(application.candidate.phone)) {
            application.candidate.phone = this.encryptionService.decryptText(application.candidate.phone) as any;
        }
        if (application.jobOrder?.salary && Buffer.isBuffer(application.jobOrder.salary)) {
            application.jobOrder.salary = this.encryptionService.decryptText(application.jobOrder.salary) as any;
        }
        if (application.jobOrder?.location && Buffer.isBuffer(application.jobOrder.location)) {
            application.jobOrder.location = this.encryptionService.decryptText(application.jobOrder.location) as any;
        }
        if (application.jobOrder?.company?.email && Buffer.isBuffer(application.jobOrder.company.email)) {
            application.jobOrder.company.email = this.encryptionService.decryptText(application.jobOrder.company.email) as any;
        }
        if (application.jobOrder?.company?.phone && Buffer.isBuffer(application.jobOrder.company.phone)) {
            application.jobOrder.company.phone = this.encryptionService.decryptText(application.jobOrder.company.phone) as any;
        }
        return application;
    }
}
