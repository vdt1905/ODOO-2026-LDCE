import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { connectDB, disconnectDB } from '../config/db.js';
import { Activity, City, User } from '../models/index.js';

const here = dirname(fileURLToPath(import.meta.url));

const readJson = async (file) => JSON.parse(await readFile(join(here, file), 'utf8'));

const seedCities = async () => {
  const cities = await readJson('cities.json');

  // Idempotent: re-running updates existing rows instead of duplicating them.
  await City.bulkWrite(
    cities.map((city) => ({
      updateOne: {
        filter: { name: city.name, country: city.country },
        update: { $set: city },
        upsert: true,
      },
    }))
  );

  console.log(`[seed] cities → ${cities.length} upserted`);
};

/**
 * The activity catalog. Without it, Activity Search, the builder's activity
 * drawer and the activities slice of every budget chart all render empty.
 *
 * Matched to cities by name + country rather than by id, so the file stays
 * readable and re-runnable.
 */
const seedActivities = async () => {
  const groups = await readJson('activities.json');

  const cities = await City.find().select('name country').lean();
  const cityId = new Map(
    cities.map((city) => [`${city.name.toLowerCase()}|${city.country.toLowerCase()}`, city._id])
  );

  const operations = [];
  const missing = [];

  for (const group of groups) {
    const id = cityId.get(`${group.city.toLowerCase()}|${group.country.toLowerCase()}`);
    if (!id) {
      missing.push(`${group.city}, ${group.country}`);
      continue;
    }

    for (const item of group.items) {
      operations.push({
        updateOne: {
          filter: { city: id, name: item.name },
          update: { $set: { ...item, city: id } },
          upsert: true,
        },
      });
    }
  }

  if (operations.length) await Activity.bulkWrite(operations);

  console.log(`[seed] activities → ${operations.length} upserted across ${groups.length} cities`);
  if (missing.length) {
    console.warn(`[seed] no matching city for: ${missing.join(' · ')} — activities skipped`);
  }
};

const seedUsers = async () => {
  const accounts = [
    {
      firstName: 'Admin',
      lastName: 'Trotter',
      email: 'admin@globetrotter.com',
      password: 'Admin@123',
      role: 'admin',
      city: 'Ahmedabad',
      country: 'India',
    },
    {
      firstName: 'Demo',
      lastName: 'Traveller',
      email: 'demo@globetrotter.com',
      password: 'Demo@1234',
      city: 'Ahmedabad',
      country: 'India',
      bio: 'Two trips a year, always over budget. Trying to fix that.',
    },
  ];

  for (const account of accounts) {
    // create() (not updateOne) so the pre-save hook hashes the password.
    if (await User.exists({ email: account.email })) {
      console.log(`[seed] user → ${account.email} already exists, skipped`);
      continue;
    }
    await User.create(account);
    console.log(`[seed] user → ${account.email} created`);
  }
};

const run = async () => {
  try {
    await connectDB();
    // Cities first — activities are matched to them by name + country.
    await seedCities();
    await seedActivities();
    await seedUsers();
    console.log('[seed] done');
  } catch (error) {
    console.error('[seed] failed:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

run();
