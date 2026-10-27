import app from '../server.ts';

export default function handler(req: any, res: any) {
  req.url = '/api/upload';
  return app(req, res);
}
