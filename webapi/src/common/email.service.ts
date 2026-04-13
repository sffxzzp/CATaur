import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailConfigService } from './email-config.service';
import { EmailConfigDto } from './dto/email-config.dto';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter | null = null;
    private transporterConfigSignature: string | null = null;

    constructor(
        private configService: ConfigService,
        private emailConfigService: EmailConfigService,
    ) { }

    private buildFromAddress(config: EmailConfigDto): string {
        return `${config.fromName} <${config.emailFrom}>`;
    }

    private async getEmailConfigOrThrow(): Promise<EmailConfigDto> {
        return await this.emailConfigService.getEmailConfig();
    }

    private async getTransporter(): Promise<nodemailer.Transporter> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const signature = JSON.stringify(emailConfig);
        const secure = Number(emailConfig.port) === 465;

        if (!this.transporter || this.transporterConfigSignature !== signature) {
            this.transporter = nodemailer.createTransport({
                host: emailConfig.host,
                port: Number(emailConfig.port),
                secure,
                auth: {
                    user: emailConfig.auth.user,
                    pass: emailConfig.auth.pass,
                },
            });
            this.transporterConfigSignature = signature;
        }

        return this.transporter;
    }

    async sendVerificationEmail(email: string, token: string): Promise<void> {
        const verificationLink = `${this.configService.get<string>('WEBAUTHN_ORIGIN')}/auth/verify?token=${token}`;
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject: 'Verify Your Email - CATaur',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">Welcome to CATaur</h2>
                    <p style="color: #555;">Please click the button below to verify your email and complete your registration:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                    </div>
                    <p style="color: #777; font-size: 12px;">Or copy and paste this link into your browser:</p>
                    <p style="color: #777; font-size: 12px;"><a href="${verificationLink}">${verificationLink}</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 11px;">If you did not request this email, please ignore it.</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Verification email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${email}: ${error.message}`);
            throw error;
        }
    }

    async sendVerificationCodeEmail(email: string, code: string): Promise<void> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject: 'Your Login Verification Code - CATaur',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">Verification Code</h2>
                    <p style="color: #555;">Use the following code to login to your CATaur account. This code will expire in 5 minutes.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px;">
                            ${code}
                        </div>
                    </div>
                    <p style="color: #777; font-size: 12px;">If you did not request this code, please ignore this email. Do not share this code with anyone.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 11px;">CATaur Security Team</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Verification code email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send verification code email to ${email}: ${error.message}`);
            throw error;
        }
    }

    async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject: 'Reset Your Password - CATaur',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p style="color: #555;">Click the button below to reset your password. This link will expire in 30 minutes.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="color: #777; font-size: 12px;">Or copy and paste this link into your browser:</p>
                    <p style="color: #777; font-size: 12px;"><a href="${resetLink}">${resetLink}</a></p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 11px;">If you did not request this email, please ignore it. Your password will not change without a valid reset link.</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Password reset email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
            throw error;
        }
    }

    async sendPasswordChangedNotification(email: string): Promise<void> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject: 'Your Password Has Been Changed - CATaur',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">Password Changed</h2>
                    <p style="color: #555;">Your password has been successfully changed. If you did not make this change, please contact our support team immediately.</p>
                    <div style="margin: 20px 0; padding: 10px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
                        <p style="color: #856404; margin: 0;">❗ If this was not you, click <a href="${this.configService.get<string>('WEBAUTHN_ORIGIN')}/auth/request-password-reset">here</a> to secure your account.</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 11px;">CATaur Security Team</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Password change notification sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send password change notification to ${email}: ${error.message}`);
            throw error;
        }
    }

    async sendInterviewInvitation(
        email: string,
        subject: string,
        content: string,
        interviewType?: string,
        interviewDate?: string,
        interviewTime?: string,
    ): Promise<void> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const typeIcon: Record<string, string> = {
            Zoom: '💻',
            Phone: '📞',
            Onsite: '🏢',
        };
        const icon = interviewType ? (typeIcon[interviewType] || '🗓️') : '🗓️';
        const typeLabel = interviewType || 'Interview';

        const detailsBlock = (interviewDate || interviewTime)
            ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0; border-radius: 12px; overflow: hidden; border: 2px solid #DBEAFE;">
                <tr><td style="background: #EFF6FF; padding: 8px 20px;">
                  <p style="margin: 0; font-size: 11px; font-weight: 700; color: #1D4ED8; letter-spacing: 0.08em; text-transform: uppercase;">Interview Details</p>
                </td></tr>
                <tr><td style="background: #F8FBFF; padding: 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${interviewType ? `<tr>
                      <td style="padding: 6px 0; width: 40%;">
                        <span style="font-size: 13px; color: #6B7280; font-weight: 600;">📋 Format</span>
                      </td>
                      <td style="padding: 6px 0;">
                        <span style="font-size: 14px; color: #111827; font-weight: 700;">${icon} ${typeLabel}</span>
                      </td>
                    </tr>` : ''}
                    ${interviewDate ? `<tr>
                      <td style="padding: 6px 0; width: 40%;">
                        <span style="font-size: 13px; color: #6B7280; font-weight: 600;">📅 Date</span>
                      </td>
                      <td style="padding: 6px 0;">
                        <span style="font-size: 14px; color: #111827; font-weight: 700;">${interviewDate}</span>
                      </td>
                    </tr>` : ''}
                    ${interviewTime ? `<tr>
                      <td style="padding: 6px 0; width: 40%;">
                        <span style="font-size: 13px; color: #6B7280; font-weight: 600;">⏰ Time</span>
                      </td>
                      <td style="padding: 6px 0;">
                        <span style="font-size: 14px; color: #111827; font-weight: 700;">${interviewTime}</span>
                      </td>
                    </tr>` : ''}
                  </table>
                </td></tr>
              </table>
            `
            : '';

        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 50%,#2563EB 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
          <div style="font-size:48px;line-height:1;margin-bottom:16px;">🗓️</div>
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">Interview Invitation</h1>
          <p style="margin:10px 0 0;font-size:15px;color:#BFDBFE;">You've been selected for an interview — exciting times ahead!</p>
        </td></tr>

        <!-- Blue accent bar -->
        <tr><td style="background:linear-gradient(90deg,#1D4ED8,#60A5FA,#1D4ED8);height:3px;"></td></tr>

        <!-- Body -->
        <tr><td style="background:#FFFFFF;padding:36px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;white-space:pre-line;">${content}</p>

          ${detailsBlock}

          <!-- Tips box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:#F0F9FF;border-left:4px solid #38BDF8;border-radius:0 8px 8px 0;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0369A1;">💡 Quick Tips for Your Interview</p>
              <ul style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.8;">
                <li>Research the company and the role thoroughly</li>
                <li>Prepare specific examples using the STAR method</li>
                <li>Test your tech setup 10 minutes before (for virtual interviews)</li>
                <li>Prepare a few thoughtful questions to ask</li>
              </ul>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">CATaur Talent Recruitment Suite</p>
          <p style="margin:0;font-size:12px;color:#9CA3AF;">This email was sent on behalf of a recruiter using CATaur. Please do not reply to this email.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject,
            html,
        };
        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Interview invitation sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send interview invitation to ${email}: ${error.message}`);
            throw error;
        }
    }


    async sendOfferNotification(email: string, jobTitle: string, content: string, companyName?: string): Promise<void> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const company = companyName || 'the company';

        const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offer Notification</title></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Confetti dots decoration -->
        <tr><td style="background:linear-gradient(135deg,#14532D 0%,#166534 40%,#15803D 75%,#16A34A 100%);border-radius:16px 16px 0 0;padding:48px 40px 36px;text-align:center;position:relative;overflow:hidden;">
          <!-- Emoji confetti row -->
          <p style="margin:0 0 8px;font-size:22px;letter-spacing:6px;">🎊 🏆 🎉 ✨ 🎊</p>
          <h1 style="margin:0 0 10px;font-size:30px;font-weight:900;color:#FFFFFF;letter-spacing:-0.02em;">Congratulations! 🎉</h1>
          <p style="margin:0;font-size:16px;color:#BBF7D0;font-weight:600;">You've received a job offer!</p>
        </td></tr>

        <!-- Gold accent bar -->
        <tr><td style="background:linear-gradient(90deg,#15803D,#86EFAC,#FCD34D,#86EFAC,#15803D);height:4px;"></td></tr>

        <!-- Hero text -->
        <tr><td style="background:#FFFFFF;padding:36px 40px 0;text-align:center;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#F0FDF4,#DCFCE7);border-radius:12px;border:2px solid #BBF7D0;margin-bottom:28px;">
            <tr><td style="padding:24px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#166534;letter-spacing:0.08em;text-transform:uppercase;">✨ Offer For</p>
              <p style="margin:0 0 4px;font-size:22px;font-weight:900;color:#14532D;">${jobTitle}</p>
              <p style="margin:0;font-size:14px;color:#166534;font-weight:600;">at ${company}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Body content -->
        <tr><td style="background:#FFFFFF;padding:4px 40px 32px;">
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.8;white-space:pre-line;">${content}</p>

          <!-- Next steps -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border-left:4px solid #FCD34D;border-radius:0 8px 8px 0;margin-bottom:28px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400E;">📋 What Happens Next</p>
              <ol style="margin:0;padding-left:20px;font-size:13px;color:#374151;line-height:1.9;">
                <li>Review the formal offer letter carefully</li>
                <li>Feel free to ask your recruiter any questions</li>
                <li>Negotiate if needed — this is completely normal! 💪</li>
                <li>Sign and return the offer by the deadline</li>
              </ol>
            </td></tr>
          </table>

          <p style="margin:0;font-size:15px;color:#166534;font-weight:600;text-align:center;">We're thrilled to have you join the team. This is just the beginning of an amazing journey! 🚀</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F9FAFB;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #E5E7EB;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">CATaur Talent Recruitment Suite</p>
          <p style="margin:0;font-size:12px;color:#9CA3AF;">This email was sent on behalf of a recruiter using CATaur. Please do not reply to this email.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject: `🎉 Congratulations! You've Received an Offer — ${jobTitle}`,
            html,
        };
        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Offer notification sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send offer notification to ${email}: ${error.message}`);
            throw error;
        }
    }


    async sendTestEmail(email: string): Promise<void> {
        const emailConfig = await this.getEmailConfigOrThrow();
        const transporter = await this.getTransporter();

        const mailOptions = {
            from: this.buildFromAddress(emailConfig),
            to: email,
            subject: 'SMTP Test Email - CATaur',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #333;">SMTP Test Email</h2>
                    <p style="color: #555;">This is a test email sent from CATaur admin panel.</p>
                    <p style="color: #555;">If you received this email, your SMTP configuration is working correctly.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 11px;">Sent at: ${new Date().toISOString()}</p>
                </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            this.logger.log(`Test email sent to ${email}`);
        } catch (error) {
            this.logger.error(`Failed to send test email to ${email}: ${error.message}`);
            throw error;
        }
    }
}
