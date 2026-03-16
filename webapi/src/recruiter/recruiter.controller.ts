import {
    Controller, Get, Post, Put, Patch, Delete,
    Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiExtraModels, ApiOkResponse, ApiNoContentResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { Role } from '../database/entities/user-role.entity';
import { User } from '../database/entities/user.entity';
import { JobOrdersService } from '../job-orders/job-orders.service';
import { ApplicationsService } from '../applications/applications.service';
import { AdminService } from '../admin/admin.service';
import { CreateJobOrderDto } from '../job-orders/dto/create-job-order.dto';
import { UpdateJobOrderDto, UpdateJobOrderStatusDto } from '../job-orders/dto/update-job-order.dto';
import {
    CreateApplicationDto,
    UpdateApplicationStatusDto,
    BulkImportDto,
} from '../applications/dto/application.dto';
import { ReportsService } from '../reports/reports.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { CreateCompanyDto } from '../admin/dto/create-company.dto';
import { UpdateCompanyDto } from '../admin/dto/update-company.dto';
import { UpdateRecruiterCandidateDto } from './dto/update-recruiter-candidate.dto';
import { CandidateProfileService } from './candidate-profile.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { CreateWorkExperienceDto } from './dto/create-work-experience.dto';
import { CreateEducationDto } from './dto/create-education.dto';
import { createPaginatedResponseDto, PaginatedResponse } from '../common/dto/paginated-response.dto';
import { createApiResponseDto } from '../common/dto/api-response.dto';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';
import { Company } from '../database/entities/company.entity';
import { Candidate } from '../database/entities/candidate.entity';
import { Repository } from 'typeorm';


const PaginatedJobOrdersResponseDto = createPaginatedResponseDto(JobOrder);
const PaginatedApplicationsResponseDto = createPaginatedResponseDto(Application);
const PaginatedCompaniesResponseDto = createPaginatedResponseDto(Company);
const JobOrderResponseDto = createApiResponseDto(JobOrder);
const ApplicationResponseDto = createApiResponseDto(Application);
const CompanyResponseDto = createApiResponseDto(Company);

@ApiTags('recruiter')
@ApiExtraModels(
    PaginatedJobOrdersResponseDto,
    PaginatedApplicationsResponseDto,
    PaginatedCompaniesResponseDto,
    JobOrder,
    Application,
    Company,
    JobOrderResponseDto,
    ApplicationResponseDto,
    CompanyResponseDto,
)
@Controller('recruiter')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.RECRUITER, Role.ADMIN)
@ApiBearerAuth()
export class RecruiterController {
    private isAdmin(user: User): boolean {
        return Boolean(user.roles?.some((r) => r.role === Role.ADMIN));
    }

    constructor(
        private jobOrdersService: JobOrdersService,
        private applicationsService: ApplicationsService,
        private adminService: AdminService,
        private reportsService: ReportsService,
        private dashboardService: DashboardService,
        @InjectRepository(Candidate)
        private candidateRepository: Repository<Candidate>,
        private candidateProfileService: CandidateProfileService,
    ) {}

