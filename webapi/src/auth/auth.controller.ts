import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiExtraModels, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { UserWithoutPassword } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordLoginDto } from './dto/password-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestVerificationCodeDto } from './dto/request-verification-code.dto';
import { VerifyCodeLoginDto } from './dto/verify-code-login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { GetUser } from './decorators/user.decorator';
import { Throttle } from '@nestjs/throttler';
import { CaptchaVerifyDto } from './dto/captcha-verify.dto';
import { TotpSetupResponseDto } from './dto/totp-setup-response.dto';
import { TotpSetupVerifyDto } from './dto/totp-setup-verify.dto';
import { TotpLoginDto } from './dto/totp-login.dto';
import { TotpDisableDto } from './dto/totp-disable.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GithubLoginDto } from './dto/github-login.dto';
import { createApiResponseDto } from '../common/dto/api-response.dto';

import { User } from '../database/entities/user.entity';

const UserResponseDto = createApiResponseDto(User);

@ApiTags('auth')
@ApiExtraModels(UserResponseDto, User)
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({ type: LoginResponseDto })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
        return this.authService.register(registerDto);
    }

    @Post('request-magic-link')
    @ApiOperation({ summary: 'Request a magic link for login (recovery)' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async requestMagicLink(@Body('email') email: string): Promise<{ message: string }> {
        await this.authService.requestMagicLink(email);
        return { message: 'Magic link sent' };
    }

    @Get('verify')
    @ApiOperation({ summary: 'Verify user email and login' })
    @ApiQuery({ name: 'token', description: 'The verification token' })
    @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Email verified and logged in successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async verify(@Query('token') token: string): Promise<LoginResponseDto> {
        return this.authService.verifyEmail(token);
    }

    @UseGuards(JwtAuthGuard)
    @Post('generate-registration-options')
    @ApiOperation({ summary: 'Generate WebAuthn registration options for this device' })
    @ApiOkResponse({ schema: { type: 'object' } })
    async generateRegistrationOptions(@Body('email') email: string): Promise<any> {
        return this.authService.generateRegistrationOptions(email);
    }

    @UseGuards(JwtAuthGuard)
    @Post('verify-registration')
    @ApiOperation({ summary: 'Verify WebAuthn registration response' })
    @ApiOkResponse({ schema: { type: 'object' } })
    async verifyRegistration(@Body('email') email: string, @Body('response') response: any): Promise<{ verified: boolean }> {
        return this.authService.verifyRegistration(email, response);
    }

    @Post('generate-authentication-options')
    @Throttle({ default: { limit: 10, ttl: 60 } })
    @ApiOperation({ summary: 'Generate WebAuthn authentication options' })
    @ApiOkResponse({ schema: { type: 'object' } })
    async generateAuthenticationOptions(@Body('email') email: string): Promise<any> {
        return this.authService.generateAuthenticationOptions(email);
    }

    @Post('verify-authentication')
    @Throttle({ default: { limit: 10, ttl: 60 } })
    @ApiOperation({ summary: 'Verify WebAuthn authentication response' })
    @ApiOkResponse({ schema: { type: 'object' } })
    async verifyAuthentication(@Body('email') email: string, @Body('response') response: any): Promise<any> {
        return this.authService.verifyAuthentication(email, response);
    }

    @Post('login/password')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid email or password' })
    async loginWithPassword(@Body() passwordLoginDto: PasswordLoginDto): Promise<LoginResponseDto> {
        return this.authService.loginWithPassword(
            passwordLoginDto.email,
            passwordLoginDto.password,
            passwordLoginDto.captchaToken,
        );
    }

    @Post('login/totp')
    @Throttle({ default: { limit: 5, ttl: 300 } })
    @ApiOperation({ summary: 'Complete login with TOTP' })
    @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid TOTP code or token' })
    async loginWithTotp(@Body() totpLoginDto: TotpLoginDto): Promise<LoginResponseDto> {
        return this.authService.loginWithTotp(totpLoginDto.mfaToken, totpLoginDto.code);
    }

    @Post('login/google')
    @ApiOperation({ summary: 'Login with Google via Firebase' })
    @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Login successful' })
    async loginWithGoogle(@Body() googleLoginDto: GoogleLoginDto): Promise<LoginResponseDto> {
        return this.authService.loginWithGoogle(googleLoginDto.idToken);
    }

    @Post('login/github')
    @ApiOperation({ summary: 'Login with GitHub via Firebase' })
    @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Login successful' })
    async loginWithGithub(@Body() githubLoginDto: GithubLoginDto): Promise<LoginResponseDto> {
        return this.authService.loginWithGithub(githubLoginDto.idToken);
    }

    @Post('request-password-reset')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @ApiOperation({ summary: 'Request a password reset email' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto): Promise<{ message: string }> {
        await this.authService.requestPasswordReset(requestPasswordResetDto.email);
        return { message: 'Password reset link sent if user exists' };
    }

    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password with token' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    @ApiResponse({ status: 400, description: 'Invalid or expired token' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
        return { message: 'Password reset successful' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    @ApiOperation({ summary: 'Change password for authenticated user' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    @ApiResponse({ status: 401, description: 'Invalid current password' })
    async changePassword(@GetUser() user: UserWithoutPassword, @Body() changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
        await this.authService.changePassword(user.id, changePasswordDto.oldPassword, changePasswordDto.newPassword);
        return { message: 'Password changed successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('set-password')
    @ApiOperation({ summary: 'Set password for newly verified user (after email verification)' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async setPassword(@GetUser() user: UserWithoutPassword, @Body() setPasswordDto: SetPasswordDto): Promise<{ message: string }> {
        await this.authService.setPassword(user.id, setPasswordDto.password);
        return { message: 'Password set successfully' };
    }

    @Post('request-verification-code')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @ApiOperation({ summary: 'Request verification code for email login' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async requestVerificationCode(@Body() requestVerificationCodeDto: RequestVerificationCodeDto): Promise<{ message: string }> {
        await this.authService.requestVerificationCode(requestVerificationCodeDto.email);
        return { message: 'Verification code sent if user exists' };
    }

    @Post('login/verification-code')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @ApiOperation({ summary: 'Login with email and verification code' })
    @ApiResponse({ status: 200, type: LoginResponseDto, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid email or code' })
    async loginWithVerificationCode(@Body() verifyCodeLoginDto: VerifyCodeLoginDto): Promise<LoginResponseDto> {
        return this.authService.loginWithVerificationCode(
            verifyCodeLoginDto.email,
            verifyCodeLoginDto.code,
            verifyCodeLoginDto.captchaToken,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('totp/setup')
    @ApiOperation({ summary: 'Generate TOTP setup secret and otpauth URL' })
    @ApiResponse({ status: 200, type: TotpSetupResponseDto, description: 'TOTP setup payload' })
    async setupTotp(@GetUser() user: UserWithoutPassword): Promise<TotpSetupResponseDto> {
        return this.authService.generateTotpSetup(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('totp/verify')
    @ApiOperation({ summary: 'Verify TOTP setup and enable MFA' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async verifyTotpSetup(@GetUser() user: UserWithoutPassword, @Body() dto: TotpSetupVerifyDto): Promise<{ message: string }> {
        await this.authService.verifyTotpSetup(user.id, dto.code);
        return { message: 'TOTP enabled' };
    }

    @UseGuards(JwtAuthGuard)
    @Post('totp/disable')
    @ApiOperation({ summary: 'Disable TOTP MFA' })
    @ApiOkResponse({ schema: { type: 'object', properties: { message: { type: 'string' } } } })
    async disableTotp(@GetUser() user: UserWithoutPassword, @Body() dto: TotpDisableDto): Promise<{ message: string }> {
        await this.authService.disableTotp(user.id, dto.code);
        return { message: 'TOTP disabled' };
    }

    @Post('captcha/verify')
    @Throttle({ default: { limit: 30, ttl: 60 } })
    @ApiOperation({ summary: 'Verify captcha token' })
    @ApiResponse({ 
        status: 200, 
        description: 'Captcha verification result',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', description: 'Whether the captcha verification was successful' }
            }
        }
    })
    async verifyCaptcha(@Body() captchaVerifyDto: CaptchaVerifyDto): Promise<{ success: boolean }> {
        const success = await this.authService.verifyCaptcha(captchaVerifyDto.token);
        return { success };
    }
}
