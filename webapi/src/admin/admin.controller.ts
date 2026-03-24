import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiExtraModels, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaginatedUsersResponseDto } from './dto/user-list-response.dto';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { Role } from '../database/entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { PaginatedAuditLogResponseDto } from './dto/audit-log-response.dto';
import { EmailConfigDto } from '../common/dto/email-config.dto';
import { SendTestEmailDto } from './dto/send-test-email.dto';
import { AIProviderConfigDto, AIProviderResponseDto, AIProvidersListResponseDto, AIProviderModelsResponseDto, CustomAIProviderDto, CustomAIProvidersListResponseDto } from './dto/ai-provider.dto';
import { JobOrdersService } from '../job-orders/job-orders.service';
import { ApplicationsService } from '../applications/applications.service';
import { CreateJobOrderDto } from '../job-orders/dto/create-job-order.dto';
import { UpdateJobOrderDto, UpdateJobOrderStatusDto } from '../job-orders/dto/update-job-order.dto';
import { CreateApplicationDto, UpdateApplicationStatusDto } from '../applications/dto/application.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import { User } from '../database/entities/user.entity';
import { ReportsService } from '../reports/reports.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { createPaginatedResponseDto, PaginatedResponse } from '../common/dto/paginated-response.dto';
import { createApiResponseDto } from '../common/dto/api-response.dto';
import { Company } from '../database/entities/company.entity';
import { JobOrder } from '../database/entities/job-order.entity';
import { Application } from '../database/entities/application.entity';
import { SystemConfig } from '../database/entities/system-config.entity';
import { AuditLog as AuditLogEntity } from '../database/entities/audit-log.entity';


const PaginatedCompaniesResponseDto = createPaginatedResponseDto(Company);
const PaginatedJobOrdersResponseDto = createPaginatedResponseDto(JobOrder);
const PaginatedApplicationsResponseDto = createPaginatedResponseDto(Application);
const CompanyResponseDto = createApiResponseDto(Company);
const JobOrderResponseDto = createApiResponseDto(JobOrder);
const ApplicationResponseDto = createApiResponseDto(Application);
const UserResponseDto = createApiResponseDto(User);

