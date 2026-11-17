import crypto from 'node:crypto';
import { USAE_OFFICIAL_LOGO_URL } from '../src/utils/helpdesk.ts';
import { escapeHtml } from './security.ts';

export interface IntegrationReadiness {
  mercadoPago: {
    configured: boolean;
    webhookSecretConfigured: boolean;
    missingEnv: string[];
    statusLabel: string;
  };
  smtp: {
    configured: boolean;
    missingEnv: string[];
    statusLabel: string;
  };
  googleDrive: {
    configured: boolean;
    missingEnv: string[];
    statusLabel: string;
  };
  whatsapp: {
    configured: boolean;
    missingEnv: string[];
    statusLabel: string;
  };
  spei: {
    configured: boolean;
    bankName: string;
    accountHolder: string;
  };
}

export function getIntegrationsReadiness(settings?: {
  speiBankName?: string;
  speiAccountHolder?: string;
  speiClabe?: string;
}): IntegrationReadiness {
  const mpToken = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
  const mpSecret = Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim());
  const mpMissing: string[] = [];
  if (!mpToken) mpMissing.push('MERCADOPAGO_ACCESS_TOKEN');
  if (!mpSecret) mpMissing.push('MERCADOPAGO_WEBHOOK_SECRET');

  const smtpMissing: string[] = [];
  if (!process.env.SMTP_HOST?.trim()) smtpMissing.push('SMTP_HOST');
  if (!process.env.SMTP_USER?.trim()) smtpMissing.push('SMTP_USER');
  if (!process.env.SMTP_PASS?.trim()) smtpMissing.push('SMTP_PASS');

  const driveMissing: string[] = [];
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID?.trim()) driveMissing.push('GOOGLE_DRIVE_FOLDER_ID');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) driveMissing.push('GOOGLE_SERVICE_ACCOUNT_JSON');

  const waMissing: string[] = [];
  if (!process.env.WHATSAPP_TOKEN?.trim()) waMissing.push('WHATSAPP_TOKEN');
  if (!process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()) waMissing.push('WHATSAPP_PHONE_NUMBER_ID');

  const bankName = process.env.SPEI_BANK_NAME?.trim() || settings?.speiBankName || 'Pendiente de configurar';
  const accountHolder =
    process.env.SPEI_ACCOUNT_HOLDER?.trim() || settings?.speiAccountHolder || 'USAE Soluciones Tecnológicas';
  const clabe = process.env.SPEI_CLABE?.trim() || settings?.speiClabe || '';

  return {
    mercadoPago: {
      configured: mpToken && mpSecret,
      webhookSecretConfigured: mpSecret,
      missingEnv: mpMissing,
      statusLabel:
        mpToken && mpSecret
          ? 'Credenciales configuradas'
          : 'Pendiente de credenciales (pago en línea deshabilitado hasta configurar)',
    },
    smtp: {
      configured: smtpMissing.length === 0,
      missingEnv: smtpMissing,
      statusLabel:
        smtpMissing.length === 0
          ? 'SMTP configurado'
          : 'Pendiente de SMTP (notificaciones se registran en portal sin envío externo)',
    },
    googleDrive: {
      configured: driveMissing.length === 0,
      missingEnv: driveMissing,
      statusLabel:
        driveMissing.length === 0
          ? 'Carpeta Drive configurada'
          : 'Pendiente de credenciales Drive (evidencias resguardadas localmente en uploads/)',
    },
    whatsapp: {
      configured: waMissing.length === 0,
      missingEnv: waMissing,
      statusLabel:
        waMissing.length === 0
          ? 'WhatsApp Business configurado'
          : 'Pendiente de API oficial de WhatsApp',
    },
    spei: {
      configured: Boolean(clabe && clabe.length >= 16),
      bankName,
      accountHolder,
    },
  };
}

