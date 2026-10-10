/**
 * Turns raw Supabase / network errors into human-friendly messages.
 */
export function friendlyError(error) {
  if (!error) return 'Something went wrong. Please try again.';

  const msg = (error.message || String(error)).toLowerCase();

  // RLS / permission errors
  if (msg.includes('row-level security') || msg.includes('violates row-level')) {
    return 'You do not have permission to do this. Please contact your church admin.';
  }

  // Not authenticated
  if (msg.includes('not authenticated') || msg.includes('jwt')) {
    return 'Your session has expired. Please sign in again.';
  }

  // Duplicate
  if (msg.includes('duplicate') || msg.includes('unique constraint')) {
    return 'This already exists. Try something different.';
  }

  // Network
  if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed')) {
    return 'Network error. Please check your internet connection.';
  }

  // Auth errors
  if (msg.includes('invalid login credentials')) return 'Wrong phone number or password.';
  if (msg.includes('user not found')) return 'No account found with this phone number.';
  if (msg.includes('phone number format')) return 'Please enter a valid phone number.';
  if (msg.includes('email not confirmed')) return 'Your account is not verified yet.';
  if (msg.includes('token has expired') || msg.includes('invalid token')) return 'The code is incorrect or has expired.';
  if (msg.includes('user already registered')) return 'This phone number is already registered. Try signing in.';
  if (msg.includes('password should be')) return 'Password is too weak. Use at least 6 characters.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.';

  // Fallback — trim to keep it readable
  const trimmed = error.message || 'Something went wrong. Please try again.';
  return trimmed.length > 120 ? trimmed.slice(0, 120) + '…' : trimmed;
}