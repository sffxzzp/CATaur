import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Candidate } from '../database/entities/candidate.entity';
import { CandidateSkill } from '../database/entities/candidate-skill.entity';
import { CandidateWorkExperience } from '../database/entities/candidate-work-experience.entity';
import { CandidateEducation } from '../database/entities/candidate-education.entity';
import { Application } from '../database/entities/application.entity';
import { JobOrder } from '../database/entities/job-order.entity';
import { UlidService } from '../common/ulid.service';
import { EncryptionService } from '../common/encryption.service';
import { Role } from '../database/entities/user-role.entity';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';
import { CreateEducationDto } from './dto/create-education.dto';

@Injectable()
export class CandidateProfileService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Candidate)
        private candidateRepo: Repository<Candidate>,
        @InjectRepository(CandidateSkill)
        private skillRepo: Repository<CandidateSkill>,
        @InjectRepository(CandidateWorkExperience)
        private workRepo: Repository<CandidateWorkExperience>,
        @InjectRepository(CandidateEducation)
        private eduRepo: Repository<CandidateEducation>,
        @InjectRepository(Application)
        private appRepo: Repository<Application>,
        private ulidService: UlidService,
        private encryptionService: EncryptionService,
    ) {}

    private isAdmin(actor: User): boolean {
        return Boolean(actor.roles?.some((r) => r.role === Role.ADMIN));
    }

    private async assertCandidateAccessible(actor: User, candidateId: string): Promise<void> {
        if (this.isAdmin(actor)) {
            return;
        }

        // Candidates can always access their own profile
        if (actor.id === candidateId) {
            return;
        }

        const exists = await this.appRepo.createQueryBuilder('app')
            .innerJoin(JobOrder, 'jo', 'jo.id = app.jobOrderId')
            .where('app.candidateId = :candidateId', { candidateId })
            .andWhere('jo.assignedToId = :rid', { rid: actor.id })
            .select('app.id')
            .limit(1)
            .getOne();

        if (!exists) {
            throw new NotFoundException('Candidate not found');
        }
    }

    private async ensureCandidate(candidateId: string): Promise<Candidate> {
        const existing = await this.candidateRepo.findOne({ where: { id: candidateId } });
        if (existing) return existing;

        const created = this.candidateRepo.create({
            id: candidateId,
            resumeUrl: null,
            portfolioUrl: null,
            summary: null,
            yearsOfExperience: null,
            targetSalary: null,
            preferredLocation: null,
            linkedin: null,
            phone: null,
            currentLocationCountry: null,
            currentLocationState: null,
            currentLocationCity: null,
            noticePeriod: null,
            availableDate: null,
            profileStatus: 'draft',
        });

        return this.candidateRepo.save(created);
    }

    private decryptUserPhone(user: User): string | null {
        if (!user.phone) return null;
        if (Buffer.isBuffer(user.phone)) {
            return this.encryptionService.decryptText(user.phone);
        }
        return String(user.phone);
    }

    async getProfile(actor: User, candidateId: string) {
        await this.assertCandidateAccessible(actor, candidateId);

        const user = await this.userRepo.findOne({ where: { id: candidateId } });
        if (!user) {
            throw new NotFoundException('Candidate user not found');
        }

        const candidate = await this.ensureCandidate(candidateId);

        const [skills, workExperience, education] = await Promise.all([
            this.skillRepo.find({ where: { candidateId }, order: { updatedAt: 'DESC' } }),
            this.workRepo.find({ where: { candidateId }, order: { updatedAt: 'DESC' } }),
            this.eduRepo.find({ where: { candidateId }, order: { updatedAt: 'DESC' } }),
        ]);

        return {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            phone: this.decryptUserPhone(user),

            summary: candidate.summary ?? null,
            yearsOfExperience: candidate.yearsOfExperience ?? null,
            targetSalary: candidate.targetSalary ?? null,
            preferredLocation: candidate.preferredLocation ?? null,
            linkedin: candidate.linkedin ?? null,
            resumeUrl: candidate.resumeUrl ?? null,
            portfolioUrl: candidate.portfolioUrl ?? null,
            currentLocationCountry: candidate.currentLocationCountry ?? null,
            currentLocationState: candidate.currentLocationState ?? null,
            currentLocationCity: candidate.currentLocationCity ?? null,
            noticePeriod: candidate.noticePeriod ?? null,
            availableDate: candidate.availableDate ?? null,
            profileStatus: candidate.profileStatus ?? null,

            skills,
            workExperience,
            education,
        };
    }

    async updateProfile(actor: User, candidateId: string, dto: UpdateCandidateProfileDto) {
        await this.assertCandidateAccessible(actor, candidateId);

        const user = await this.userRepo.findOne({ where: { id: candidateId } });
        if (!user) {
            throw new NotFoundException('Candidate user not found');
        }

        const candidate = await this.ensureCandidate(candidateId);

        if (dto.summary !== undefined) candidate.summary = dto.summary ?? null;
        if (dto.yearsOfExperience !== undefined) candidate.yearsOfExperience = dto.yearsOfExperience ?? null;
        if (dto.targetSalary !== undefined) candidate.targetSalary = dto.targetSalary ?? null;
        if (dto.preferredLocation !== undefined) candidate.preferredLocation = dto.preferredLocation ?? null;
        if (dto.linkedin !== undefined) candidate.linkedin = dto.linkedin ?? null;
        if (dto.currentLocationCountry !== undefined) candidate.currentLocationCountry = dto.currentLocationCountry ?? null;
        if (dto.currentLocationState !== undefined) candidate.currentLocationState = dto.currentLocationState ?? null;
        if (dto.currentLocationCity !== undefined) candidate.currentLocationCity = dto.currentLocationCity ?? null;
        if (dto.noticePeriod !== undefined) candidate.noticePeriod = dto.noticePeriod ?? null;
        if (dto.availableDate !== undefined) candidate.availableDate = dto.availableDate ?? null;
        if (dto.profileStatus !== undefined) candidate.profileStatus = dto.profileStatus ?? null;

        if (dto.phone !== undefined) {
            candidate.phone = dto.phone ?? null;
            user.phone = dto.phone
                ? (this.encryptionService.encryptText(String(dto.phone)) as any)
                : null;
            await this.userRepo.save(user);
        }

        await this.candidateRepo.save(candidate);
        return this.getProfile(actor, candidateId);
    }

    // ── Skills ───────────────────────────────────────────────────────────
    async addSkill(actor: User, candidateId: string, dto: CreateSkillDto) {
        await this.assertCandidateAccessible(actor, candidateId);
        await this.ensureCandidate(candidateId);

        const skill = this.skillRepo.create({
            id: this.ulidService.generate(),
            candidateId,
            skillName: dto.skillName,
            skillLevel: dto.skillLevel,
        });
        return this.skillRepo.save(skill);
    }

    async updateSkill(actor: User, candidateId: string, skillId: string, dto: CreateSkillDto) {
        await this.assertCandidateAccessible(actor, candidateId);

        const skill = await this.skillRepo.findOne({ where: { id: skillId, candidateId } });
        if (!skill) {
            throw new NotFoundException('Skill not found');
        }

        skill.skillName = dto.skillName;
        skill.skillLevel = dto.skillLevel;
        return this.skillRepo.save(skill);
    }

    async deleteSkill(actor: User, candidateId: string, skillId: string): Promise<void> {
        await this.assertCandidateAccessible(actor, candidateId);

        const skill = await this.skillRepo.findOne({ where: { id: skillId, candidateId } });
        if (!skill) {
            throw new NotFoundException('Skill not found');
        }
        await this.skillRepo.remove(skill);
    }

    // ── Work Experience ──────────────────────────────────────────────────
    async addWorkExperience(actor: User, candidateId: string, dto: CreateWorkExperienceDto) {
        await this.assertCandidateAccessible(actor, candidateId);
        await this.ensureCandidate(candidateId);

        const experience = this.workRepo.create({
            id: this.ulidService.generate(),
            candidateId,
            role: dto.role,
            company: dto.company,
            startDate: dto.startDate ?? null,
            endDate: dto.endDate ?? null,
            isCurrent: Boolean(dto.isCurrent),
            highlights: dto.highlights ? JSON.stringify(dto.highlights) : null,
        });
        return this.workRepo.save(experience);
    }

    async updateWorkExperience(actor: User, candidateId: string, experienceId: string, dto: CreateWorkExperienceDto) {
        await this.assertCandidateAccessible(actor, candidateId);

        const experience = await this.workRepo.findOne({ where: { id: experienceId, candidateId } });
        if (!experience) {
            throw new NotFoundException('Work experience not found');
        }

        experience.role = dto.role;
        experience.company = dto.company;
        experience.startDate = dto.startDate ?? null;
        experience.endDate = dto.endDate ?? null;
        experience.isCurrent = Boolean(dto.isCurrent);
        experience.highlights = dto.highlights ? JSON.stringify(dto.highlights) : null;

        return this.workRepo.save(experience);
    }

    async deleteWorkExperience(actor: User, candidateId: string, experienceId: string): Promise<void> {
        await this.assertCandidateAccessible(actor, candidateId);

        const experience = await this.workRepo.findOne({ where: { id: experienceId, candidateId } });
        if (!experience) {
            throw new NotFoundException('Work experience not found');
        }
        await this.workRepo.remove(experience);
    }

    // ── Education ────────────────────────────────────────────────────────
    async addEducation(actor: User, candidateId: string, dto: CreateEducationDto) {
        await this.assertCandidateAccessible(actor, candidateId);
        await this.ensureCandidate(candidateId);

        const education = this.eduRepo.create({
            id: this.ulidService.generate(),
            candidateId,
            school: dto.school,
            degree: dto.degree,
            fieldOfStudy: dto.fieldOfStudy ?? null,
            graduationYear: dto.graduationYear ?? null,
        });
        return this.eduRepo.save(education);
    }

    async updateEducation(actor: User, candidateId: string, educationId: string, dto: CreateEducationDto) {
        await this.assertCandidateAccessible(actor, candidateId);

        const education = await this.eduRepo.findOne({ where: { id: educationId, candidateId } });
        if (!education) {
            throw new NotFoundException('Education not found');
        }

        education.school = dto.school;
        education.degree = dto.degree;
        education.fieldOfStudy = dto.fieldOfStudy ?? null;
        education.graduationYear = dto.graduationYear ?? null;

        return this.eduRepo.save(education);
    }

    async deleteEducation(actor: User, candidateId: string, educationId: string): Promise<void> {
        await this.assertCandidateAccessible(actor, candidateId);

        const education = await this.eduRepo.findOne({ where: { id: educationId, candidateId } });
        if (!education) {
            throw new NotFoundException('Education not found');
        }
        await this.eduRepo.remove(education);
    }
}
