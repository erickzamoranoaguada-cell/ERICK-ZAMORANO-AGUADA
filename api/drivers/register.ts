import type { IncomingMessage, ServerResponse } from 'node:http';
import { registerDriver } from '../_lib/driverStore';

interface ServerlessRequest extends IncomingMessage {
  body?: unknown;
}

interface ServerlessResponse extends ServerResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
}

async function readJsonBody(req: ServerlessRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Método no permitido.' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await registerDriver(body);
    res.status(result.status).json(result.body);
  } catch {
    res.status(400).json({
      success: false,
      message: 'Formato de solicitud inválido.',
    });
  }
}
