import { customAlphabet } from 'nanoid';

// Unambiguous alphabet — no 0/O or 1/l/I, so a slug read aloud or copied by
// hand still resolves. 12 chars keeps public URLs unguessable.
const alphabet = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

export const publicSlug = customAlphabet(alphabet, 12);
