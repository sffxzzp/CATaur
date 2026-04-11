import { Global, Module } from '@nestjs/common';
import { UlidService } from './ulid.service';
import { EmailService } from './email.service';
import { EmailConfigService } from './email-config.service';
import { EncryptionService } from './encryption.service';
import { ContentSafetyService } from './content-safety.service';

@Global()
@Module({
    providers: [UlidService, EmailService, EmailConfigService, EncryptionService, ContentSafetyService],
    exports: [UlidService, EmailService, EmailConfigService, EncryptionService, ContentSafetyService],
})
export class CommonModule { }
