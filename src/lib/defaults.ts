import { HostingPlan, SiteSettings, SubscriptionDiscount } from '../types/hostnova';

export const BRAND_LOGO_URL = '/assets/aistudio/HostNova_Cloud_Technology_Logo_2a69c7f4.png';

export const VISUAL_ASSETS = {
  heroDatacenter: '/src/assets/images/hero_datacenter_servers_1795307467669.jpg',
  serverRack: '/src/assets/images/cloud_infrastructure_rack_1795307469171.jpg',
  globalOperations: '/src/assets/images/global_network_operations_1795307473975.jpg',
} as const;

export const BOOTSTRAP_ADMIN_EMAIL = 'packbaribd@gmail.com';

export const DEFAULT_HOSTING_PLANS: HostingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Reliable SSD hosting built for personal projects and developer portfolios.',
    monthlyPrice: 15,
    storageGb: 10,
    websiteLimit: 1,
    features: [
      '10 GB SSD Storage',
      '1 Website',
      'Free SSL Certificate',
      'GitHub Support',
      'Standard Support',
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Balanced performance and headroom for businesses and production web apps.',
    monthlyPrice: 25,
    storageGb: 50,
    websiteLimit: 2,
    features: [
      '50 GB SSD Storage',
      '2 Websites',
      'Free SSL Certificate',
      'GitHub Integration Support',
      'Priority Support',
    ],
    isPopular: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'High-capacity SSD allocation engineered for agencies and multi-site brands.',
    monthlyPrice: 45,
    storageGb: 100,
    websiteLimit: 10,
    features: [
      '100 GB SSD Storage',
      '10 Websites',
      'Free SSL Certificate',
      'GitHub Integration Support',
      'Premium Support',
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 3,
  },
];

export const DEFAULT_DISCOUNTS: SubscriptionDiscount[] = [
  { id: 'dur_1m', durationMonths: 1, label: '1 Month', discountPercentage: 0, isActive: true },
  { id: 'dur_3m', durationMonths: 3, label: '3 Months', discountPercentage: 3, isActive: true },
  { id: 'dur_6m', durationMonths: 6, label: '6 Months', discountPercentage: 7, isActive: true },
  { id: 'dur_12m', durationMonths: 12, label: '12 Months', discountPercentage: 15, isActive: true },
  { id: 'dur_24m', durationMonths: 24, label: '24 Months', discountPercentage: 25, isActive: true },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'main',
  companyName: 'HostNova',
  tagline: 'Powering Your Digital World.',
  companyEmail: 'support@hostnova.com',
  companyPhone: '+1 (555) 234-8920',
  companyAddress: '100 Cloudway Plaza, Suite 400, Austin, TX 78701',
  logoUrl: BRAND_LOGO_URL,
  currency: 'USD',
};
