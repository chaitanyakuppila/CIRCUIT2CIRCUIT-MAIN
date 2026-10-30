import app, { normalizeVercelRequest } from '../../server.ts';

export default function handler(req: any, res: any) {
  normalizeVercelRequest(req);

  if (typeof req.url === 'string') {
    if (!req.url.startsWith('/api/requests/')) {
      const queryIndex = req.url.indexOf('?');
      let queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : '';
      let subpath = '';

      if (req.query?.path) {
        const rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
        subpath = rawPath.replace(/^\/+/, '');
        try {
          const urlObj = new URL(req.url || '/', 'http://localhost');
          urlObj.searchParams.delete('path');
          queryString = urlObj.search;
        } catch (e) {
          // ignore
        }
      } else {
        const pathname = queryIndex !== -1 ? req.url.substring(0, queryIndex) : req.url;
        subpath = pathname.replace(/^\/api\/requests\/?/, '').replace(/^\/requests\/?/, '').replace(/^\/+/, '');
      }

      req.url = `/api/requests${subpath ? `/${subpath}` : ''}${queryString}`;
    }
  }

  return app(req, res);
}
