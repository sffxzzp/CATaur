import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { UserRole, Role } from '../database/entities/user-role.entity';
import { UlidService } from '../common/ulid.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(UserRole)
        private userRolesRepository: Repository<UserRole>,
        private ulidService: UlidService,
        @Inject(CACHE_MANAGER)
        private cacheManager: Cache,
        private encryptionService: EncryptionService,
    ) { }

    private async clearUserCache(email: string): Promise<void> {
        await this.cacheManager.del(`auth_user_${email}`);
    }

    async findOneByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { email }, relations: ['roles'] });
        if (user?.phone) {
            user.phone = this.encryptionService.decryptText(user.phone as unknown as Buffer) as any;
        }
        return user;
    }

    async findOneById(id: string): Promise<User | null> {
        const user = await this.usersRepository.findOne({ where: { id }, relations: ['roles'] });
        if (user?.phone) {
            user.phone = this.encryptionService.decryptText(user.phone as unknown as Buffer) as any;
        }
        return user;
    }

    async findAll(): Promise<User[]> {
        const users = await this.usersRepository.find({ relations: ['roles'] });
        return users.map((user) => {
            if (user.phone) {
                user.phone = this.encryptionService.decryptText(user.phone as unknown as Buffer) as any;
            }
            return user;
        });
    }

    async create(userData: Partial<User> & { roles?: Role[] }): Promise<User> {
        const userId = this.ulidService.generate();
        const roles = userData.roles || [Role.USER];

        // Remove roles from userData to avoid error when saving User
        const { roles: _, ...userFields } = userData;

        const newUser = this.usersRepository.create({
            id: userId,
            ...userFields,
            phone: userFields.phone
                ? (Buffer.isBuffer(userFields.phone)
                    ? (userFields.phone as unknown as string)
                    : (this.encryptionService.encryptText(String(userFields.phone)) as unknown as string))
                : userFields.phone,
        });

        await this.usersRepository.save(newUser);

        // Create user roles
        const userRoles = roles.map(role => this.userRolesRepository.create({
            userId: userId,
            role: role
        }));

        await this.userRolesRepository.save(userRoles);

        if (userFields.email) {
            await this.clearUserCache(userFields.email);
        }

        return this.findOneById(userId) as Promise<User>;
    }

    async findByRole(role: Role): Promise<User[]> {
        const userRoles = await this.userRolesRepository.find({
            where: { role: role },
            relations: ['user', 'user.roles']
        });
        return userRoles.map(ur => ur.user);
    }

    async update(id: string, updateData: Partial<User>): Promise<User> {
        const payload: Partial<User> = { ...updateData };
        if (payload.phone !== undefined && payload.phone !== null) {
            payload.phone = Buffer.isBuffer(payload.phone)
                ? (payload.phone as unknown as string)
                : (this.encryptionService.encryptText(String(payload.phone)) as unknown as string);
        }

        await this.usersRepository.update(id, payload);
        const updatedUser = await this.usersRepository.findOne({ where: { id } });
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }
        if (updatedUser.phone) {
            updatedUser.phone = this.encryptionService.decryptText(updatedUser.phone as unknown as Buffer) as any;
        }
        await this.clearUserCache(updatedUser.email);
        return updatedUser;
    }

    async assignRoles(userId: string, roles: Role[]): Promise<User> {
        const user = await this.findOneById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Delete existing roles
        await this.userRolesRepository.delete({ userId });

        // Create new roles
        const userRoles = roles.map(role => this.userRolesRepository.create({
            userId,
            role
        }));
        await this.userRolesRepository.save(userRoles);

        await this.clearUserCache(user.email);

        return this.findOneById(userId) as Promise<User>;
    }
}
