import {
    Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiExtraModels, ApiOkResponse, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '../database/entities/user-role.entity';
import { User } from '../database/entities/user.entity';
import { JobOrdersService } from '../job-orders/job-orders.service';
import { ApplicationsService } from '../applications/applications.service';
import { CreateApplicationDto } from '../applications/dto/application.dto';
import { UpdateUserProfileDto } from '../users/dto/update-user-profile.dto';
import { UsersService } from '../users/users.service';
import { CandidateResumeService } from './candidate-resume.service';
import { CandidateAssistantService } from './candidate-assistant.service';
import { ParseResumeDto } from './dto/parse-resume.dto';
import { ApplyResumeDto } from './dto/apply-resume.dto';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';
import { createPaginatedResponseDto, PaginatedResponse } from '../common/dto/paginated-response.dto';
import { JobOrder } from '../database/entities/job-order.entity';
import type { JobOrderEmploymentType, JobOrderWorkArrangement } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';
import { createApiResponseDto } from '../common/dto/api-response.dto';
import { Candidate } from '../database/entities/candidate.entity';
import { CandidateProfileService } from '../recruiter/candidate-profile.service';
import { UpdateCandidateProfileDto } from '../recruiter/dto/update-candidate-profile.dto';
import { CreateSkillDto } from '../recruiter/dto/create-skill.dto';
import { CreateWorkExperienceDto } from '../recruiter/dto/create-work-experience.dto';
import { CreateEducationDto } from '../recruiter/dto/create-education.dto';

class ResumeParseResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    candidateId: string;

    @ApiProperty({ required: false, type: String })
    resumeUrl: string | null;

    @ApiProperty()
    status: string;

    @ApiProperty({ required: false, type: Number })
    confidence: number | null;

    @ApiProperty({ type: String, format: 'date-time' })
    parseDate: Date;

    @ApiProperty({ type: [String] })
    warnings: string[];

    @ApiProperty({ required: false, type: String })
    rawTextPreview: string | null;

    @ApiProperty({ required: false, type: Object })
    parsedData: Record<string, unknown> | null;
}

class ResumeApplyResponseDto {
    @ApiProperty({ type: Candidate })
    candidate: Candidate;

    @ApiProperty({ type: ResumeParseResponseDto })
    parser: ResumeParseResponseDto;
}

class LatestResumeResponseDto {
    @ApiProperty({ type: Candidate })
    candidate: Candidate;

    @ApiProperty({ type: ResumeParseResponseDto, required: false })
    latestResume: ResumeParseResponseDto | null;
}

const PaginatedJobOrdersResponseDto = createPaginatedResponseDto(JobOrder);
const PaginatedApplicationsResponseDto = createPaginatedResponseDto(Application);
const JobOrderResponseDto = createApiResponseDto(JobOrder);
const ApplicationResponseDto = createApiResponseDto(Application);
const ProfileResponseDto = createApiResponseDto(User);

@ApiTags('candidate')
@ApiExtraModels(
    PaginatedJobOrdersResponseDto,
    PaginatedApplicationsResponseDto,
    JobOrder,
    Application,
    User,
    Candidate,
    JobOrderResponseDto,
    ApplicationResponseDto,
    ProfileResponseDto,
    ResumeParseResponseDto,
    ResumeApplyResponseDto,
    LatestResumeResponseDto,
)
@Controller('candidate')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.CANDIDATE)
@ApiBearerAuth()
export class CandidateController {
    constructor(
        private jobOrdersService: JobOrdersService,
        private applicationsService: ApplicationsService,
        private usersService: UsersService,
        private candidateResumeService: CandidateResumeService,
        private candidateProfileService: CandidateProfileService,
        private candidateAssistantService: CandidateAssistantService,
    ) {}

