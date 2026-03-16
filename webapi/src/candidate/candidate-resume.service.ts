import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as pdfParse from 'pdf-parse';
// pdf-parse may export as default or named depending on build
const parsePdf: (buffer: Buffer) => Promise<{ text: string }> =
    (pdfParse as any).default ?? (pdfParse as any);
import * as mammoth from 'mammoth';
import { Candidate } from '../database/entities/candidate.entity';
import { ResumeParser } from '../database/entities/resume-parser.entity';
import { User } from '../database/entities/user.entity';
import { CandidateSkill } from '../database/entities/candidate-skill.entity';
import { CandidateWorkExperience } from '../database/entities/candidate-work-experience.entity';
import { CandidateEducation } from '../database/entities/candidate-education.entity';
import { UlidService } from '../common/ulid.service';
import { EncryptionService } from '../common/encryption.service';
import { ParseResumeDto } from './dto/parse-resume.dto';
import { ApplyResumeDto } from './dto/apply-resume.dto';
import { AiChatService } from '../ai/ai-chat.service';
import { AIProviderConfigService } from '../admin/services/ai-provider-config.service';

type ParsedResumeData = {
    basics: {
        fullName: string | null;
        email: string | null;
        phone: string | null;
        location: string | null;
        linkedinUrl: string | null;
        portfolioUrl: string | null;
    };
    summary: string | null;
    skills: string[];
    experiences: Array<{
        jobTitle: string | null;
        companyName: string | null;
        startDate: string | null;
        endDate: string | null;
        isCurrent: boolean;
        description: string | null;
    }>;
    education: Array<{
        institutionName: string | null;
        degree: string | null;
        fieldOfStudy: string | null;
        startDate: string | null;
        endDate: string | null;
    }>;
    availability: {
        noticePeriodDays: number | null;
        availableDate: string | null;
    };
    extractedAt: string;
};

const RESUME_PARSE_PROVIDER = 'openai';
const RESUME_PARSE_MODEL = 'gpt-4o-mini';

@Injectable()
export class CandidateResumeService {
    private readonly logger = new Logger(CandidateResumeService.name);

    constructor(
        @InjectRepository(Candidate)
        private readonly candidateRepository: Repository<Candidate>,
        @InjectRepository(ResumeParser)
        private readonly resumeParserRepository: Repository<ResumeParser>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(CandidateSkill)
        private readonly skillRepository: Repository<CandidateSkill>,
        @InjectRepository(CandidateWorkExperience)
        private readonly experienceRepository: Repository<CandidateWorkExperience>,
        @InjectRepository(CandidateEducation)
        private readonly educationRepository: Repository<CandidateEducation>,
        private readonly configService: ConfigService,
        private readonly ulidService: UlidService,
        private readonly encryptionService: EncryptionService,
        private readonly aiChatService: AiChatService,
        private readonly aiProviderConfigService: AIProviderConfigService,
    ) { }

    /**
     * Normalize date string to YYYY-MM-DD format for database
     * Handles: YYYY-MM-DD, YYYY-MM, YYYY
     */
    private normalizeDate(dateStr: string | null): string | null {
        if (!dateStr) return null;
        const trimmed = dateStr.trim();
        if (!trimmed) return null;

        // Already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        // YYYY-MM format -> add -01
        if (/^\d{4}-\d{2}$/.test(trimmed)) {
            return `${trimmed}-01`;
        }

        // YYYY format -> add -01-01
        if (/^\d{4}$/.test(trimmed)) {
            return `${trimmed}-01-01`;
        }

        // Invalid format, return null
        return null;
    }

