import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Resolves a real photo for every seeded city and activity and writes them to
 * images.json, which seed.js merges in.
 *
 * Source is the Wikipedia REST summary endpoint: no API key, no rate-limit
 * signup, and the files are Wikimedia Commons images (freely licensed) rather
 * than hotlinked stock photography.
 *
 * Kept as a separate one-off step so `npm run seed` stays offline and
 * deterministic — the network only matters when you refresh the images.
 *
 *   npm run seed:images
 */

const here = dirname(fileURLToPath(import.meta.url));

// Wikimedia's policy requires a descriptive User-Agent on API traffic.
const HEADERS = {
  accept: 'application/json',
  'user-agent': 'GlobeTrotter-Hackathon/1.0 (https://github.com/; educational project)',
};

const WIDTH = 900;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Titles the automatic lookup gets wrong — "New York" is a disambiguation page
 * for the state, and a few landmarks sit under a different article name.
 */
const OVERRIDES = {
  'New York': 'New York City',
  'Statue of Liberty and Ellis Island': 'Statue of Liberty',
  'High Line and Chelsea Market': 'High Line',
  'Old Dubai souks and abra crossing': 'Dubai Creek',
  'Bo-Kaap walk and Cape Malay cooking': 'Bo-Kaap',
};

/**
 * Uses the Action API's `pithumbsize` rather than the REST summary endpoint.
 *
 * The REST endpoint returns a fixed ~330px thumbnail, and upload.wikimedia.org
 * will NOT render other widths on demand — rewriting the width in that URL
 * yields a 400. Asking the Action API for the size renders it server-side and
 * returns a URL that actually resolves.
 */
const lookup = async (title) => {
  const url =
    'https://en.wikipedia.org/w/api.php' +
    '?action=query&format=json&origin=*' +
    '&prop=pageimages&piprop=thumbnail&redirects=1' +
    `&pithumbsize=${WIDTH}&titles=${encodeURIComponent(title)}`;

  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return '';

    const json = await res.json();
    const page = Object.values(json?.query?.pages || {})[0];
    if (!page || page.missing !== undefined) return '';

    // Strip the tracking query string Wikipedia appends.
    return (page.thumbnail?.source || '').split('?')[0];
  } catch {
    return '';
  }
};

/** Tries each candidate title in order and returns the first image found. */
const resolve = async (candidates) => {
  for (const raw of candidates) {
    if (!raw) continue;
    const title = OVERRIDES[raw] || raw;
    const url = await lookup(title);
    await sleep(120);
    if (url) return { url, matched: title };
  }
  return { url: '', matched: null };
};

/**
 * Activity names are written for humans ("Fushimi Inari at sunrise"), not as
 * article titles. Strip the descriptive tail so the lookup has a chance.
 */
const activityCandidates = (name, city) => {
  const cleaned = name
    .replace(/\s+(at|in|through|from|with|by)\s+.*$/i, '')
    .replace(/\s+(tour|walk|crawl|cruise|class|tasting|ride|hopping|browsing|afternoon|day|dinner|lunch|breakfast|show|market)$/i, '')
    .trim();

  return [name, cleaned !== name ? cleaned : null, cleaned ? `${cleaned}, ${city}` : null];
};

const run = async () => {
  const cities = JSON.parse(await readFile(join(here, 'cities.json'), 'utf8'));
  const groups = JSON.parse(await readFile(join(here, 'activities.json'), 'utf8'));

  const images = { cities: {}, activities: {} };
  let cityHits = 0;
  let activityHits = 0;
  let activityFallbacks = 0;
  let total = 0;

  console.log(`[images] resolving ${cities.length} cities…`);

  for (const city of cities) {
    const { url, matched } = await resolve([
      `${city.name}, ${city.country}`,
      city.name,
    ]);
    images.cities[`${city.name}|${city.country}`] = url;
    if (url) cityHits += 1;
    console.log(`  ${url ? '✓' : '·'} ${city.name.padEnd(18)} ${matched || 'no match'}`);
  }

  console.log(`\n[images] resolving activities…`);

  for (const group of groups) {
    const cityImage = images.cities[`${group.city}|${group.country}`] || '';

    for (const item of group.items) {
      total += 1;
      const { url } = await resolve(activityCandidates(item.name, group.city));

      // Falling back to the city photo beats an empty card.
      const finalUrl = url || cityImage;
      if (url) activityHits += 1;
      else if (cityImage) activityFallbacks += 1;

      images.activities[`${group.city}|${group.country}|${item.name}`] = finalUrl;
    }
    console.log(`  ${group.city} done`);
  }

  await writeFile(join(here, 'images.json'), `${JSON.stringify(images, null, 2)}\n`, 'utf8');

  console.log(`\n[images] cities     ${cityHits}/${cities.length} matched`);
  console.log(`[images] activities ${activityHits}/${total} matched exactly, ${activityFallbacks} using their city photo`);
  console.log(`[images] written to src/seed/images.json — run npm run seed to apply`);
};

run().catch((error) => {
  console.error('[images] failed:', error.message);
  process.exitCode = 1;
});
