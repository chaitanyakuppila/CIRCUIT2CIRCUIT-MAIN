import app from '../server.ts';

export default function handler(req: any, res: any) {
  const queryIndex = typeof req.url === 'string' ? req.url.indexOf('?') : -1;
  const query = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
  req.url = `/api/conversations${query}`;
  return app(req, res);
}