export function buildUsaeInstitutionalEmailHtml(params: {
  title: string;
  headline: string;
  bodyParagraphs: string[];
  actionLabel?: string;
  actionUrl?: string;
}): string {
  const safeTitle = escapeHtml(params.title);
  const safeHeadline = escapeHtml(params.headline);
  const paragraphsHtml = params.bodyParagraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0; color:#334155; font-size:15px; line-height:1.65;">${escapeHtml(p)}</p>`
    )
    .join('\n');

  const buttonHtml =
    params.actionLabel && params.actionUrl
      ? `<p style="margin:24px 0 8px 0;"><a href="${escapeHtml(params.actionUrl)}" style="display:inline-block; background-color:#1d4ed8; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:600; font-size:14px;">${escapeHtml(params.actionLabel)}</a></p>`
      : '';

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${safeTitle}</title></head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; margin:24px auto; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
    <tr>
      <td align="center" style="background-color:#16345f; padding:32px 28px;">
        <img src="${USAE_OFFICIAL_LOGO_URL}" alt="USAE Helpdesk" width="220" style="display:block; margin:0 auto 16px auto; border:0;">
        <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:600; letter-spacing:-0.3px;">Tecnología Profesional para tu Negocio</h1>
        <p style="margin:10px 0 0 0; color:#b8d8ff; font-size:14px; line-height:1.5;">Innovación y Tecnología para un Futuro Seguro · USAE Helpdesk</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px;">
        <h2 style="margin:0 0 16px 0; color:#0f172a; font-size:20px; font-weight:600;">${safeHeadline}</h2>
        ${paragraphsHtml}
        ${buttonHtml}
      </td>
    </tr>
    <tr>
      <td align="center" style="background-color:#0f172a; padding:28px 24px;">
        <p style="margin:0; color:#ffffff; font-size:15px; font-weight:600;">USAE Helpdesk</p>
        <p style="margin:8px 0 0 0; color:#94a3b8; font-size:12px; line-height:1.6;">Soporte y Soluciones Tecnológicas<br>Cd. Nezahualcóyotl, Estado de México · soporte.helpdesk.usae@gmail.com</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function createMercadoPagoPreference(params: {
  paymentId: string;
  planCode: string;
  planTitle: string;
  amountMxn: number;
  payerEmail: string;
  appBaseUrl: string;
}): Promise<{
  configured: boolean;
  preferenceId?: string;
  initPoint?: string;
  errorMessage?: string;
}> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    return {
      configured: false,
      errorMessage:
        'La pasarela Mercado Pago aún no tiene credenciales configuradas (MERCADOPAGO_ACCESS_TOKEN). La orden quedó registrada en estado PENDIENTE; puedes usar Transferencia SPEI para revisión administrativa o configurar Mercado Pago.',
    };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: params.planCode,
            title: `USAE Helpdesk — ${params.planTitle} (${params.planCode})`,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: params.amountMxn,
          },
        ],
        payer: {
          email: params.payerEmail,
        },
        external_reference: params.paymentId,
        notification_url: `${params.appBaseUrl.replace(/\/$/, '')}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${params.appBaseUrl.replace(/\/$/, '')}/?payment=returned&ref=${encodeURIComponent(params.paymentId)}`,
          pending: `${params.appBaseUrl.replace(/\/$/, '')}/?payment=pending&ref=${encodeURIComponent(params.paymentId)}`,
          failure: `${params.appBaseUrl.replace(/\/$/, '')}/?payment=failure&ref=${encodeURIComponent(params.paymentId)}`,
        },
        auto_return: 'approved',
      }),
    });

    if (!response.ok) {
      return {
        configured: true,
        errorMessage: 'No fue posible crear la preferencia de pago en Mercado Pago en este momento.',
      };
    }

    const json = (await response.json()) as { id?: string; init_point?: string; sandbox_init_point?: string };
    return {
      configured: true,
      preferenceId: json.id,
      initPoint: json.init_point || json.sandbox_init_point,
    };
  } catch {
    return {
      configured: true,
      errorMessage: 'Error de comunicación al contactar la API de Mercado Pago.',
    };
  }
}

export function verifyMercadoPagoWebhookSignature(params: {
  xSignatureHeader: string | undefined;
  xRequestIdHeader: string | undefined;
  dataId: string;
  secret: string | undefined;
}): boolean {
  const secret = params.secret?.trim();
  if (!secret || !params.xSignatureHeader || !params.dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    params.xSignatureHeader
      .split(',')
      .map((item) => item.trim().split('='))
      .filter(([k, v]) => k && v)
  ) as { ts?: string; v1?: string };

  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${params.dataId};request-id:${params.xRequestIdHeader ?? ''};ts:${parts.ts};`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    const a = Buffer.from(expectedHmac, 'hex');
    const b = Buffer.from(parts.v1, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function fetchMercadoPagoPaymentServerToServer(mpPaymentId: string): Promise<{
  ok: boolean;
  payment?: {
    id: string;
    status: string;
    status_detail: string;
    transaction_amount: number;
    currency_id: string;
    external_reference: string;
  };
}> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return { ok: false };

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(mpPaymentId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as {
      id: number | string;
      status: string;
      status_detail: string;
      transaction_amount: number;
      currency_id: string;
      external_reference: string;
    };
    return {
      ok: true,
      payment: {
        id: String(data.id),
        status: data.status,
        status_detail: data.status_detail ?? '',
        transaction_amount: Number(data.transaction_amount),
        currency_id: data.currency_id,
        external_reference: data.external_reference,
      },
    };
  } catch {
    return { ok: false };
  }
}