    @Public()
    @Get('jobs')
    @ApiOperation({ summary: 'Browse open job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'employmentTypes', required: false, isArray: true })
    @ApiQuery({ name: 'workArrangements', required: false, isArray: true })
    @ApiQuery({ name: 'country', required: false })
    @ApiQuery({ name: 'state', required: false })
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'openings'] })
    @ApiOkResponse({ type: PaginatedJobOrdersResponseDto })
    listJobs(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('search') search?: string,
        @Query('employmentTypes') employmentTypesRaw?: string | string[],
        @Query('workArrangements') workArrangementsRaw?: string | string[],
        @Query('country') locationCountry?: string,
        @Query('state') locationState?: string,
        @Query('city') locationCity?: string,
        @Query('sortBy') sortBy?: 'recent' | 'openings',
    ): Promise<PaginatedResponse<JobOrder>> {
        let employmentTypes: JobOrderEmploymentType[] | undefined;
        if (Array.isArray(employmentTypesRaw)) {
            employmentTypes = employmentTypesRaw as JobOrderEmploymentType[];
        } else if (typeof employmentTypesRaw === 'string') {
            employmentTypes = employmentTypesRaw.split(',') as JobOrderEmploymentType[];
        }
        if (employmentTypes) {
            employmentTypes = employmentTypes.map((s) => s.trim() as JobOrderEmploymentType).filter(Boolean);
            if (!employmentTypes.length) employmentTypes = undefined;
        }

        let workArrangements: JobOrderWorkArrangement[] | undefined;
        if (Array.isArray(workArrangementsRaw)) {
            workArrangements = workArrangementsRaw as JobOrderWorkArrangement[];
        } else if (typeof workArrangementsRaw === 'string') {
            workArrangements = workArrangementsRaw.split(',') as JobOrderWorkArrangement[];
        }
        if (workArrangements) {
            workArrangements = workArrangements.map((s) => s.trim() as JobOrderWorkArrangement).filter(Boolean);
            if (!workArrangements.length) workArrangements = undefined;
        }

        return this.jobOrdersService.findAll({}, {
            page: +page,
            limit: +limit,
            search,
            statuses: ['sourcing', 'interview'],
            employmentTypes,
            workArrangements,
            locationCountry,
            locationState,
            locationCity,
            sortBy,
        });
    }

    @Public()
    @Get('jobs/:id')
    @ApiOperation({ summary: 'Get job order detail' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    getJob(@Param('id') id: string): Promise<JobOrder> {
        return this.jobOrdersService.findOne(id);
    }

    @Post('jobs/:id/apply')
    @ApiOperation({ summary: 'Apply to a job order' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    apply(@GetUser() user: User, @Param('id') jobOrderId: string): Promise<Application> {
        const dto: CreateApplicationDto = { jobOrderId, candidateId: user.id };
        return this.applicationsService.create(dto, 'self_applied');
    }

    @Get('applications')
    @ApiOperation({ summary: 'Get my applications' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    myApplications(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ): Promise<PaginatedResponse<Application>> {
        return this.applicationsService.findAll(
            { candidateId: user.id },
            { page: +page, limit: +limit },
        );
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get my profile' })
    @ApiOkResponse({ type: ProfileResponseDto })
    getProfile(@GetUser() user: User): Promise<User | null> {
        return this.usersService.findOneById(user.id);
    }

    @Put('profile')
    @ApiOperation({ summary: 'Update my profile' })
    @ApiOkResponse({ type: ProfileResponseDto })
    updateProfile(@GetUser() user: User, @Body() dto: UpdateUserProfileDto): Promise<User> {
        return this.usersService.update(user.id, dto);
    }

    @Post('resume/parse')
    @ApiOperation({ summary: 'Parse a resume and store encrypted parsed_data' })
    @ApiOkResponse({ type: ResumeParseResponseDto })
    parseResume(@GetUser() user: User, @Body() dto: ParseResumeDto): Promise<ResumeParseResponseDto> {
        return this.candidateResumeService.parseResume(user.id, dto);
    }

    @Post('resume/apply')
    @ApiOperation({ summary: 'Apply one parsed resume as the current candidate profile snapshot' })
    @ApiOkResponse({ type: ResumeApplyResponseDto })
    applyResume(@GetUser() user: User, @Body() dto: ApplyResumeDto): Promise<ResumeApplyResponseDto> {
        return this.candidateResumeService.applyParsedResume(user.id, dto);
    }

    @Get('resume/latest')
    @ApiOperation({ summary: 'Get the latest parsed resume for the current candidate' })
    @ApiOkResponse({ type: LatestResumeResponseDto })
    getLatestResume(@GetUser() user: User): Promise<LatestResumeResponseDto> {
        return this.candidateResumeService.getLatestResume(user.id);
    }

    @Get('resume/parses/:id')
    @ApiOperation({ summary: 'Get a parsed resume by ID for the current candidate' })
    @ApiOkResponse({ type: ResumeParseResponseDto })
    getResumeParse(@GetUser() user: User, @Param('id') parserId: string): Promise<ResumeParseResponseDto> {
        return this.candidateResumeService.getResumeParse(user.id, parserId);
    }

    // ── Self Profile (Extended) ────────────────────────────────────────────
    @Get('my-profile')
    @ApiOperation({ summary: 'Get my extended candidate profile (skills, work experience, education)' })
    @ApiOkResponse({ schema: { type: 'object' } })
    getMyProfile(@GetUser() user: User) {
        return this.candidateProfileService.getProfile(user, user.id);
    }

    @Put('my-profile')
    @ApiOperation({ summary: 'Update my extended candidate profile' })
    @ApiOkResponse({ schema: { type: 'object' } })
    updateMyProfile(@GetUser() user: User, @Body() dto: UpdateCandidateProfileDto) {
        return this.candidateProfileService.updateProfile(user, user.id, dto);
    }

    @Post('my-profile/skills')
    @ApiOperation({ summary: 'Add a skill to my profile' })
    addMySkill(@GetUser() user: User, @Body() dto: CreateSkillDto) {
        return this.candidateProfileService.addSkill(user, user.id, dto);
    }

    @Put('my-profile/skills/:skillId')
    @ApiOperation({ summary: 'Update a skill in my profile' })
    updateMySkill(@GetUser() user: User, @Param('skillId') skillId: string, @Body() dto: CreateSkillDto) {
        return this.candidateProfileService.updateSkill(user, user.id, skillId, dto);
    }

    @Delete('my-profile/skills/:skillId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a skill from my profile' })
    async deleteMySkill(@GetUser() user: User, @Param('skillId') skillId: string): Promise<void> {
        await this.candidateProfileService.deleteSkill(user, user.id, skillId);
    }

    @Post('my-profile/work-experience')
    @ApiOperation({ summary: 'Add work experience to my profile' })
    addMyWorkExperience(@GetUser() user: User, @Body() dto: CreateWorkExperienceDto) {
        return this.candidateProfileService.addWorkExperience(user, user.id, dto);
    }

    @Put('my-profile/work-experience/:experienceId')
    @ApiOperation({ summary: 'Update work experience in my profile' })
    updateMyWorkExperience(@GetUser() user: User, @Param('experienceId') experienceId: string, @Body() dto: CreateWorkExperienceDto) {
        return this.candidateProfileService.updateWorkExperience(user, user.id, experienceId, dto);
    }

    @Delete('my-profile/work-experience/:experienceId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete work experience from my profile' })
    async deleteMyWorkExperience(@GetUser() user: User, @Param('experienceId') experienceId: string): Promise<void> {
        await this.candidateProfileService.deleteWorkExperience(user, user.id, experienceId);
    }

    @Post('my-profile/education')
    @ApiOperation({ summary: 'Add education to my profile' })
    addMyEducation(@GetUser() user: User, @Body() dto: CreateEducationDto) {
        return this.candidateProfileService.addEducation(user, user.id, dto);
    }

    @Put('my-profile/education/:educationId')
    @ApiOperation({ summary: 'Update education in my profile' })
    updateMyEducation(@GetUser() user: User, @Param('educationId') educationId: string, @Body() dto: CreateEducationDto) {
        return this.candidateProfileService.updateEducation(user, user.id, educationId, dto);
    }

    @Delete('my-profile/education/:educationId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete education from my profile' })
    async deleteMyEducation(@GetUser() user: User, @Param('educationId') educationId: string): Promise<void> {
        await this.candidateProfileService.deleteEducation(user, user.id, educationId);
    }

    @Post('assistant/chat')
    @ApiOperation({ summary: 'Chat with AI career assistant' })
    @ApiOkResponse({ type: ChatResponseDto })
    chat(@GetUser() user: User, @Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
        return this.candidateAssistantService.chat(user.id, dto);
    }

}