    async parseResume(userId: string, dto: ParseResumeDto) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['roles'] });
        if (!user) {
            throw new NotFoundException('Candidate user not found');
        }

        const candidate = await this.ensureCandidate(userId);
        const resolvedResumeUrl = dto.resumeUrl ? this.resolveResumeUrl(dto.resumeUrl) : candidate.resumeUrl;

        // Try to get raw text; extract from PDF/DOCX if binary
        let rawText: string | null = null;
        let isBinary = false;
        if (dto.rawText?.trim()) {
            rawText = dto.rawText.trim();
        } else if (resolvedResumeUrl) {
            try {
                const res = await axios.get<ArrayBuffer>(resolvedResumeUrl, { responseType: 'arraybuffer', timeout: 15000 });
                const contentType = String(res.headers['content-type'] ?? '').toLowerCase();
                const buffer = Buffer.from(res.data);

                if (contentType.includes('pdf') || resolvedResumeUrl.toLowerCase().endsWith('.pdf')) {
                    // Extract text from PDF
                    const pdfData = await parsePdf(buffer);
                    rawText = pdfData.text?.trim() || null;
                    isBinary = true;
                } else if (
                    contentType.includes('wordprocessingml') ||
                    contentType.includes('msword') ||
                    /\.(docx|doc)$/i.test(resolvedResumeUrl)
                ) {
                    // Extract text from Word document
                    const result = await mammoth.extractRawText({ buffer });
                    rawText = result.value?.trim() || null;
                    isBinary = true;
                } else if (contentType.startsWith('text/') || contentType.includes('json')) {
                    rawText = buffer.toString('utf8').trim();
                } else {
                    isBinary = true;
                }
            } catch (err) {
                this.logger.warn(`Failed to fetch/parse resume file: ${err?.message}`);
            }
        }

        const parsedData = await this.parseWithAI(rawText, isBinary ? resolvedResumeUrl : null);
        const confidence = this.calculateConfidence(parsedData);
        const encryptedPayload = this.encryptionService.encryptJson(parsedData);
        const normalizedText = rawText ?? '';
        const warnings: string[] = [];
        if (isBinary) warnings.push('Binary file detected; AI parsed from URL directly.');
        if (!rawText && !resolvedResumeUrl) warnings.push('No resume content provided.');

        const parser = this.resumeParserRepository.create({
            id: this.ulidService.generate(),
            candidateId: candidate.id,
            resumeUrl: resolvedResumeUrl,
            parsedData: encryptedPayload,
            rawTextPreview: normalizedText.slice(0, 4000),
            warnings,
            confidence,
            status: 'parsed',
        });

        await this.resumeParserRepository.save(parser);

        return this.toParserResponse(parser, parsedData);
    }

    async applyParsedResume(userId: string, dto: ApplyResumeDto) {
        const candidate = await this.ensureCandidate(userId);
        const parser = await this.resumeParserRepository.findOne({
            where: { id: dto.parserId, candidateId: candidate.id },
        });

        if (!parser || !parser.parsedData) {
            throw new NotFoundException('Parsed resume not found');
        }

        const parsedData = this.encryptionService.decryptJson<ParsedResumeData>(parser.parsedData as Buffer);

        if (dto.applyMode === 'overwrite' || !candidate.portfolioUrl) {
            candidate.portfolioUrl = parsedData.basics.portfolioUrl;
        }
        // Location parsing from resume is disabled - use manual entry instead
        // if (dto.applyMode === 'overwrite' || !candidate.currentLocationCity) {
        //     candidate.currentLocationCity = parsedData.basics.location;
        // }
        if (dto.applyMode === 'overwrite' || candidate.noticePeriod === null || candidate.noticePeriod === undefined) {
            candidate.noticePeriod = parsedData.availability.noticePeriodDays;
        }
        if (dto.applyMode === 'overwrite' || !candidate.availableDate) {
            candidate.availableDate = parsedData.availability.availableDate;
        }
        if (dto.applyMode === 'overwrite' || !candidate.resumeUrl) {
            candidate.resumeUrl = parser.resumeUrl;
        }
        candidate.profileStatus = 'resume_applied';

        await this.candidateRepository.save(candidate);

        // Insert skills
        if (dto.applyMode === 'overwrite') {
            await this.skillRepository.delete({ candidateId: candidate.id });
        }
        for (const skillName of parsedData.skills) {
            if (skillName?.trim()) {
                await this.skillRepository.save({
                    id: this.ulidService.generate(),
                    candidateId: candidate.id,
                    skillName: skillName.trim(),
                    skillLevel: 'Intermediate',
                });
            }
        }

        // Insert work experience
        if (dto.applyMode === 'overwrite') {
            await this.experienceRepository.delete({ candidateId: candidate.id });
        }
        for (const exp of parsedData.experiences) {
            if (exp.jobTitle && exp.companyName) {
                await this.experienceRepository.save({
                    id: this.ulidService.generate(),
                    candidateId: candidate.id,
                    role: exp.jobTitle,
                    company: exp.companyName,
                    startDate: this.normalizeDate(exp.startDate),
                    endDate: this.normalizeDate(exp.endDate),
                    isCurrent: exp.isCurrent,
                    highlights: exp.description ? JSON.stringify([exp.description]) : null,
                });
            }
        }

        // Insert education
        if (dto.applyMode === 'overwrite') {
            await this.educationRepository.delete({ candidateId: candidate.id });
        }
        for (const edu of parsedData.education) {
            if (edu.institutionName && edu.degree) {
                const graduationYear = edu.endDate ? parseInt(edu.endDate.split('-')[0]) : null;
                await this.educationRepository.save({
                    id: this.ulidService.generate(),
                    candidateId: candidate.id,
                    school: edu.institutionName,
                    degree: edu.degree,
                    fieldOfStudy: edu.fieldOfStudy,
                    graduationYear,
                });
            }
        }

        await this.resumeParserRepository.update(
            { candidateId: candidate.id, status: 'applied' },
            { status: 'superseded' },
        );

        parser.status = 'applied';
        await this.resumeParserRepository.save(parser);

        return {
            candidate,
            parser: this.toParserResponse(parser, parsedData),
        };
    }

    async getLatestResume(userId: string) {
        const candidate = await this.ensureCandidate(userId);
        const parser = await this.resumeParserRepository.findOne({
            where: { candidateId: candidate.id },
            order: { parseDate: 'DESC' },
        });

        if (!parser) {
            return {
                candidate,
                latestResume: null,
            };
        }

        return {
            candidate,
            latestResume: this.toParserResponse(parser),
        };
    }

    async getResumeParse(userId: string, parserId: string) {
        const candidate = await this.ensureCandidate(userId);
        const parser = await this.resumeParserRepository.findOne({
            where: { id: parserId, candidateId: candidate.id },
        });

        if (!parser) {
            throw new NotFoundException('Parsed resume not found');
        }

        return this.toParserResponse(parser);
    }

    private async ensureCandidate(userId: string): Promise<Candidate> {
        const existing = await this.candidateRepository.findOne({ where: { id: userId } });
        if (existing) {
            return existing;
        }

        const candidate = this.candidateRepository.create({
            id: userId,
            resumeUrl: null,
            portfolioUrl: null,
            currentLocationCountry: null,
            currentLocationState: null,
            currentLocationCity: null,
            noticePeriod: null,
            availableDate: null,
            profileStatus: 'draft',
        });

        return this.candidateRepository.save(candidate);
    }

    private resolveResumeUrl(resumeUrl: string): string {
        if (/^https?:\/\//i.test(resumeUrl)) {
            return resumeUrl;
        }

        const fileServiceUrl = this.configService.get<string>('FILE_SERVICE_URL');
        const appOrigin = this.configService.get<string>('WEBAUTHN_ORIGIN');
        const baseUrl = fileServiceUrl || appOrigin;

        if (!baseUrl) {
            throw new BadRequestException('Relative resumeUrl requires FILE_SERVICE_URL or WEBAUTHN_ORIGIN in configuration');
        }

        return new URL(resumeUrl, baseUrl).toString();
    }

    private async parseWithAI(rawText: string | null, fileUrl: string | null): Promise<ParsedResumeData> {
        const contentPart = rawText
            ? `Resume text:\n\`\`\`\n${rawText.slice(0, 12000)}\n\`\`\``
            : fileUrl
                ? `Resume file URL: ${fileUrl}\nPlease parse the resume from this URL.`
                : 'No resume content provided.';

        const prompt = `You are a resume parser. Extract structured data from the following resume and return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "basics": { "fullName": string|null, "email": string|null, "phone": string|null, "location": string|null, "linkedinUrl": string|null, "portfolioUrl": string|null },
  "summary": string|null,
  "skills": string[],
  "experiences": [{ "jobTitle": string|null, "companyName": string|null, "startDate": string|null, "endDate": string|null, "isCurrent": boolean, "description": string|null }],
  "education": [{ "institutionName": string|null, "degree": string|null, "fieldOfStudy": string|null, "startDate": string|null, "endDate": string|null }],
  "availability": { "noticePeriodDays": number|null, "availableDate": string|null },
  "extractedAt": "${new Date().toISOString()}"
}

Dates should be in YYYY-MM-DD or YYYY-MM format. Return null for missing fields.

${contentPart}`;

        try {
            const result = await this.aiChatService.createChatCompletion({
                provider: RESUME_PARSE_PROVIDER,
                model: RESUME_PARSE_MODEL,
                messages: [{ role: 'user', content: prompt }],
                maxTokens: 2000,
            });

            const text = result.outputText?.trim() ?? '';
            this.logger.log(`AI response: ${text.slice(0, 500)}`);
            // Strip markdown code fences if present
            const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            const parsed = JSON.parse(jsonStr) as ParsedResumeData;
            parsed.extractedAt = new Date().toISOString();
            return parsed;
        } catch (err) {
            this.logger.error(`AI parsing failed: ${err?.message}`, err?.stack);
            // Fallback to empty structure if AI fails
            return {
                basics: { fullName: null, email: null, phone: null, location: null, linkedinUrl: null, portfolioUrl: null },
                summary: null,
                skills: [],
                experiences: [],
                education: [],
                availability: { noticePeriodDays: null, availableDate: null },
                extractedAt: new Date().toISOString(),
            };
        }
    }

    private calculateConfidence(parsedData: ParsedResumeData): number {
        let score = 0;
        const possible = 8;

        if (parsedData.basics.fullName) score += 1;
        if (parsedData.basics.email) score += 1;
        if (parsedData.basics.phone) score += 1;
        if (parsedData.basics.location) score += 1;
        if (parsedData.skills.length) score += 1;
        if (parsedData.experiences.length) score += 1;
        if (parsedData.education.length) score += 1;
        if (parsedData.summary) score += 1;

        return Number(((score / possible) * 100).toFixed(2));
    }

    private toParserResponse(parser: ResumeParser, parsedData?: ParsedResumeData) {
        const decrypted = parsedData ?? (parser.parsedData
            ? this.encryptionService.decryptJson<ParsedResumeData>(parser.parsedData as Buffer)
            : null);

        return {
            id: parser.id,
            candidateId: parser.candidateId,
            resumeUrl: parser.resumeUrl,
            status: parser.status,
            confidence: parser.confidence === null ? null : Number(parser.confidence),
            parseDate: parser.parseDate,
            warnings: parser.warnings ?? [],
            rawTextPreview: parser.rawTextPreview,
            parsedData: decrypted,
        };
    }
}
