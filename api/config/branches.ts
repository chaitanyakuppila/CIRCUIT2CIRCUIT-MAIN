import app from '../../server.ts';

export default function handler(req: any, res: any) {
  req.url = '/api/config/branches';
  return app(req, res);
}
