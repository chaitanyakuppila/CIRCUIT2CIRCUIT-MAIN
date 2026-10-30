import app, { normalizeVercelRequest } from '../server.ts';

export default function handler(req: any, res: any) {
  normalizeVercelRequest(req);

  if (typeof req.url === 'string') {
    if (!req.url.startsWith('/api/listings')) {
      const queryIndex = req.url.indexOf('?');
      const query = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
      const pathname = queryIndex !== -1 ? req.url.substring(0, queryIndex) : req.url;

      if (pathname.startsWith('/listings')) {
        req.url = `/api${pathname}${query}`;
      } else {
        const cleanSub = pathname.replace(/^\/+/, '');
        req.url = `/api/listings${cleanSub ? `/${cleanSub}` : ''}${query}`;
      }
    }
  }

  return app(req, res);
}
