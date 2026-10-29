import fs from 'node:fs';
import path from 'node:path';

export default function handler(req: any, res: any) {
  const fileName = req.query?.file || (typeof req.url === 'string' ? path.basename(req.url.split('?')[0]) : '');
  
  if (!fileName || typeof fileName !== 'string' || fileName.includes('..') || fileName.includes('/')) {
    return res.status(400).send('Invalid filename.');
  }

  const isVercel = Boolean(process.env.VERCEL);
  const candidates = [
    path.join('/tmp', 'c2c-uploads', fileName),
    path.join(process.cwd(), 'public', 'uploads', fileName),
    path.join(process.cwd(), 'dist', 'uploads', fileName),
    path.join(__dirname, '..', '..', 'public', 'uploads', fileName),
    path.join(process.cwd(), 'public', 'assets', 'images', fileName),
    path.join(process.cwd(), 'dist', 'assets', 'images', fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const buffer = fs.readFileSync(candidate);
        const ext = path.extname(candidate).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
        return res.send(buffer);
      } catch (err) {
        console.error('Error reading upload:', err);
      }
    }
  }

  // Fallback to db.json (both /tmp runtime and bundled repo) if running in a fresh serverless instance
  const dbCandidates = [
    path.join('/tmp', 'c2c-data', 'db.json'),
    path.join(process.cwd(), 'data', 'db.json'),
    path.join(__dirname, '..', '..', 'data', 'db.json'),
  ];
  for (const dbPath of dbCandidates) {
    if (fs.existsSync(dbPath)) {
      try {
        const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        let targetDataUri = dbContent.uploads ? dbContent.uploads[fileName] : null;

        // If not found in uploads table, check if any listing has this photo embedded
        if (!targetDataUri && Array.isArray(dbContent.listings)) {
          for (const item of dbContent.listings) {
            if (item.photoUrl && typeof item.photoUrl === 'string' && item.photoUrl.includes(fileName) && item.photoUrl.startsWith('data:image/')) {
              targetDataUri = item.photoUrl;
              break;
            }
          }
        }

        if (targetDataUri) {
          const matches = targetDataUri.match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i);
          if (matches) {
            const contentType = matches[1].toLowerCase();
            const buffer = Buffer.from(matches[2], 'base64');
            // Write to /tmp so subsequent requests in this container hit disk directly
            try {
              const tmpDir = path.join('/tmp', 'c2c-uploads');
              if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
              fs.writeFileSync(path.join(tmpDir, fileName), buffer);
            } catch (e) {}
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
            return res.send(buffer);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return res.status(404).send('Photo not found');
}
