import { env } from '../config/env';
import { getRegistrationEmailTemplate } from '../templates/email';
type RegistrationRole = 'PATIENT' | 'DOCTOR' | 'HOSPITAL' | 'CMO_DISTRICT' | 'CMO_STATE' | 'CMO_NOMINEE_AC';

const roleLabels: Record<RegistrationRole, string> = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  HOSPITAL: 'hospital',
  CMO_DISTRICT: 'district CMO',
  CMO_STATE: 'state CMO',
  CMO_NOMINEE_AC: 'nominee AC CMO'
};

export async function sendRegistrationEmail(email: string, role: RegistrationRole): Promise<void> {
  if (!env.zeptoMailToken || !env.zeptoMailFrom) {
    console.warn('Registration email skipped: ZeptoMail is not configured');
    return;
  }

    const token = env.zeptoMailToken.replace(/^["']|["']$/g, '');
    const authHeader = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;

    const response = await fetch(env.zeptoMailApiUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
    body: JSON.stringify({
      from: {
        address: env.zeptoMailFrom,
        name: env.zeptoMailFromName
      },
      to: [{ email_address: { address: email } }],
      subject: 'Welcome to Hope-Care',
      htmlbody: getRegistrationEmailTemplate(roleLabels[role])
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ZeptoMail request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
}
