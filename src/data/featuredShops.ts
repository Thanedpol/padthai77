/**
 * ร้านแนะนำ (featured / sponsored shops)
 *
 * Shops listed here are pinned to the top of their province's list, get a
 * "ร้านแนะนำ" badge on the card and a highlighted pin on the map.
 *
 * Only Google place IDs are stored here (allowed by the Google Maps Platform
 * terms); name, rating, photos etc. are always loaded live from Google.
 *
 * How to add a paying shop:
 *   1. Open the site with ?sales=1, find the shop, click it.
 *   2. Press "คัดลอกลิงก์ตัวอย่าง" — the copied link contains the placeId and
 *      provinceId to paste below.
 *   3. Add an entry, commit, push. The site redeploys automatically.
 */

export interface FeaturedShop {
  /** Google place ID, e.g. "ChIJ..." */
  placeId: string;
  /** Province id from thailandProvinces.ts, e.g. "bangkok" */
  provinceId: string;
  /** Optional one-line pitch shown on the card, e.g. "ผัดไทยกุ้งแม่น้ำ เตาถ่าน" */
  tagline?: string;
  /** Last day shown (YYYY-MM-DD, inclusive). Leave out for no end date. */
  until?: string;
}

export const FEATURED_SHOPS: FeaturedShop[] = [
  // { placeId: 'ChIJ...', provinceId: 'bangkok', tagline: 'ผัดไทยกุ้งแม่น้ำ เตาถ่าน', until: '2026-12-31' },
];

/** Max featured shops pinned above the normal results in one province. */
export const FEATURED_SLOTS_PER_PROVINCE = 3;

/**
 * Where shop owners go to ask about becoming a featured shop, e.g. a LINE
 * Official Account link (https://lin.ee/xxxx) or a Google Form.
 * Leave empty to hide the "ลงโฆษณาร้านของคุณ" call-to-action.
 */
export const ADVERTISE_CONTACT_URL = '';

function isActive(shop: FeaturedShop, today: string): boolean {
  return !shop.until || shop.until >= today;
}

function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Sales preview read from the URL: ?preview=<placeId>&province=<provinceId>&tagline=... */
export interface FeaturedPreview {
  placeId: string;
  provinceId: string;
  tagline?: string;
}

export function readFeaturedPreviewFromUrl(): FeaturedPreview | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const placeId = params.get('preview')?.trim();
    const provinceId = params.get('province')?.trim();
    if (!placeId || !provinceId) return null;
    const tagline = params.get('tagline')?.trim() || undefined;
    return { placeId, provinceId, tagline };
  } catch {
    return null;
  }
}

export function readSalesModeFromUrl(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('sales') === '1';
  } catch {
    return false;
  }
}

export function readProvinceIdFromUrl(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('province')?.trim() || null;
  } catch {
    return null;
  }
}

export function buildFeaturedPreviewUrl(placeId: string, provinceId: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('province', provinceId);
  url.searchParams.set('preview', placeId);
  return url.toString();
}

/**
 * Featured shops for one province (config + an optional sales preview), in
 * display order, capped at FEATURED_SLOTS_PER_PROVINCE.
 */
export function getFeaturedForProvince(
  provinceId: string,
  preview: FeaturedPreview | null
): FeaturedShop[] {
  const today = todayIso();
  const list: FeaturedShop[] = [];
  if (preview && preview.provinceId === provinceId) {
    list.push({ placeId: preview.placeId, provinceId, tagline: preview.tagline });
  }
  for (const shop of FEATURED_SHOPS) {
    if (shop.provinceId !== provinceId || !isActive(shop, today)) continue;
    if (list.some((s) => s.placeId === shop.placeId)) continue;
    list.push(shop);
  }
  return list.slice(0, FEATURED_SLOTS_PER_PROVINCE);
}
