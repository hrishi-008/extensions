export type Region = 'IN' | 'GLOBAL';

export async function detectRegion(): Promise<Region> {
  try {
    // In a real Vercel environment, this would use headers.
    // For now, we use a public IP geolocation API or a fallback.
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code === 'IN' ? 'IN' : 'GLOBAL';
  } catch (err) {
    console.error('[Geo] Detection failed, falling back to GLOBAL', err);
    return 'GLOBAL';
  }
}

export function getGateway(region: Region) {
  return region === 'IN' ? 'Razorpay' : 'Stripe';
}
