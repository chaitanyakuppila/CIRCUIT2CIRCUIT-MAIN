import app, { normalizeVercelRequest } from '../server.ts';

export default function handler(req: any, res: any) {
  normalizeVercelRequest(req);

  // If req.url doesn't already contain /api/conversations (e.g. Vercel stripped it to '/' or '/conv-123' or '?param=...'):
  if (typeof req.url === 'string') {
    if (!req.url.startsWith('/api/conversations')) {
      const queryIndex = req.url.indexOf('?');
      const query = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
      const pathname = queryIndex !== -1 ? req.url.substring(0, queryIndex) : req.url;

      if (pathname.startsWith('/conversations')) {
        req.url = `/api${pathname}${query}`;
      } else {
        const cleanSub = pathname.replace(/^\/+/, '');
        req.url = `/api/conversations${cleanSub ? `/${cleanSub}` : ''}${query}`;
      }
    }
  }

  return app(req, res);
}
