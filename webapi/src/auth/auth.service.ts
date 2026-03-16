import {
    Injectable,
    ConflictException,
    Inject,
    UnauthorizedException,
    BadRequestException,
    NotFoundException,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/user-role.entity';
import { Candidate } from '../database/entities/candidate.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Passkey } from '../database/entities/passkey.entity';
import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    VerifiedRegistrationResponse,
    VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { ConfigService } from '@nestjs/config';

import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { EmailService } from '../common/email.service';
import { UlidService } from '../common/ulid.service';
import * as bcrypt from 'bcrypt';
import { AuthAttemptsService } from './auth-attempts.service';
import { CaptchaService } from './captcha.service';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';
import { FirebaseService } from './firebase.service';


export type UserWithoutPassword = User;

const TOTP_SETUP_TTL_MS = 10 * 60 * 1000;
const MFA_LOGIN_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private emailService: EmailService,
        private ulidService: UlidService,
        private configService: ConfigService,
        @InjectRepository(Passkey)
        private passkeyRepository: Repository<Passkey>,
        @InjectRepository(Candidate)
        private candidateRepository: Repository<Candidate>,
        private authAttempts: AuthAttemptsService,
        private captchaService: CaptchaService,
        private firebaseService: FirebaseService,
    ) {

        authenticator.options = { step: 30, window: 1 };
    }

    async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
        await this.authAttempts.checkEmailActionAllowed(registerDto.email, 'register');
        let user = await this.usersService.findOneByEmail(registerDto.email);

        if (user) {
            if (user.isActive) {
                throw new ConflictException('Email already registered');
            }
            // If inactive, update with new details
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            user = await this.usersService.update(user.id, {
                nickname: registerDto.nickname,
                passwordHash: hashedPassword,
                isActive: true, // Auto-activate
            });
        } else {
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            
            // Security: Restrict public registration roles to prevent privilege escalation
            // Allow only 'Candidate' and 'User' from public register endpoint
            let targetRole = registerDto.role || Role.CANDIDATE;
            const allowedPublicRoles = [Role.CANDIDATE, Role.USER];
            if (!allowedPublicRoles.includes(targetRole)) {
                targetRole = Role.CANDIDATE; // Force downgrade to Candidate for security
            }

            // Create active user with specified role
            user = await this.usersService.create({
                email: registerDto.email,
                passwordHash: hashedPassword,
                nickname: registerDto.nickname,
                isActive: true,
                roles: [targetRole] as any,
            });

            // Initialize candidate profile if role is Candidate
            if (targetRole === Role.CANDIDATE) {
                const candidate = this.candidateRepository.create({
                    id: user.id,
                    profileStatus: 'draft',
                });
                await this.candidateRepository.save(candidate);
            }
        }

        // Return login token immediately for "instant access"
        return this.login(user);
    }

    async requestMagicLink(email: string): Promise<void> {
        const user = await this.usersService.findOneByEmail(email);

        if (!user || !user.isActive) {
            // For security, we might not want to reveal if user exists,
            // but for a test app / internal tools, a clearer error is often better.
            throw new NotFoundException('Active user not found');
        }

        // Generate and store verification token (reuse same prefix as registration for simplicity)
        const token = this.ulidService.generate();
        await this.cacheManager.set(`verify_email:${token}`, user.email, 3600 * 1000); // 1 hour

        // Send email (we can reuse the same template or add a new one if needed, 
        // but verifyEmail works for both)
        await this.emailService.sendVerificationEmail(user.email, token);
    }

    async verifyEmail(token: string): Promise<LoginResponseDto> {
        const email = await this.cacheManager.get<string>(`verify_email:${token}`);
        if (!email) {
            throw new BadRequestException('Invalid or expired verification token');
        }

        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        await this.usersService.update(user.id, { isActive: true });
        await this.cacheManager.del(`verify_email:${token}`);

        // Return login token immediately so user can bind passkey
        return this.login(user);
    }

    async login(user: UserWithoutPassword): Promise<LoginResponseDto> {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            userId: user.id,
            email: user.email,
            roles: user.roles?.map(r => r.role) || [],
        };
    }

    async loginWithGoogle(idToken: string): Promise<LoginResponseDto> {
        return this.loginWithFirebaseToken(idToken);
    }

    async loginWithGithub(idToken: string): Promise<LoginResponseDto> {
        return this.loginWithFirebaseToken(idToken);
    }

    private async loginWithFirebaseToken(idToken: string): Promise<LoginResponseDto> {
        const { email, name } = await this.firebaseService.verifyIdToken(idToken);
        let user = await this.usersService.findOneByEmail(email);

        if (!user) {
            // Auto-create user if not exists
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = await this.usersService.create({
                email,
                nickname: name,
                passwordHash: hashedPassword,
                isActive: true,
                roles: [Role.CANDIDATE] as any,
            });

            // Initialize candidate profile
            const candidate = this.candidateRepository.create({
                id: user.id,
                profileStatus: 'draft',
            });
            await this.candidateRepository.save(candidate);
        } else if (!user.isActive) {
            // Auto-activate user if found but inactive
            user = await this.usersService.update(user.id, { isActive: true });
        }

        // Update last login time
        await this.usersService.update(user.id, { lastLoginAt: new Date() });
        await this.authAttempts.recordSuccess(email);

        return this.login(user);
    }

    async generateRegistrationOptions(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const userPasskeys = await this.passkeyRepository.find({ where: { userId: user.id } });

        const rpName = this.configService.get<string>('WEBAUTHN_RP_NAME') || 'CATaur';
        const rpID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';

        const excludeCredentials = userPasskeys.map(passkey => ({
            id: passkey.credentialID,
            type: 'public-key' as const,
        }));

        const options = await generateRegistrationOptions({
            rpName,
            rpID,
            userID: Buffer.from(user.id),
            userName: user.email,
            attestationType: 'none',
            excludeCredentials,
            authenticatorSelection: {
                residentKey: 'preferred',
                userVerification: 'preferred',
                authenticatorAttachment: 'platform',
            },
        });

        await this.cacheManager.set(`registration_challenge:${user.id}`, options.challenge, 60000);

        return options;
    }

    async verifyRegistration(email: string, body: any) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const expectedChallenge = await this.cacheManager.get<string>(`registration_challenge:${user.id}`);
        if (!expectedChallenge) {
            throw new BadRequestException('Registration challenge expired or not found');
        }

        const expectedOrigin = this.configService.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:3000';
        const expectedRPID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';

        let verification: VerifiedRegistrationResponse;
        try {
            verification = await verifyRegistrationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin,
                expectedRPID,
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }

        const { verified, registrationInfo } = verification;

        if (verified && registrationInfo) {
            const { credential } = registrationInfo;
            const credentialID = credential.id;

            const existingPasskey = await this.passkeyRepository.findOne({ where: { credentialID } });
            if (existingPasskey) {
                throw new ConflictException('Passkey already registered');
            }

            const newPasskey = this.passkeyRepository.create({
                credentialID: credentialID,
                publicKey: Buffer.from(credential.publicKey),
                counter: credential.counter,
                transports: body.response.transports,
                userId: user.id,
            });

            await this.passkeyRepository.save(newPasskey);
            await this.cacheManager.del(`registration_challenge:${user.id}`);

            return { verified: true };
        }

        return { verified: false };
    }

    async generateAuthenticationOptions(email: string) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const userPasskeys = await this.passkeyRepository.find({ where: { userId: user.id } });
        const rpID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';

        const options = await generateAuthenticationOptions({
            rpID,
            allowCredentials: userPasskeys.map(passkey => ({
                id: passkey.credentialID,
                type: 'public-key' as const,
            })),
            userVerification: 'preferred',
        });

        await this.cacheManager.set(`authentication_challenge:${user.id}`, options.challenge, 60000);

        return options;
    }

    async verifyAuthentication(email: string, body: any) {
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const expectedChallenge = await this.cacheManager.get<string>(`authentication_challenge:${user.id}`);
        if (!expectedChallenge) {
            throw new BadRequestException('Authentication challenge expired or not found');
        }

        const passkey = await this.passkeyRepository.findOne({ where: { credentialID: body.id } });
        if (!passkey) {
            throw new NotFoundException('Passkey not found');
        }

        const expectedOrigin = this.configService.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:3000';
        const expectedRPID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost';

        let verification: VerifiedAuthenticationResponse;
        try {
            verification = await verifyAuthenticationResponse({
                response: body,
                expectedChallenge,
                expectedOrigin,
                expectedRPID,
                credential: {
                    id: passkey.credentialID,
                    publicKey: new Uint8Array(passkey.publicKey),
                    counter: passkey.counter,
                },
            });
        } catch (error) {
            throw new BadRequestException(error.message);
        }

        const { verified, authenticationInfo } = verification;

        if (verified) {
            passkey.counter = authenticationInfo.newCounter;
            await this.passkeyRepository.save(passkey);
            await this.cacheManager.del(`authentication_challenge:${user.id}`);

            return this.login(user);
        }

        return { verified: false };
    }

    async loginWithPassword(email: string, password: string, captchaToken?: string): Promise<LoginResponseDto> {
        await this.enforceLoginProtections(email, captchaToken);
        const user = await this.usersService.findOneByEmail(email);
        if (!user || !user.isActive) {
            await this.authAttempts.recordFailure(email);
            throw new UnauthorizedException('Invalid email or password');
        }

        if (!user.passwordHash) {
            await this.authAttempts.recordFailure(email);
            throw new UnauthorizedException('Password login not enabled for this account');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            await this.authAttempts.recordFailure(email);
            throw new UnauthorizedException('Invalid email or password');
        }

        if (this.isTotpEnabled(user)) {
            return this.startTotpLogin(user);
        }

        // Update last login time
        await this.usersService.update(user.id, { lastLoginAt: new Date() });
        await this.authAttempts.recordSuccess(email);

        return this.login(user);
    }

    async setPassword(userId: string, password: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.update(userId, { passwordHash: hashedPassword });
    }

    async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.passwordHash) {
            throw new BadRequestException('Password not set for this account');
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid current password');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(userId, { passwordHash: hashedPassword });
        await this.emailService.sendPasswordChangedNotification(user.email);
    }

    async requestPasswordReset(email: string): Promise<void> {
        await this.authAttempts.checkEmailActionAllowed(email, 'requestPasswordReset');
        const user = await this.usersService.findOneByEmail(email);

        // For security, we return success even if user doesn't exist
        if (!user || !user.isActive) {
            return;
        }

        // Generate reset token
        const resetToken = this.ulidService.generate();

        // Store token in Redis with 30-minute expiry (1800000 ms)
        const cacheKey = `password_reset:${resetToken}`;
        await this.cacheManager.set(cacheKey, user.email, 1800000);

        // Send reset email
        const resetLink = `${this.configService.get<string>('WEBAUTHN_ORIGIN')}/reset-password?token=${resetToken}`;
        await this.emailService.sendPasswordResetEmail(user.email, resetLink);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const cacheKey = `password_reset:${token}`;
        const email = await this.cacheManager.get<string>(cacheKey);
        
        if (!email) {
            throw new BadRequestException('Invalid or expired reset token');
        }

        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.update(user.id, {
            passwordHash: hashedPassword,
        });

        // Delete the token after successful reset
        await this.cacheManager.del(cacheKey);

        await this.emailService.sendPasswordChangedNotification(user.email);
    }

    private generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async requestVerificationCode(email: string): Promise<void> {
        await this.authAttempts.checkEmailActionAllowed(email, 'requestVerificationCode');
        const user = await this.usersService.findOneByEmail(email);

        // Send code even if user doesn't exist to support auto-registration

        const code = this.generateVerificationCode();
        const cacheKey = `verification_code:${email}`;

        // Store in Redis with 5-minute expiry (300000 ms)
        await this.cacheManager.set(cacheKey, code, 300000);

        console.log(`DEBUG: Verification code for ${email}: ${code}`); // Added for testing

        // Send verification code email
        await this.emailService.sendVerificationCodeEmail(email, code);
    }

    async loginWithVerificationCode(email: string, code: string, captchaToken?: string): Promise<LoginResponseDto> {
        await this.enforceLoginProtections(email, captchaToken);
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser && !existingUser.isActive) {
            await this.authAttempts.recordFailure(email);
            throw new UnauthorizedException('Invalid email or verification code');
        }

        const cacheKey = `verification_code:${email}`;
        const storedCode = await this.cacheManager.get<string>(cacheKey);

        if (!storedCode || storedCode !== code) {
            await this.authAttempts.recordFailure(email);
            throw new UnauthorizedException('Invalid email or verification code');
        }

        // Delete the code after successful verification
        await this.cacheManager.del(cacheKey);

        let user = await this.usersService.findOneByEmail(email);

        if (!user) {
            // Auto-register new user as Candidate
            const nickname = email.split('@')[0];
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            user = await this.usersService.create({
                email,
                nickname,
                passwordHash: hashedPassword,
                isActive: true,
                roles: [Role.CANDIDATE] as any,
            });

            // Initialize candidate profile
            const candidate = this.candidateRepository.create({
                id: user.id,
                profileStatus: 'draft',
            });
            await this.candidateRepository.save(candidate);
        }

        if (this.isTotpEnabled(user)) {
            return this.startTotpLogin(user);
        }

        // Update last login time
        await this.usersService.update(user.id, { lastLoginAt: new Date() });
        await this.authAttempts.recordSuccess(email);

        return this.login(user);
    }

    async generateTotpSetup(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (this.isTotpEnabled(user)) {
            throw new BadRequestException('TOTP already enabled');
        }

        const secret = authenticator.generateSecret();
        const issuer = this.configService.get<string>('TOTP_ISSUER') || 'CATaur';
        const otpauthUrl = authenticator.keyuri(user.email, issuer, secret);

        await this.cacheManager.set(`totp_setup:${user.id}`, secret, TOTP_SETUP_TTL_MS);

        return { secret, otpauthUrl };
    }

    async verifyTotpSetup(userId: string, code: string): Promise<void> {
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (this.isTotpEnabled(user)) {
            throw new BadRequestException('TOTP already enabled');
        }

        const secret = await this.cacheManager.get<string>(`totp_setup:${user.id}`);
        if (!secret) {
            throw new BadRequestException('TOTP setup expired or not found');
        }

        const isValid = authenticator.check(code, secret);
        if (!isValid) {
            throw new UnauthorizedException('Invalid TOTP code');
        }

        const encrypted = this.encryptTotpSecret(secret);
        await this.usersService.update(user.id, {
            totpEnabled: true,
            totpSecretEnc: encrypted,
            totpVerifiedAt: new Date(),
        });

        await this.cacheManager.del(`totp_setup:${user.id}`);
    }

    async disableTotp(userId: string, code: string): Promise<void> {
        const user = await this.usersService.findOneById(userId);
        if (!user || !this.isTotpEnabled(user) || !user.totpSecretEnc) {
            throw new BadRequestException('TOTP not enabled');
        }

        const secret = this.decryptTotpSecret(user.totpSecretEnc);
        const isValid = authenticator.check(code, secret);
        if (!isValid) {
            throw new UnauthorizedException('Invalid TOTP code');
        }

        await this.usersService.update(user.id, {
            totpEnabled: false,
            totpSecretEnc: null,
            totpVerifiedAt: null,
        });
    }

    async loginWithTotp(mfaToken: string, code: string): Promise<LoginResponseDto> {
        const userId = await this.cacheManager.get<string>(`mfa_login:${mfaToken}`);
        if (!userId) {
            throw new UnauthorizedException('Invalid or expired MFA token');
        }

        const user = await this.usersService.findOneById(userId);
        if (!user || !this.isTotpEnabled(user) || !user.totpSecretEnc) {
            throw new UnauthorizedException('TOTP not enabled for this account');
        }

        await this.authAttempts.checkTotpAllowed(user.id);

        const secret = this.decryptTotpSecret(user.totpSecretEnc);
        const isValid = authenticator.check(code, secret);
        if (!isValid) {
            await this.authAttempts.recordTotpFailure(user.id);
            throw new UnauthorizedException('Invalid TOTP code');
        }

        await this.authAttempts.clearTotpFailures(user.id);
        await this.cacheManager.del(`mfa_login:${mfaToken}`);
        await this.usersService.update(user.id, { lastLoginAt: new Date() });
        await this.authAttempts.recordSuccess(user.email);

        return this.login(user);
    }

    async verifyCaptcha(token: string): Promise<boolean> {
        return this.captchaService.verifyToken(token);
    }

    private async enforceLoginProtections(email: string, captchaToken?: string): Promise<void> {
        const state = await this.authAttempts.getLoginState(email);
        if (state.locked) {
            throw new HttpException('Account temporarily locked. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
        }

        if (!state.captchaRequired) {
            return;
        }

        if (!captchaToken) {
            throw new BadRequestException('Captcha required');
        }

        const captchaValid = await this.captchaService.verifyToken(captchaToken);
        if (!captchaValid) {
            await this.authAttempts.recordFailure(email);
            throw new BadRequestException('Invalid captcha');
        }
    }

    private isTotpEnabled(user: User): boolean {
        return Boolean(user.totpEnabled && user.totpSecretEnc);
    }

    private async startTotpLogin(user: User): Promise<LoginResponseDto> {
        const mfaToken = this.ulidService.generate();
        await this.cacheManager.set(`mfa_login:${mfaToken}`, user.id, MFA_LOGIN_TTL_MS);
        return {
            access_token: undefined,
            userId: user.id,
            email: user.email,
            roles: user.roles?.map(r => r.role) || [],
            mfa_required: true,
            mfa_token: mfaToken,
            mfa_type: 'totp',
        };
    }

    private getTotpEncryptionKey(): Buffer {
        const keyBase64 = this.configService.get<string>('TOTP_ENC_KEY');
        if (!keyBase64) {
            throw new InternalServerErrorException('TOTP_ENC_KEY is required');
        }

        const key = Buffer.from(keyBase64, 'base64');
        if (key.length !== 32) {
            throw new InternalServerErrorException('TOTP_ENC_KEY must be a 32-byte base64 value');
        }

        return key;
    }

    private encryptTotpSecret(secret: string): string {
        const key = this.getTotpEncryptionKey();
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encrypted]).toString('base64');
    }

    private decryptTotpSecret(payload: string): string {
        const key = this.getTotpEncryptionKey();
        const data = Buffer.from(payload, 'base64');

        const iv = data.subarray(0, 12);
        const tag = data.subarray(12, 28);
        const encrypted = data.subarray(28);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
    }
}
