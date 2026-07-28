export interface Env {
  RESEND_API_KEY: string;
}

const FROM_ADDRESS = 'media@labs.publifix.net';
const TO_ADDRESS = 'media@publifix.net';
const ALLOWED_ORIGIN = 'https://labs.publifix.net';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  ...corsHeaders,
};

interface ContactPayload {
  nombre: string;
  email: string;
  telefono?: string;
  empresa: string;
  sitio?: string;
  notas?: string;
  preferencia: string;
}

const REQUIRED_FIELDS: (keyof ContactPayload)[] = ['nombre', 'email', 'empresa', 'preferencia'];

function isContactPayload(value: unknown): value is ContactPayload {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return REQUIRED_FIELDS.every((field) => typeof record[field] === 'string' && record[field] !== '');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderEmailHtml(data: ContactPayload): string {
  const rows: [string, string][] = [
    ['Nombre', data.nombre],
    ['Email', data.email],
    ['Teléfono', data.telefono?.trim() || '—'],
    ['Empresa o industria', data.empresa],
    ['Sitio web actual', data.sitio?.trim() || '—'],
    ['Preferencia de horario', data.preferencia],
    ['Notas adicionales', data.notas?.trim() || '—'],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#3A382B;white-space:nowrap;vertical-align:top;border-bottom:1px solid #e9e5cf;">${escapeHtml(
            label
          )}</td>
          <td style="padding:10px 14px;color:#3A382B;border-bottom:1px solid #e9e5cf;">${escapeHtml(value).replace(
            /\n/g,
            '<br>'
          )}</td>
        </tr>`
    )
    .join('');

  return `
    <div style="font-family:'Space Grotesk', Arial, sans-serif; background:#FFFCE9; padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#FFFCE9;">
        <h2 style="color:#3A382B;margin:0 0 4px;">Nueva solicitud de llamada</h2>
        <p style="color:#3A382B;opacity:0.7;margin:0 0 20px;">Recibida desde el formulario de Contacto en labs.publifix.net</p>
        <table style="border-collapse:collapse;width:100%;">
          ${rowsHtml}
        </table>
      </div>
    </div>
  `.trim();
}

async function handleOptions(): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders });
}

async function handleContactSubmit(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'El cuerpo de la solicitud no es JSON válido.' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  if (!isContactPayload(body)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Faltan campos requeridos (nombre, email, empresa o preferencia).' }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const data = body;

  let resendResponse: Response;
  try {
    resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [TO_ADDRESS],
        subject: `Nueva solicitud de llamada — ${data.nombre}`,
        html: renderEmailHtml(data),
        reply_to: data.email,
      }),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'No se pudo contactar al servicio de correo.' }),
      { status: 502, headers: jsonHeaders }
    );
  }

  if (!resendResponse.ok) {
    const detail = await resendResponse.text().catch(() => '');
    return new Response(
      JSON.stringify({ success: false, error: 'Resend rechazó el envío del correo.', detail }),
      { status: resendResponse.status, headers: jsonHeaders }
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: jsonHeaders });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Método no permitido.' }), {
        status: 405,
        headers: jsonHeaders,
      });
    }

    return handleContactSubmit(request, env);
  },
};