@ApiTags('admin')
@ApiExtraModels(
    PaginatedUsersResponseDto,
    PaginatedAuditLogResponseDto,
    PaginatedCompaniesResponseDto,
    PaginatedJobOrdersResponseDto,
    PaginatedApplicationsResponseDto,
    Company,
    JobOrder,
    Application,
    SystemConfig,
    AuditLogEntity,
    CompanyResponseDto,
    JobOrderResponseDto,
    ApplicationResponseDto,
    UserResponseDto,
)
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly jobOrdersService: JobOrdersService,
        private readonly applicationsService: ApplicationsService,
        private readonly reportsService: ReportsService,
        private readonly dashboardService: DashboardService,
    ) { }

    // --- Module 1: Users Management ---

    @Get('users')
    @ApiOperation({ summary: 'List all users (Paginated)' })
    @ApiResponse({ status: 200, type: PaginatedUsersResponseDto })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'role', required: false, enum: Role })
    @ApiQuery({ name: 'search', required: false, type: String })
    async listUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('role') role?: Role,
        @Query('search') search?: string,
    ): Promise<PaginatedUsersResponseDto> {
        return await this.adminService.listUsers(Number(page), Number(limit), role, search);
    }

    @Post('users')
    @AuditLog('create user')
    @ApiOperation({ summary: 'Create a new user' })
    @ApiCreatedResponse({ type: UserResponseDto })
    async createUser(@Body() createUserDto: CreateUserDto): Promise<User | Omit<User, 'passwordHash'>> {
        return this.adminService.createUser(createUserDto);
    }

    @Put('users/:id')
    @AuditLog('update user')
    @ApiOperation({ summary: 'Update an existing user' })
    @ApiOkResponse({ type: UserResponseDto })
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<void> {
        return this.adminService.updateUser(id, updateUserDto);
    }

    @Delete('users/:id')
    @AuditLog('delete user')
    @ApiOperation({ summary: 'Delete a user' })
    @ApiNoContentResponse()
    async deleteUser(@Param('id') id: string): Promise<void> {
        await this.adminService.deleteUser(id);
    }

    // --- Module 5: Companies Management ---

    @Get('companies')
    @ApiOperation({ summary: 'List all companies (Paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiOkResponse({ type: PaginatedCompaniesResponseDto })
    async listCompanies(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<Company>> {
        return this.adminService.listCompanies(Number(page), Number(limit), search);
    }

    @Post('companies')
    @ApiOperation({ summary: 'Create a new company' })
    @ApiCreatedResponse({ type: CompanyResponseDto })
    async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<Company | null> {
        return this.adminService.createCompany(createCompanyDto);
    }

    @Put('companies/:id')
    @ApiOperation({ summary: 'Update an existing company' })
    @ApiOkResponse({ type: CompanyResponseDto })
    async updateCompany(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto): Promise<Company | null> {
        return this.adminService.updateCompany(id, updateCompanyDto);
    }

    @Delete('companies/:id')
    @ApiOperation({ summary: 'Delete a company' })
    @ApiOkResponse({ schema: { type: 'object', properties: { success: { type: 'boolean' } } } })
    async deleteCompany(@Param('id') id: string): Promise<{ success: boolean }> {
        return this.adminService.deleteCompany(id);
    }

    // --- Module 2 & 3: Configs Management ---

    @Get('configs/:category')
    @ApiOperation({ summary: 'Get configurations for a category (e.g. AI, EMAIL)' })
    @ApiOkResponse({ type: [SystemConfig] })
    async getConfigs(@Param('category') category: string): Promise<SystemConfig[]> {
        return this.adminService.getConfigs(category);
    }

    @Put('configs/:category')
    @ApiOperation({ summary: 'Update configurations for a category' })
    @ApiOkResponse({ type: [SystemConfig] })
    async updateConfigs(@Param('category') category: string, @Body() updateConfigDto: UpdateConfigDto): Promise<SystemConfig[]> {
        return this.adminService.updateConfigs(category, updateConfigDto);
    }

    @Get('email-config')
    @ApiOperation({ summary: 'Get email SMTP configuration from Redis' })
    @ApiOkResponse({ type: EmailConfigDto })
    async getEmailConfig(): Promise<EmailConfigDto> {
        return this.adminService.getEmailConfig();
    }

    @Put('email-config')
    @AuditLog('update email config')
    @ApiOperation({ summary: 'Update email SMTP configuration in Redis' })
    @ApiOkResponse({ type: EmailConfigDto })
    async updateEmailConfig(@Body() emailConfigDto: EmailConfigDto): Promise<EmailConfigDto> {
        return this.adminService.updateEmailConfig(emailConfigDto);
    }

    @Post('email-config/test')
    @AuditLog('send test email')
    @ApiOperation({ summary: 'Send a test email using current SMTP configuration' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async sendTestEmail(@Body() sendTestEmailDto: SendTestEmailDto): Promise<{ message: string }> {
        await this.adminService.sendTestEmail(sendTestEmailDto.email);
        return { message: 'Test email sent successfully' };
    }

    // --- Module 4: Audit Logs ---

    @Get('audit-logs')
    @ApiOperation({ summary: 'Get global system activity audit logs (Paginated)' })
    @ApiResponse({ status: 200, type: PaginatedAuditLogResponseDto })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getAuditLogs(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
    ): Promise<PaginatedAuditLogResponseDto> {
        return this.adminService.getAuditLogs(Number(page), Number(limit), search);
    }

    @Get('audit-logs/export')
    @ApiOperation({ summary: 'Export audit logs to CSV' })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiOkResponse({ schema: { type: 'string', format: 'binary' } })
    async exportAuditLogs(
        @Res() res: Response,
        @Query('search') search?: string,
    ) {
        const csv = await this.adminService.exportAuditLogs(search);
        res.header('Content-Type', 'text/csv');
        res.attachment(`audit-logs-${new Date().toISOString()}.csv`);
        res.send(csv);
    }

    // --- Module 6: AI Provider Configuration ---

    @Get('ai-providers')
    @ApiOperation({ summary: 'Get all AI provider configurations' })
    @ApiResponse({ status: 200, type: AIProvidersListResponseDto })
    async getAllAIProviderConfigs(): Promise<AIProvidersListResponseDto> {
        return await this.adminService.getAllAIProviderConfigs();
    }

    @Get('ai-providers/:provider')
    @ApiOperation({ summary: 'Get specific AI provider configuration' })
    @ApiResponse({ status: 200, type: AIProviderResponseDto })
    async getAIProviderConfig(
        @Param('provider') provider: string,
    ): Promise<AIProviderResponseDto | null> {
        return await this.adminService.getAIProviderConfig(provider);
    }

    @Post('ai-providers')
    @AuditLog('save AI provider config')
    @ApiOperation({ summary: 'Save or update AI provider configuration' })
    @ApiResponse({ status: 201, type: AIProviderResponseDto })
    async saveAIProviderConfig(
        @Body() config: AIProviderConfigDto,
    ): Promise<AIProviderResponseDto> {
        return await this.adminService.saveAIProviderConfig(config);
    }

    @Put('ai-providers/:provider')
    @AuditLog('update AI provider config')
    @ApiOperation({ summary: 'Update AI provider configuration' })
    @ApiResponse({ status: 200, type: AIProviderResponseDto })
    async updateAIProviderConfig(
        @Param('provider') provider: string,
        @Body() config: AIProviderConfigDto,
    ): Promise<AIProviderResponseDto> {
        return await this.adminService.saveAIProviderConfig({
            ...config,
            provider,
        });
    }

    @Post('ai-providers/:provider/models/refresh')
    @AuditLog('refresh AI provider models')
    @ApiOperation({ summary: 'Refresh AI provider model list' })
    @ApiResponse({ status: 200, type: AIProviderModelsResponseDto })
    async refreshAIProviderModels(
        @Param('provider') provider: string,
        @Body() dto: { apiKey?: string },
    ): Promise<AIProviderModelsResponseDto | null> {
        return await this.adminService.refreshAIProviderModels(provider, dto.apiKey);
    }

    @Get('ai-providers/custom')
    @ApiOperation({ summary: 'List custom AI providers' })
    @ApiResponse({ status: 200, type: CustomAIProvidersListResponseDto })
    async getCustomAIProviders(): Promise<CustomAIProvidersListResponseDto> {
        return await this.adminService.getCustomAIProviders();
    }

    @Post('ai-providers/custom')
    @AuditLog('save custom AI provider')
    @ApiOperation({ summary: 'Create or update custom AI provider' })
    @ApiResponse({ status: 201, type: CustomAIProviderDto })
    async saveCustomAIProvider(
        @Body() dto: CustomAIProviderDto,
    ): Promise<CustomAIProviderDto> {
        return await this.adminService.saveCustomAIProvider(dto);
    }

    @Delete('ai-providers/custom/:id')
    @AuditLog('delete custom AI provider')
    @ApiOperation({ summary: 'Delete custom AI provider' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async deleteCustomAIProvider(
        @Param('id') id: string,
    ): Promise<{ message: string }> {
        await this.adminService.deleteCustomAIProvider(id);
        return { message: `Custom AI provider ${id} deleted successfully` };
    }

    @Delete('ai-providers/:provider')
    @AuditLog('delete AI provider config')
    @ApiOperation({ summary: 'Delete AI provider configuration' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async deleteAIProviderConfig(
        @Param('provider') provider: string,
    ): Promise<{ message: string }> {
        await this.adminService.deleteAIProviderConfig(provider);
        return { message: `AI provider configuration for ${provider} deleted successfully` };
    }

    // ── Job Orders (Admin — full access, no scope) ────────────────────────

    @Get('job-orders')
    @ApiOperation({ summary: 'List all job orders' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedJobOrdersResponseDto })
    adminListJobOrders(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<JobOrder>> {
        return this.jobOrdersService.findAll({}, { page: +page, limit: +limit, status, search });
    }

    @Post('job-orders')
    @AuditLog('admin create job order')
    @ApiOperation({ summary: 'Create a job order (assigned to any recruiter)' })
    @ApiCreatedResponse({ type: JobOrderResponseDto })
    adminCreateJobOrder(@GetUser() user: User, @Body() dto: CreateJobOrderDto): Promise<JobOrder> {
        return this.jobOrdersService.create(dto, user.id);
    }

    @Get('job-orders/:id')
    @ApiOperation({ summary: 'Get any job order by ID' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    adminGetJobOrder(@Param('id') id: string): Promise<JobOrder> {
        return this.jobOrdersService.findOne(id);
    }

    @Put('job-orders/:id')
    @AuditLog('admin update job order')
    @ApiOperation({ summary: 'Update any job order' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    adminUpdateJobOrder(@Param('id') id: string, @Body() dto: UpdateJobOrderDto): Promise<JobOrder> {
        return this.jobOrdersService.update(id, dto);
    }

    @Patch('job-orders/:id/status')
    @AuditLog('admin update job order status')
    @ApiOperation({ summary: 'Update any job order status' })
    @ApiOkResponse({ type: JobOrderResponseDto })
    adminUpdateJobOrderStatus(@Param('id') id: string, @Body() dto: UpdateJobOrderStatusDto): Promise<JobOrder> {
        return this.jobOrdersService.updateStatus(id, dto.status);
    }

    @Delete('job-orders/:id')
    @AuditLog('delete job order')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a job order' })
    @ApiNoContentResponse()
    adminDeleteJobOrder(@Param('id') id: string): Promise<void> {
        return this.jobOrdersService.delete(id);
    }

    // ── Applications (Admin — full access, no scope) ───────────────────────

    @Get('applications')
    @ApiOperation({ summary: 'List all applications' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'jobOrderId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiOkResponse({ type: PaginatedApplicationsResponseDto })
    adminListApplications(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('status') status?: string,
        @Query('jobOrderId') jobOrderId?: string,
        @Query('search') search?: string,
    ): Promise<PaginatedResponse<Application>> {
        return this.applicationsService.findAll({}, { page: +page, limit: +limit, status, jobOrderId, search });
    }

    @Get('applications/:id')
    @ApiOperation({ summary: 'Get any application by ID' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    adminGetApplication(@Param('id') id: string): Promise<Application> {
        return this.applicationsService.findOne(id);
    }

    @Post('applications')
    @AuditLog('admin create application')
    @ApiOperation({ summary: 'Create an application manually' })
    @ApiCreatedResponse({ type: ApplicationResponseDto })
    adminCreateApplication(@Body() dto: CreateApplicationDto): Promise<Application> {
        return this.applicationsService.create(dto, 'recruiter_import');
    }

    @Patch('applications/:id/status')
    @AuditLog('admin update application status')
    @ApiOperation({ summary: 'Update any application status' })
    @ApiOkResponse({ type: ApplicationResponseDto })
    adminUpdateApplicationStatus(@Param('id') id: string, @Body() dto: UpdateApplicationStatusDto): Promise<Application> {
        return this.applicationsService.updateStatus(id, dto);
    }

    @Delete('applications/:id')
    @AuditLog('delete application')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an application' })
    @ApiNoContentResponse()
    adminDeleteApplication(@Param('id') id: string): Promise<void> {
        return this.applicationsService.delete(id);
    }

    // ── Reports ───────────────────────────────────────────────────────────

    @Get('reports/job-orders')
    @ApiOperation({ summary: 'Job order counts by status (all data)' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' } } } })
    adminReportJobOrders(): Promise<{ total: number; byStatus: Record<string, number> }> {
        return this.reportsService.getJobOrderStats();
    }

    @Get('reports/applications')
    @ApiOperation({ summary: 'Application counts by status and source (all data)' })
    @ApiOkResponse({ schema: { type: 'object', properties: { total: { type: 'number' }, byStatus: { type: 'object' }, bySource: { type: 'object' } } } })
    adminReportApplications(): Promise<{ total: number; byStatus: Record<string, number>; bySource: Record<string, number> }> {
        return this.reportsService.getApplicationStats();
    }

    @Get('reports/top-job-orders')
    @ApiOperation({ summary: 'Top job orders by application volume' })
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
    adminTopJobOrders(@Query('limit') limit = '5'): Promise<Array<{ id: string; title: string; status: string; applicationCount: number }>> {
        return this.reportsService.getTopJobOrders({}, +limit);
    }

    @Get('reports/activity')
    @ApiOperation({ summary: 'Daily activity timeline for the last N days' })
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
    adminActivityTimeline(@Query('days') days = '30'): Promise<Array<{ date: string; jobOrders: number; applications: number }>> {
        return this.reportsService.getActivityTimeline({}, +days);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    @Get('dashboard')
    @ApiOperation({ summary: 'Admin dashboard KPIs' })
    @ApiOkResponse({
        schema: {
            type: 'object',
            properties: {
                totalUsers: { type: 'number' },
                totalCompanies: { type: 'number' },
                totalJobOrders: { type: 'number' },
                totalApplications: { type: 'number' },
                openJobOrders: { type: 'number' },
                pendingDecisions: { type: 'number' },
                recentApplications: { type: 'array', items: { $ref: '#/components/schemas/Application' } },
            },
        },
    })
    adminDashboard(): Promise<{ totalUsers: number; totalCompanies: number; totalJobOrders: number; totalApplications: number; openJobOrders: number; pendingDecisions: number; recentApplications: Application[] }> {
        return this.dashboardService.getAdminDashboard();
    }
}

