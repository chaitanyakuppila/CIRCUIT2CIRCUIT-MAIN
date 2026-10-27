import app, { normalizeVercelRequest } from '../server.ts';

export default function handler(req: any, res: any) {
  normalizeVercelRequest(req);
  return app(req, res);
}
