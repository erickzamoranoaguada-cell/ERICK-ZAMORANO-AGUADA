import type { IncomingMessage, ServerResponse } from 'node:http';
import { getDriverProfile } from '../_lib/driverStore';

interface ServerlessRequest extends IncomingMessage {
  headers: IncomingMessage['headers'];
}

interface ServerlessResponse extends ServerResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ success: false, message: 'Método no permitido.' });
    return;
  }

  const result = await getDriverProfile(
    req.headers['x-driver-id'],
    req.headers['x-driver-token']
  );
  res.status(result.status).json(result.body);
}
