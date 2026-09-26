import { Business, Category, Order, Product, PackageBatch } from '../types';

export const INITIAL_BUSINESSES: Business[] = [
  {
    id: 'biz-mira',
    slug: 'mira-fashion',
    name: 'Mira Fashion',
    tagline: 'Modern Ethiopian Haute Couture & Ready-to-Wear',
    description: 'Bespoke tailoring, artisanal Habesha Kemis reinterpretations, and contemporary evening collections crafted in Addis Ababa.',
    logo: 'MIRA',
    phone: '+251 91 123 4567',
    telegramUsername: 'mirafashion_orders',
    telegramChannel: 'https://t.me/mirafashion_orders',
    address: 'Bole Medhanialem, Edna Mall Tower 2nd Floor',
    city: 'Addis Ababa',
    businessHours: 'Mon - Sat: 9:00 AM - 8:00 PM | Sun: 11:00 AM - 5:00 PM',
    currency: 'ETB',
    deliveryFee: 150,
    freeDeliveryThreshold: 3000,
    bannerText: '✨ Welcome to Mira Fashion Storefront!',
    themeColor: '#78350F',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-dresses',
    businessId: 'biz-mira',
    name: 'Dresses & Gowns',
    slug: 'dresses',
    description: 'Evening gowns, modern dresses, and habesha kemis.',
    itemCount: 0,
  },
  {
    id: 'cat-tops',
    businessId: 'biz-mira',
    name: 'Tops & Blouses',
    slug: 'tops',
    description: 'Blouses, crop tops, silk camisoles, and shirts.',
    itemCount: 0,
  },
  {
    id: 'cat-bags',
    businessId: 'biz-mira',
    name: 'Bags & Clutches',
    slug: 'bags',
    description: 'Artisanal structured totes, evening clutches, and leather crossbodies.',
    itemCount: 0,
  },
  {
    id: 'cat-shoes',
    businessId: 'biz-mira',
    name: 'Footwear & Heels',
    slug: 'shoes',
    description: 'Handcrafted leather block heels, strap mules, and city flats.',
    itemCount: 0,
  },
  {
    id: 'cat-accessories',
    businessId: 'biz-mira',
    name: 'Shawls & Accessories',
    slug: 'accessories',
    description: 'Handwoven pure cotton netela, cashmere wraps, and jewelry.',
    itemCount: 0,
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_PACKAGE_BATCHES: PackageBatch[] = [];
