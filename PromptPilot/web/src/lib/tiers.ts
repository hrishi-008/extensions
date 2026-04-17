export type TierId = 'free' | 'byok' | 'byok_memory' | 'pro' | 'pro_memory';

export interface PricingTier {
  id: TierId;
  name: string;
  price: number;
  description: string;
  features: string[];
  limit: string;
  isMemory: boolean;
  isManaged: boolean;
  cta: string;
}

export const TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    description: 'Perfect for casual users testing the waters.',
    features: [
      'Standard Enhancement',
      'Community Support',
      'Basic Domain Detection'
    ],
    limit: '3 enhancements / day',
    isMemory: false,
    isManaged: false,
    cta: 'Start for Free'
  },
  {
    id: 'byok',
    name: 'BYOK Essential',
    price: 3,
    description: 'Use your own API keys for unlimited power.',
    features: [
      'Unlimited Enhancements',
      'Faster Processing',
      'All AI Providers supported'
    ],
    limit: 'Unlimited usage',
    isMemory: false,
    isManaged: false,
    cta: 'Upgrade to BYOK'
  },
  {
    id: 'byok_memory',
    name: 'BYOK Memory',
    price: 5,
    description: 'Personalized context with your own keys.',
    features: [
      'Unlimited Enhancements',
      'Sync Memory Features',
      'Cross-device Settings Sync'
    ],
    limit: 'Unlimited + Memory',
    isMemory: true,
    isManaged: false,
    cta: 'Unlock Memory'
  },
  {
    id: 'pro',
    name: 'Pro Pilot',
    price: 10,
    description: 'No keys needed. We provide the intelligence.',
    features: [
      'Unlimited Enhancements',
      'Managed API (No Keys Required)',
      'Priority Response Time'
    ],
    limit: 'Unlimited usage',
    isMemory: false,
    isManaged: true,
    cta: 'Fly Pro'
  },
  {
    id: 'pro_memory',
    name: 'Pro Memory',
    price: 13,
    description: 'The ultimate power-user experience.',
    features: [
      'Everything in Pro Pilot',
      'Full Memory Engine Access',
      'Advanced Personalization'
    ],
    limit: 'Unlimited + Memory',
    isMemory: true,
    isManaged: true,
    cta: 'Get Pro Memory'
  }
];
