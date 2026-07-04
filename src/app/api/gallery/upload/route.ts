import { getSession } from '@/lib/session';
import { isGalleryOpenNow } from '@/lib/gallery-override';
import { adminSupabase } from '@/lib/supabase/admin';
import sharp from 'sharp';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
const MAX_SIZE = 10 * 1024 * 1024;

const uploadLog = new Map<string, number[]>();

function getMimeFromMagic(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = buf.slice(8, 12).toString('ascii');
    const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1'];
    if (heicBrands.includes(brand)) return 'image/heic';
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.access) {
    return Response.json({ error: 'Unauthenticated.' }, { status: 401 });
  }
  if (!(await isGalleryOpenNow()) && !session.isAdmin) {
    return Response.json({ error: 'Gallery is not open yet.' }, { status: 403 });
  }

  const key = session.guestName;
  const now = Date.now();
  const recent = (uploadLog.get(key) ?? []).filter(t => now - t < 60_000);
  if (recent.length >= 5) {
    return Response.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 });
  }
  uploadLog.set(key, [...recent, now]);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) return Response.json({ error: 'No file provided.' }, { status: 400 });
  if (file.size > MAX_SIZE) return Response.json({ error: 'File exceeds 10 MB limit.' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = getMimeFromMagic(buffer);
  if (!mime || !ALLOWED_MIME.has(mime)) {
    return Response.json({ error: 'Invalid file type. Only JPEG, PNG, WebP, and HEIC are allowed.' }, { status: 400 });
  }

  const photoId = randomUUID();
  let thumbnail: Buffer;
  let original: Buffer;

  try {
    [thumbnail, original] = await Promise.all([
      sharp(buffer)
        .rotate()
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75 })
        .toBuffer(),
      sharp(buffer)
        .rotate()
        .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer(),
    ]);
  } catch {
    return Response.json({ error: 'Failed to process image.' }, { status: 400 });
  }

  const thumbnailPath = `thumbnails/${photoId}`;
  const originalPath = `originals/${photoId}`;

  const [thumbResult, origResult] = await Promise.all([
    adminSupabase.storage.from('wedding-photos').upload(thumbnailPath, thumbnail, { contentType: 'image/jpeg' }),
    adminSupabase.storage.from('wedding-photos').upload(originalPath, original, { contentType: 'image/jpeg' }),
  ]);

  if (thumbResult.error || origResult.error) {
    return Response.json({ error: 'Failed to upload image.' }, { status: 500 });
  }

  const photoInsert = {
    id: photoId,
    storage_path: originalPath,
    thumbnail_path: thumbnailPath,
    uploaded_by: session.guestName,
    body: null,
  } as never;

  const { error: dbError } = await adminSupabase.from('photos').insert(photoInsert);

  if (dbError) {
    return Response.json({ error: 'Failed to save photo record.' }, { status: 500 });
  }

  return Response.json({ ok: true, photoId });
}
