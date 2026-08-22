import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';

/**
 * Mirrors every catalog image into Cloudinary and rewrites images.json to point
 * at our own CDN.
 *
 * Why not serve the Wikimedia URLs directly:
 *   - upload.wikimedia.org rate-limits per IP and returns 429 under load, which
 *     would show up as missing photos at exactly the wrong moment;
 *   - hotlinking someone else's CDN at volume is impolite and against their
 *     policy for anything beyond light use;
 *   - Cloudinary re-encodes to WebP/AVIF per browser, so cards load faster.
 *
 * Cloudinary fetches each source URL from its own servers, so this works even
 * while the local machine is being throttled.
 *
 *   npm run seed:images        # resolve source URLs from Wikipedia
 *   npm run seed:images:mirror # copy them into Cloudinary   <- this file
 *   npm run seed               # write them to the database
 */

const here = dirname(fileURLToPath(import.meta.url));

/** Deterministic id per source file, so re-running overwrites in place. */
const idFor = (url) => createHash('sha1').update(url).digest('hex').slice(0, 20);

const run = async () => {
  if (!env.cloudinary.isConfigured) {
    console.error('[mirror] Cloudinary is not configured — add your keys to backend/.env');
    process.exitCode = 1;
    return;
  }

  const file = join(here, 'images.json');
  const images = JSON.parse(await readFile(file, 'utf8'));

  // The same photo backs several activities (city fallbacks), so upload uniques.
  const sources = [...new Set([
    ...Object.values(images.cities),
    ...Object.values(images.activities),
  ])]
    .filter(Boolean)
    // Already mirrored on a previous run — re-uploading would just make a
    // second copy under a different id.
    .filter((url) => !url.includes('res.cloudinary.com'));

  console.log(`[mirror] ${sources.length} unique images → Cloudinary`);

  const mapping = new Map();
  let uploaded = 0;
  let failed = 0;

  // Wikimedia throttles bursts, and it throttles Cloudinary's fetchers too, so
  // pace the uploads rather than firing all of them at once.
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  for (const [index, source] of sources.entries()) {
    if (index) await sleep(400);
    const publicId = `${env.cloudinary.folder}/catalog/${idFor(source)}`;

    try {
      const result = await cloudinary.uploader.upload(source, {
        public_id: publicId,
        overwrite: false,
        // Skips the re-download when the asset is already there.
        invalidate: false,
        resource_type: 'image',
        transformation: [
          { width: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      mapping.set(source, result.secure_url);
      uploaded += 1;
      process.stdout.write(`\r  ${index + 1}/${sources.length} uploaded`);
    } catch (error) {
      failed += 1;
      // Keep the original URL rather than dropping the image entirely.
      mapping.set(source, source);
      console.warn(`\n  ! ${error.message?.slice(0, 90)}`);
    }
  }

  for (const bucket of ['cities', 'activities']) {
    for (const [key, url] of Object.entries(images[bucket])) {
      if (url && mapping.has(url)) images[bucket][key] = mapping.get(url);
    }
  }

  await writeFile(file, `${JSON.stringify(images, null, 2)}\n`, 'utf8');

  console.log(`\n[mirror] ${uploaded} uploaded, ${failed} kept as source URLs`);
  console.log('[mirror] images.json rewritten — run npm run seed to apply');
};

run().catch((error) => {
  console.error('[mirror] failed:', error.message);
  process.exitCode = 1;
});
