export const GROUP_MAP = {
  teens: 'teens',
  super_teens: 'super_teens',
  adults: 'adults',
};

export const GROUP_LABELS = {
  teens: 'Teens',
  super_teens: 'Super Teens',
  adults: 'Adults',
};

/**
 * Returns the user's primary ministry group (for sermon content).
 * Falls back to 'adults' if none found.
 */
export function getUserGroup(profile) {
  if (!profile?.groups || profile.groups.length === 0) return 'adults';

  // Priority: teens > super_teens > adults (teens should not see adult content)
  if (profile.groups.includes('teens')) return 'teens';
  if (profile.groups.includes('super_teens')) return 'super_teens';
  if (profile.groups.includes('adults')) return 'adults';

  return 'adults';
}