    // ── Job Orders ────────────────────────────────────────────────────────
    @Get('job-orders')
    @ApiOperation({ summary: 'List my job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'companyId', required: false })
    @ApiQuery({ name: 'employmentType', required: false })
    @ApiQuery({ name: 'workArrangement', required: false })
    @ApiQuery({ name: 'locationCountry', required: false })
    @ApiQuery({ name: 'locationState', required: false })
    @ApiQuery({ name: 'locationCity', required: false })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'openings'] })
    @ApiQuery({ name: 'recruiterId', required: false, description: 'Admin only: filter by recruiter userId' })
    @ApiOkResponse({ type: PaginatedJobOrdersResponseDto })
    listJobOrders(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('companyId') companyId?: string,
        @Query('employmentType') employmentType?: string,
        @Query('workArrangement') workArrangement?: string,
        @Query('locationCountry') locationCountry?: string,
        @Query('locationState') locationState?: string,
        @Query('locationCity') locationCity?: string,
        @Query('sortBy') sortBy?: 'recent' | 'openings',
        @Query('recruiterId') recruiterId?: string,
    ): Promise<PaginatedResponse<JobOrder>> {
        const where: any = {};
        if (companyId) {
            where.companyId = companyId;
        }
        return this.jobOrdersService.findAll(
            where,
            {
                page: +page,
                limit: +limit,
                status,
                search,
                employmentTypes: employmentType ? [employmentType as any] : undefined,
                workArrangements: workArrangement ? [workArrangement as any] : undefined,
                locationCountry,
                locationState,
                locationCity,
                sortBy: sortBy || 'recent',
            },
        );
    }

    @Post('job-orders')
    @AuditLog('create job order')
    @ApiOperation({ summary: 'Create a job order (assigned to me)' })
    @ApiCreatedResponse({ type: JobOrderResponseDto })
    createJobOrder(@GetUser() user: User, @Body() dto: CreateJobOrderDto): Promise<JobOrder> {
        return this.jobOrdersService.create(dto, user.id);
    }

    @Get('job-orders/:id')
    @ApiOperation({ summary: 'Get a job order by ID' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    getJobOrder(@GetUser() user: User, @Param('id') id: string): Promise<JobOrder> {
        return this.jobOrdersService.findOne(id);
    }

    @Put('job-orders/:id')
    @AuditLog('update job order')
    @ApiOperation({ summary: 'Update a job order' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    updateJobOrder(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateJobOrderDto,
    ): Promise<JobOrder> {
        return this.jobOrdersService.update(id, dto);
    }

    @Patch('job-orders/:id/status')
    @AuditLog('update job order status')
    @ApiOperation({ summary: 'Update job order status' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    updateJobOrderStatus(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateJobOrderStatusDto,
    ): Promise<JobOrder> {
        return this.jobOrdersService.updateStatus(id, dto.status);
    }

    @Delete('job-orders/:id')
    @AuditLog('delete job order')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a job order' })
    @ApiNoContentResponse({ description: 'Job order deleted successfully' })
    async deleteJobOrder(@GetUser() user: User, @Param('id') id: string): Promise<void> {
        await this.jobOrdersService.delete(id);
    }

    // ── Applications ──────────────────────────────────────────────────────
    @Get('applications')
    @ApiOperation({ summary: 'List applications for my job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'location', required: false })
    @ApiQuery({ name: 'recruiterId', required: false, description: 'Admin only: filter by recruiter userId' })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    listApplications(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('search') search?: string,
        @Query('location') location?: string,
        @Query('recruiterId') recruiterId?: string,
    ): Promise<PaginatedResponse<Application>> {
        return this.applicationsService.findAll(
            {},
            {
                page: +page,
                limit: +limit,
                status,
                jobOrderId,
                search,
                location,
            },
        );
    }

    @Get('applications/:id')
    @ApiOperation({ summary: 'Get an application by ID' })
    @ApiOkResponse({ type: Application })
    getApplication(@GetUser() user: User, @Param('id') id: string): Promise<Application> {
        return this.applicationsService.findOne(id);
    }

    @Post('applications')
    @AuditLog('create application')
    @ApiOperation({ summary: 'Manually add a candidate to a job order' })
    @ApiOkResponse({ type: Application })
    async createApplication(@GetUser() user: User, @Body() dto: CreateApplicationDto): Promise<Application> {
        return this.applicationsService.create(dto, 'recruiter_import');
    }

    @Patch('applications/:id/status')
    @AuditLog('update application status')
    @ApiOperation({ summary: 'Update application status (triggers email on interview/offer)' })
    @ApiOkResponse({ type: Application })
    updateApplicationStatus(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateApplicationStatusDto,
    ): Promise<Application> {
        return this.applicationsService.updateStatus(id, dto);
    }

    // ── Candidates ────────────────────────────────────────────────────────
    @Get('candidates')
    @ApiOperation({ summary: 'List candidates for my assigned job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'location', required: false })
    @ApiQuery({ name: 'recruiterId', required: false, description: 'Admin only: filter by recruiter userId' })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    listCandidates(
        @GetUser() user: User,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('search') search?: string,
        @Query('location') location?: string,
    ): Promise<PaginatedResponse<Application>> {
        if (this.isAdmin(user)) {
            return this.applicationsService.findAll({}, {
                page: +page,
                limit: +limit,
                status,
                jobOrderId,
                search,
                location,
            });
        }

        return this.applicationsService.findRecruiterCandidates(user.id, {
            page: +page,
            limit: +limit,
            status,
            jobOrderId,
            search,
            location,
        });
    }

    @Get('candidates/:id')
    @ApiOperation({ summary: 'Get candidate application detail (must belong to my job order)' })
    @ApiOkResponse({ type: Application })
    getCandidate(@GetUser() user: User, @Param('id') id: string): Promise<Application> {
        if (this.isAdmin(user)) {
            return this.applicationsService.findOne(id);
        }
        return this.applicationsService.findRecruiterCandidateById(user.id, id);
    }

    @Put('candidates/:id')
    @AuditLog('update candidate')
    @ApiOperation({ summary: 'Update candidate profile fields and application fields' })
    @ApiOkResponse({ type: Application })
    updateCandidate(
        @GetUser() user: User,
        @Param('id') id: string,
        @Body() dto: UpdateRecruiterCandidateDto,
    ): Promise<Application> {
        if (this.isAdmin(user)) {
            return this.applicationsService.updateApplicationCandidate(id, dto);
        }
        return this.applicationsService.updateRecruiterCandidate(user.id, id, dto);
    }

    @Delete('candidates/:id')
    @AuditLog('delete candidate')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a candidate application (must belong to my job order)' })
    @ApiNoContentResponse({ description: 'Candidate deleted successfully' })
    async deleteCandidate(@GetUser() user: User, @Param('id') id: string): Promise<void> {
        if (this.isAdmin(user)) {
            await this.applicationsService.findOne(id);
            return this.applicationsService.delete(id);
        }
        await this.applicationsService.findRecruiterCandidateById(user.id, id);
        return this.applicationsService.delete(id);
    }

    @Get('candidates/:id/resume')
    @ApiOperation({ summary: 'Get candidate resume download URL' })
    @ApiOkResponse({ schema: { type: 'object', properties: { resumeUrl: { type: 'string' } } } })
    async getCandidateResume(@GetUser() user: User, @Param('id') id: string): Promise<{ resumeUrl: string | null }> {
        const application = this.isAdmin(user)
            ? await this.applicationsService.findOne(id)
            : await this.applicationsService.findRecruiterCandidateById(user.id, id);
        const candidate = await this.candidateRepository.findOne({ where: { id: application.candidateId } });
        return { resumeUrl: candidate?.resumeUrl ?? null };
    }

    @Post('candidates/import')
    @AuditLog('bulk import candidates')
    @ApiOperation({ summary: 'Bulk-import candidates into a job order' })
    @ApiOkResponse({ type: Application, isArray: true })
    async bulkImport(@GetUser() user: User, @Body() dto: BulkImportDto): Promise<Application[]> {
        return this.applicationsService.bulkImport(dto);
    }

    // ── Candidate Profile (Detail Page) ───────────────────────────────────
    @Get('candidates/:candidateId/profile')
    @ApiOperation({ summary: 'Get candidate full profile (extended + skills + work + education)' })
    @ApiOkResponse({ schema: { type: 'object' } })
    getCandidateProfile(@GetUser() user: User, @Param('candidateId') candidateId: string) {
        return this.candidateProfileService.getProfile(user, candidateId);
    }

    @Put('candidates/:candidateId/profile')
    @ApiOperation({ summary: 'Update candidate basic profile fields' })
    @ApiOkResponse({ schema: { type: 'object' } })
    updateCandidateProfile(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Body() dto: UpdateCandidateProfileDto,
    ) {
        return this.candidateProfileService.updateProfile(user, candidateId, dto);
    }

    @Post('candidates/:candidateId/skills')
    @ApiOperation({ summary: 'Add a skill' })
    @ApiOkResponse({ type: Object })
    addCandidateSkill(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Body() dto: CreateSkillDto,
    ) {
        return this.candidateProfileService.addSkill(user, candidateId, dto);
    }

    @Put('candidates/:candidateId/skills/:skillId')
    @ApiOperation({ summary: 'Update a skill' })
    @ApiOkResponse({ type: Object })
    updateCandidateSkill(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Param('skillId') skillId: string,
        @Body() dto: CreateSkillDto,
    ) {
        return this.candidateProfileService.updateSkill(user, candidateId, skillId, dto);
    }

    @Delete('candidates/:candidateId/skills/:skillId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a skill' })
    @ApiNoContentResponse()
    async deleteCandidateSkill(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Param('skillId') skillId: string,
    ): Promise<void> {
        await this.candidateProfileService.deleteSkill(user, candidateId, skillId);
    }

    @Post('candidates/:candidateId/work-experience')
    @ApiOperation({ summary: 'Add work experience' })
    @ApiOkResponse({ type: Object })
    addWorkExperience(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Body() dto: CreateWorkExperienceDto,
    ) {
        return this.candidateProfileService.addWorkExperience(user, candidateId, dto);
    }

    @Put('candidates/:candidateId/work-experience/:experienceId')
    @ApiOperation({ summary: 'Update work experience' })
    @ApiOkResponse({ type: Object })
    updateWorkExperience(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Param('experienceId') experienceId: string,
        @Body() dto: CreateWorkExperienceDto,
    ) {
        return this.candidateProfileService.updateWorkExperience(user, candidateId, experienceId, dto);
    }

    @Delete('candidates/:candidateId/work-experience/:experienceId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete work experience' })
    @ApiNoContentResponse()
    async deleteWorkExperience(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Param('experienceId') experienceId: string,
    ): Promise<void> {
        await this.candidateProfileService.deleteWorkExperience(user, candidateId, experienceId);
    }

    @Post('candidates/:candidateId/education')
    @ApiOperation({ summary: 'Add education' })
    @ApiOkResponse({ type: Object })
    addEducation(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Body() dto: CreateEducationDto,
    ) {
        return this.candidateProfileService.addEducation(user, candidateId, dto);
    }

    @Put('candidates/:candidateId/education/:educationId')
    @ApiOperation({ summary: 'Update education' })
    @ApiOkResponse({ type: Object })
    updateEducation(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Param('educationId') educationId: string,
        @Body() dto: CreateEducationDto,
    ) {
        return this.candidateProfileService.updateEducation(user, candidateId, educationId, dto);
    }

    @Delete('candidates/:candidateId/education/:educationId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete education' })
    @ApiNoContentResponse()
    async deleteEducation(
        @GetUser() user: User,
        @Param('candidateId') candidateId: string,
        @Param('educationId') educationId: string,
    ): Promise<void> {
        await this.candidateProfileService.deleteEducation(user, candidateId, educationId);
    }

    // ── Companies ──────────────────────────────────────────────────────────
    @Get('companies')
    @ApiOperation({ summary: 'List companies' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedCompaniesResponseDto })
    listCompanies(
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<Company>> {
        return this.adminService.listCompanies(+page, +limit, search);
    }

    @Get('companies/:id')
    @ApiOperation({ summary: 'Get company details by ID' })
    @ApiOkResponse({ type: CompanyResponseDto })
    getCompanyById(@Param('id') id: string): Promise<Company> {
        return this.adminService.getCompanyById(id);
    }

    @Post('companies')
    @AuditLog('create company')
    @ApiOperation({ summary: 'Create a company' })
    @ApiOkResponse({ type: CompanyResponseDto })
    createCompany(@GetUser() user: User, @Body() dto: CreateCompanyDto): Promise<Company | null> {
        return this.adminService.createCompany(dto, user.nickname || user.email);
    }

    @Put('companies/:id')
    @AuditLog('update company')
    @ApiOperation({ summary: 'Update a company' })
    @ApiOkResponse({ type: CompanyResponseDto })
    updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto): Promise<Company | null> {
        return this.adminService.updateCompany(id, dto);
    }

    @Delete('companies/:id')
    @AuditLog('delete company')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a company' })
    @ApiNoContentResponse()
    async deleteCompany(@Param('id') id: string): Promise<{ success: boolean }> {
        return this.adminService.deleteCompany(id);
    }

    // ── Reports ───────────────────────────────────────────────────
    @Get('reports/job-orders')
    @ApiOperation({ summary: 'Job order stats' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' } } } })
    reportJobOrders(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number> }> {
        return this.reportsService.getJobOrderStats({});
    }

    @Get('reports/applications')
    @ApiOperation({ summary: 'Application stats' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' }, bySource: { type: 'object' } } } })
    reportApplications(@GetUser() user: User): Promise<{ total: number; byStatus: Record<string, number>; bySource: Record<string, number> }> {
        return this.reportsService.getApplicationStats({});
    }

    @Get('reports/top-job-orders')
    @ApiOperation({ summary: 'My top job orders by application volume' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiOkResponse({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    status: { type: 'string' },
                    applicationCount: { type: 'number' },
                },
            },
        },
    })
    reportTopJobOrders(@GetUser() user: User, @Query('limit') limit = '5'): Promise<Array<{ id: string; title: string; status: string; applicationCount: number }>> {
        return this.reportsService.getTopJobOrders({}, +limit);
    }

    @Get('reports/activity')
    @ApiOperation({ summary: 'My daily activity timeline' })
    @ApiQuery({ name: 'days', required: false })
    @ApiOkResponse({
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    date: { type: 'string' },
                    jobOrders: { type: 'number' },
                    applications: { type: 'number' },
                },
            },
        },
    })
    reportActivity(@GetUser() user: User, @Query('days') days = '30'): Promise<Array<{ date: string; jobOrders: number; applications: number }>> {
        return this.reportsService.getActivityTimeline({}, +days);
    }

    // ── Dashboard ─────────────────────────────────────────────────
    @Get('dashboard')
    @ApiOperation({ summary: 'Recruiter dashboard KPIs' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                myJobOrders: { type: 'number' },
                myApplications: { type: 'number' },
                pendingInterviews: { type: 'number' },
                awaitingDecision: { type: 'number' },
                recentApplications: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
            },
        },
    })
    dashboard(@GetUser() user: User): Promise<{ myJobOrders: number; myApplications: number; pendingInterviews: number; awaitingDecision: number; recentApplications: Application[] }> {
        return this.dashboardService.getRecruiterDashboard(user.id);
    }
}
