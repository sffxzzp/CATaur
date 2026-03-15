import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../database/entities/notification.entity';
import { UlidService } from '../common/ulid.service';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        @InjectRepository(Notification)
        private repo: Repository<Notification>,
        private ulidService: UlidService,
    ) {}

    async findAll(userId: string, status: 'all' | 'read' | 'unread' = 'all') {
        const isRead = status === 'all' ? undefined : status === 'read';

        return this.repo.find({
            where: {
                userId,
                ...(isRead === undefined ? {} : { isRead }),
            },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async create(
        userId: string,
        type: string,
        title: string,
        body: string,
        refId?: string,
    ): Promise<Notification> {
        const notification = this.repo.create({
            id: this.ulidService.generate(),
            userId,
            type,
            title,
            body,
            isRead: false,
            refId: refId ?? null,
        });
        const saved = await this.repo.save(notification);
        this.logger.log(`Notification created for user ${userId}: [${type}] ${title}`);
        return saved;
    }

    async markAllRead(userId: string): Promise<void> {
        await this.repo.update({ userId, isRead: false }, { isRead: true });
        this.logger.log(`All notifications marked as read for user ${userId}`);
    }
}
