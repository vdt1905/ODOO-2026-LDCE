import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { connectDB, disconnectDB } from '../config/db.js';
import { City, User } from '../models/index.js';

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
    await seedCities();
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
