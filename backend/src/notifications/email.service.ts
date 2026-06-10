import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface ReminderEmailData {
  to: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  psyName: string;
  confirmationUrl?: string;
  cancellationUrl?: string;
  hoursAhead: 24 | 1;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('RESEND_FROM', 'PsiClínica <noreply@psiclinica.com>');
  }

  async sendReminderEmail(data: ReminderEmailData): Promise<void> {
    const subject =
      data.hoursAhead === 24
        ? `Lembrete: sua sessão amanhã às ${data.appointmentTime}`
        : `Lembrete: sua sessão em 1 hora — ${data.appointmentTime}`;

    const html = this.buildReminderHtml(data);

    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to: data.to,
        subject,
        html,
      });
      this.logger.log(`Reminder e-mail sent to ${data.to} — id: ${result.data?.id}`);
    } catch (err) {
      this.logger.error(`Failed to send reminder e-mail to ${data.to}`, err);
      throw err;
    }
  }

  private buildReminderHtml(data: ReminderEmailData): string {
    const timeLabel = data.hoursAhead === 24 ? 'amanhã' : 'em 1 hora';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

        <tr>
          <td style="background:#4f46e5;padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">PsiClínica</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;color:#374151;font-size:16px;">Olá, <strong>${data.patientName}</strong>!</p>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
              Você tem uma sessão agendada <strong>${timeLabel}</strong>:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:28px;">
              <tr>
                <td style="padding:8px 20px;">
                  <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Data</p>
                  <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${data.appointmentDate}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 20px;">
                  <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Horário</p>
                  <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${data.appointmentTime}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 20px;">
                  <p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Profissional</p>
                  <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${data.psyName}</p>
                </td>
              </tr>
            </table>

            ${
              data.confirmationUrl
                ? `
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding-right:12px;">
                  <a href="${data.confirmationUrl}"
                    style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;
                           padding:12px 24px;border-radius:8px;text-decoration:none;">
                    ✓ Confirmar presença
                  </a>
                </td>
                <td>
                  <a href="${data.cancellationUrl}"
                    style="display:inline-block;background:#f3f4f6;color:#374151;font-size:14px;font-weight:600;
                           padding:12px 24px;border-radius:8px;text-decoration:none;">
                    Preciso cancelar
                  </a>
                </td>
              </tr>
            </table>
            `
                : ''
            }

            <p style="margin:0;color:#9ca3af;font-size:13px;">
              Este é um lembrete automático da plataforma PsiClínica.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
