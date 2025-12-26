import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get('SMTP_HOST'),
                    port: configService.get('SMTP_PORT'),
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: configService.get('SMTP_USER'),
                        pass: configService.get('SMTP_PASS'),
                    },
                },
                defaults: {
                    from: configService.get('SMTP_FROM'),
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
