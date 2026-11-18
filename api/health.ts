import type { IncomingMessage, ServerResponse } from 'node:http';

interface ServerlessResponse extends ServerResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
}

export default function handler(req: IncomingMessage, res: ServerlessResponse): void {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json({ status: 'ok' });
}
