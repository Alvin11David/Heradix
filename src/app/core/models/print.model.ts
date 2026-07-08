export type PrintCategoryId =
  | 'business-cards'
  | 'brochures'
  | 'flyers'
  | 'stickers'
  | 'banners'
  | 'packaging'
  | 'postcards'
  | 'notepads'
  | 'apparel'
  | 'promotional';

export interface PrintCategory {
  id: PrintCategoryId;
  label: string;
  icon: string;
  description: string;
}

export type PaperFinish = 'GLOSSY' | 'MATTE' | 'SATIN' | 'UNCOATED' | 'KRAFT';
export type Lamination  = 'NONE' | 'GLOSS' | 'MATTE' | 'SOFT_TOUCH' | 'SPOT_UV';
export type PrintSide   = 'FRONT_ONLY' | 'FRONT_AND_BACK';

export interface PaperProductOptions {
  kind: 'paper';
  sizes: { label: string; width: string; height: string }[];
  paperTypes: { label: string; pt: number }[];
  laminations: Lamination[];
  printSides: PrintSide[];
  roundedCorners: boolean;
  bleedMm: number;
  quantities: number[];
  leadTimes: { label: string; businessDays: number; priceMod: number }[];
  basePriceMap: Record<number, number>;
}

export type ShirtSize    = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
export type SleeveType   = 'SHORT' | 'LONG' | 'SLEEVELESS';
export type ApparelColor = { name: string; hex: string };

export interface ApparelProductOptions {
  kind: 'apparel';
  sizes: ShirtSize[];
  sleeveTypes: SleeveType[];
  colors: ApparelColor[];
  brands: string[];
  materials: string[];
  printAreas: string[];
  quantities: number[];
  basePriceMap: Record<string, number>;
}

export interface PrintProduct {
  id: string;
  categoryId: PrintCategoryId;
  name: string;
  tagline: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  fromPrice: number;
  currency: string;
  isPremium: boolean;
  features: string[];
  options: PaperProductOptions | ApparelProductOptions;
}

export interface PrintSpec {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  finish: 'MATTE' | 'GLOSSY' | 'SATIN';
  minQuantity: number;
  pricePerUnit: number;
  currency: string;
}

export type PrintOrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SENT_TO_PRINTER'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface PrintOrder {
  id: string;
  userId: string;
  assetId: string;
  printSpecId: string;
  printSpec?: PrintSpec;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: PrintOrderStatus;
  trackingNumber?: string;
  shippingAddress: ShippingAddress;
  paymentProvider: 'stripe' | 'paypal' | 'mtn' | 'airtel';
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode?: string;
  phone: string;
}

export interface CreatePrintOrderPayload {
  assetId: string;
  printSpecId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  paymentProvider: 'stripe' | 'paypal' | 'mtn' | 'airtel';
  phoneNumber?: string;
}
