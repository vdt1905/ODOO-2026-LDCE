/** Two-letter fallback shown when a user has no photo. */
export const initialsOf = (user) =>
  `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'GT';
