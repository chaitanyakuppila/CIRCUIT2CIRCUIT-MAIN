import app, { normalizeVercelRequest } from '../../server.ts';

export default function handler(req: any, res: any) {
  normalizeVercelRequest(req);

  if (typeof req.url === 'string') {
    if (!req.url.startsWith('/api/conversations')) {
      const queryIndex = req.url.indexOf('?');
      let queryString = '';
      if (queryIndex !== -1) {
        queryString = req.url.substring(queryIndex);
      }

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
        if (pathname.startsWith('/conversations')) {
          subpath = pathname.replace(/^\/conversations\/?/, '');
        } else {
          subpath = pathname.replace(/^\/+/, '');
        }
      }

      req.url = `/api/conversations${subpath ? `/${subpath}` : ''}${queryString}`;
    }
  }

  return app(req, res);
}
