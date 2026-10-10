export const MINISTRY_GROUPS = ['teens', 'super_teens', 'adults'];

export const MINISTRY_LABELS = {
  teens: 'Teens',
  super_teens: 'Super Teens',
  adults: 'Adults',
};

/**
 * Returns a new groups array with the ministry group changed,
 * preserving any department memberships.
 */
export function changeMinistryGroup(currentGroups, newMinistryGroup) {
  const departments = (currentGroups || []).filter(
    (g) => !MINISTRY_GROUPS.includes(g)
  );
  return [...departments, newMinistryGroup];
}

/**
 * Returns the current ministry group of a user (or 'adults' if none).
 */
export function getMinistryGroup(profile) {
  const groups = profile?.groups || [];
  if (groups.includes('teens')) return 'teens';
  if (groups.includes('super_teens')) return 'super_teens';
  return 'adults';
}