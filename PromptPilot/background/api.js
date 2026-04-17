/**
 * PromptPilot Supabase API Wrapper
 * Handles authentication checks, tier verification, and usage syncing.
 */

const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';

export async function getAuthSession() {
  const { session } = await chrome.storage.local.get('pp_session');
  return session || null;
}

export async function fetchProfile() {
  const session = await getAuthSession();
  if (!session) return { tier: 'free', usage_count: 0 };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const profiles = await response.json();
    return profiles[0] || { tier: 'free', usage_count: 0 };
  } catch (err) {
    console.error('[PromptPilot] Failed to fetch profile:', err);
    return { tier: 'free', usage_count: 0 };
  }
}

export async function syncUsage(count) {
  const session = await getAuthSession();
  if (!session) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        usage_count: count,
        last_usage_reset: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error('[PromptPilot] Failed to sync usage:', err);
  }
}

export async function syncSettings(settings) {
  const session = await getAuthSession();
  if (!session) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/settings?user_id=eq.${session.user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(settings)
    });
  } catch (err) {
    console.error('[PromptPilot] Failed to sync settings:', err);
  }
}
