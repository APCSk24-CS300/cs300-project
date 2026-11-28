import { Router } from 'express';
import Validator from '../middleware/ValidatorMiddleware.ts';
import type { AvatarService } from '../services/AvatarService.ts';
import { MAX_AVATAR_BYTES } from '../helper/validateAvatar.ts';
export function createAvatarRoute(service: AvatarService) {
 const router = Router();
 router.use(Validator.validateAccessToken);
 router.get('/files/:fileName', async (req, res) => {
  const result = await service.read(res.locals.user.sub, req.params.fileName);
  if (result.status !== 200) {
   res.status(result.status).json({ success: false, message: result.status === 404 ? 'Picture not found' : 'Picture could not be loaded. Please retry.' });
   return;
  }
  res.status(200)
   .set('Content-Type', result.mime)
   .set('Cache-Control', 'private, no-store')
   .set('X-Content-Type-Options', 'nosniff')
   .send(result.bytes);
 });
 router.post('/', async (req, res) => {
  try {
   const chunks: Buffer[] = []; let size = 0;
   for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_AVATAR_BYTES + 65536) {
     res.status(400).json({ success: false, code: 'UNSUPPORTED_FILE', message: 'Picture exceeds 10 MB.' }); return;
    }
    chunks.push(Buffer.from(chunk));
   }
   const contentType = req.headers['content-type'] ?? '';
   if (!contentType.startsWith('multipart/form-data;')) throw new Error('Expected multipart');
   const request = new Request('http://localhost/avatar', { method: 'POST', headers: { 'Content-Type': contentType }, body: Buffer.concat(chunks) });
   const form = await request.formData();
   const entries = [...form.entries()];
   if (entries.length !== 1 || entries[0][0] !== 'avatar' || typeof entries[0][1] === 'string') throw new Error('One avatar file is required');
   const result = await service.upload(res.locals.user.sub, Buffer.from(await entries[0][1].arrayBuffer()));
   res.status(result.status).json(result.body);
  } catch { res.status(400).json({ success: false, code: 'UNSUPPORTED_FILE', message: 'Choose one valid JPG or PNG image up to 10 MB.' }); }
 });
 router.delete('/', async (req, res) => {
  if (req.headers['transfer-encoding'] || Number(req.headers['content-length'] ?? 0) > 0) { res.status(400).json({ success: false, message: 'No request body is accepted' }); return; }
  const result = await service.remove(res.locals.user.sub);
  res.status(result.status).json(result.body);
 });
 return router;
}
