import { Controller, Get, Patch, HttpCode, HttpStatus, ParseEnumPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetUser } from '../auth/decorators/user.decorator';
import { RequireRoles } from '../auth/decorators/roles.decorator';
import { Role } from '../database/entities/user-role.entity';
import { User } from '../database/entities/user.entity';
import { Notification } from '../database/entities/notification.entity';
import { NotificationsService } from './notifications.service';

enum NotificationStatusFilter {
    ALL = 'all',
    READ = 'read',
    UNREAD = 'unread',
}

@ApiTags('notifications')
@Controller(['candidate', 'client', 'recruiter'])
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles(Role.CANDIDATE, Role.CLIENT, Role.RECRUITER, Role.ADMIN)
@ApiBearerAuth()
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) {}

    @Get('notifications')
    @ApiOperation({ summary: 'Get my notifications' })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: NotificationStatusFilter,
        description: 'Filter notifications by read status',
    })
    @ApiOkResponse({ type: [Notification] })
    getNotifications(
        @GetUser() user: User,
        @Query('status', new ParseEnumPipe(NotificationStatusFilter, { optional: true }))
        status: NotificationStatusFilter = NotificationStatusFilter.ALL,
    ): Promise<Notification[]> {
        return this.notificationsService.findAll(user.id, status);
    }

    @Patch('notifications/read-all')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiNoContentResponse()
    markAllRead(@GetUser() user: User): Promise<void> {
        return this.notificationsService.markAllRead(user.id);
    }
}
