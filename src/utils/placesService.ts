import type {
  PadThaiPlace,
  PlaceReview,
  PriceFilterOption,
  Province,
  RouteStepItem,
  RouteSummary,
  TravelModeOption,
} from '../types/padthai';

declare const __GOOGLE_MAPS_API_KEY__: string;

export function getGoogleMapsApiKey(): string {
  const fromVite = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const fromGlobal = (globalThis as Record<string, unknown>).GOOGLE_MAPS_API_KEY as string | undefined;
  const fromDefine = typeof __GOOGLE_MAPS_API_KEY__ !== 'undefined' ? __GOOGLE_MAPS_API_KEY__ : '';
  return fromVite || fromGlobal || fromDefine || '';
}

export const FALLBACK_FOOD_IMAGES = [
  `${import.meta.env.BASE_URL}src/assets/images/padthai_classic_shrimp_1794811637414.jpg`,
  `${import.meta.env.BASE_URL}src/assets/images/padthai_street_wok_1794811638753.jpg`,
];

function checkAndNotifyQuotaError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const status = (err as { status?: number | string })?.status;
  if (
    status === 429 ||
    status === 'OVER_QUERY_LIMIT' ||
    status === 'RESOURCE_EXHAUSTED' ||
    raw.includes('OVER_QUERY_LIMIT') ||
    raw.includes('RESOURCE_EXHAUSTED') ||
    raw.includes('QuotaExceeded') ||
    raw.includes('OverQuota') ||
    raw.includes('429')
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return true;
  }
  return false;
}

function formatPriceLevel(level: unknown): string | null {
  if (!level) return null;
  const val = String(level);
  switch (val) {
    case 'INEXPENSIVE':
    case 'PRICE_LEVEL_INEXPENSIVE':
    case 'Inexpensive':
      return '฿';
    case 'MODERATE':
    case 'PRICE_LEVEL_MODERATE':
    case 'Moderate':
      return '฿฿';
    case 'EXPENSIVE':
    case 'PRICE_LEVEL_EXPENSIVE':
    case 'Expensive':
      return '฿฿฿';
    case 'VERY_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
    case 'Very Expensive':
      return '฿฿฿฿';
    default:
      return null;
  }
}

function formatDistanceFallback(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} กม.` : `${Math.round(meters)} ม.`;
}

function formatDurationFallback(millis: number): string {
  if (!Number.isFinite(millis) || millis <= 0) return '';
  const mins = Math.max(1, Math.round(millis / 60000));
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs} ชม. ${rem} นาที` : `${hrs} ชม.`;
  }
  return `${mins} นาที`;
}

async function mapPlaceResult(
  place: google.maps.places.Place,
  province: Province
): Promise<PadThaiPlace | null> {
  if (!place.location || !place.id) return null;

  const lat =
    typeof place.location.lat === 'function'
      ? place.location.lat()
      : (place.location as unknown as { lat: number }).lat;
  const lng =
    typeof place.location.lng === 'function'
      ? place.location.lng()
      : (place.location as unknown as { lng: number }).lng;

  let isOpen: boolean | null = null;
  try {
    if (typeof place.isOpen === 'function') {
      const openVal = await place.isOpen();
      isOpen = typeof openVal === 'boolean' ? openVal : null;
    }
  } catch {
    isOpen = null;
  }

  let photoUrl: string | null = null;
  try {
    if (place.photos && place.photos.length > 0) {
      photoUrl = place.photos[0].getURI({ maxWidth: 720 });
    }
  } catch {
    photoUrl = null;
  }

  const displayName = place.displayName || 'ร้านผัดไทย';
  const mapsUri =
    place.googleMapsURI ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayName)}&query_place_id=${encodeURIComponent(place.id)}`;

  return {
    id: place.id,
    displayName,
    formattedAddress: place.formattedAddress || province.nameTh,
    location: { lat, lng },
    rating: typeof place.rating === 'number' ? place.rating : null,
    userRatingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    isOpen,
    openingHoursText: place.regularOpeningHours?.weekdayDescriptions ?? [],
    photoUrl,
    googleMapsUri: mapsUri,
    priceLevel: formatPriceLevel(place.priceLevel),
    provinceId: province.id,
    provinceNameTh: province.nameTh,
  };
}

const PLACE_SEARCH_FIELDS = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'utcOffsetMinutes',
  'photos',
  'googleMapsURI',
  'priceLevel',
];

const PLACE_DETAIL_FIELDS = [
  'websiteURI',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'editorialSummary',
  'reviews',
  'regularOpeningHours',
  'googleMapsURI',
  'hasDineIn',
  'hasTakeout',
  'hasDelivery',
];

export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface SearchPadThaiOptions {
  detailedQuery?: string;
  priceFilter?: PriceFilterOption;
  rankByDistance?: boolean;
  biasCenter?: { lat: number; lng: number };
}

export async function searchPadThaiByProvince(
  placesLib: google.maps.PlacesLibrary,
  province: Province,
  queryOrOptions?: string | SearchPadThaiOptions
): Promise<PadThaiPlace[]> {
  try {
    const opts: SearchPadThaiOptions =
      typeof queryOrOptions === 'string'
        ? { detailedQuery: queryOrOptions }
        : (queryOrOptions ?? {});

    const trimmed = opts.detailedQuery?.trim() ?? '';
    let textQuery = `ผัดไทย ${province.nameTh}`;
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      const hasPadThai =
        trimmed.includes('ผัดไทย') ||
        trimmed.includes('ผัดไท') ||
        lower.includes('pad thai');
      const hasProvince =
        trimmed.includes(province.nameTh) ||
        lower.includes(province.nameEn.toLowerCase());
      textQuery = `${hasPadThai ? '' : 'ผัดไทย '}${trimmed}${hasProvince ? '' : ` ${province.nameTh}`}`.trim();
    }

    let priceLevels: google.maps.places.PriceLevelString[] | undefined;
    if (opts.priceFilter === 'INEXPENSIVE') {
      priceLevels = ['INEXPENSIVE'];
    } else if (opts.priceFilter === 'MODERATE') {
      priceLevels = ['MODERATE'];
    } else if (opts.priceFilter === 'EXPENSIVE') {
      priceLevels = ['EXPENSIVE', 'VERY_EXPENSIVE'];
    }

    const center = opts.biasCenter ?? { lat: province.lat, lng: province.lng };

    const request: google.maps.places.SearchByTextRequest = {
      textQuery,
      fields: PLACE_SEARCH_FIELDS,
      locationBias: {
        center,
        radius: 30000,
      },
      ...(priceLevels ? { priceLevels } : {}),
      ...(opts.rankByDistance ? { rankPreference: 'DISTANCE' as const } : {}),
      maxResultCount: 20,
      language: 'th',
      region: 'TH',
    };

    const { places } = await placesLib.Place.searchByText(request);
    if (!places || places.length === 0) {
      return [];
    }

    const mapped = await Promise.all(places.map((p) => mapPlaceResult(p, province)));
    return mapped.filter((p): p is PadThaiPlace => p !== null);
  } catch (err) {
    checkAndNotifyQuotaError(err);
    throw err;
  }
}

export async function fetchPlaceRichDetails(
  placesLib: google.maps.PlacesLibrary,
  existing: PadThaiPlace
): Promise<PadThaiPlace> {
  try {
    const place = new placesLib.Place({
      id: existing.id,
      requestedLanguage: 'th',
      requestedRegion: 'TH',
    });

    await place.fetchFields({
      fields: PLACE_DETAIL_FIELDS,
    });

    const reviews: PlaceReview[] = (place.reviews ?? [])
      .map((rev): PlaceReview | null => {
        const text = (rev.text || rev.originalText || '').trim();
        if (!text && typeof rev.rating !== 'number') return null;
        return {
          authorName: rev.authorAttribution?.displayName || 'ผู้ใช้งาน Google Maps',
          authorUri: rev.authorAttribution?.uri || null,
          rating: typeof rev.rating === 'number' ? rev.rating : null,
          text,
          relativeTime: rev.relativePublishTimeDescription || '',
        };
      })
      .filter((r): r is PlaceReview => r !== null)
      .slice(0, 4);

    return {
      ...existing,
      googleMapsUri: place.googleMapsURI || existing.googleMapsUri,
      openingHoursText:
        place.regularOpeningHours?.weekdayDescriptions &&
        place.regularOpeningHours.weekdayDescriptions.length > 0
          ? place.regularOpeningHours.weekdayDescriptions
          : existing.openingHoursText,
      websiteUri: place.websiteURI || null,
      phoneNumber: place.nationalPhoneNumber || place.internationalPhoneNumber || null,
      editorialSummary: place.editorialSummary || null,
      hasDineIn: typeof place.hasDineIn === 'boolean' ? place.hasDineIn : null,
      hasTakeout: typeof place.hasTakeout === 'boolean' ? place.hasTakeout : null,
      hasDelivery: typeof place.hasDelivery === 'boolean' ? place.hasDelivery : null,
      reviews,
      detailsLoaded: true,
    };
  } catch (err) {
    checkAndNotifyQuotaError(err);
    return {
      ...existing,
      detailsLoaded: true,
    };
  }
}

export async function fetchPlaceById(
  placesLib: google.maps.PlacesLibrary,
  placeId: string,
  province: Province
): Promise<PadThaiPlace | null> {
  try {
    const place = new placesLib.Place({
      id: placeId,
      requestedLanguage: 'th',
      requestedRegion: 'TH',
    });
    await place.fetchFields({
      fields: PLACE_SEARCH_FIELDS,
    });
    return await mapPlaceResult(place, province);
  } catch (err) {
    checkAndNotifyQuotaError(err);
    return null;
  }
}

export async function computeInAppRoute(
  routesLib: google.maps.RoutesLibrary,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  placeId: string,
  travelMode: TravelModeOption = 'DRIVING',
  originLabel = 'ตำแหน่งของคุณ'
): Promise<RouteSummary | null> {
  try {
    const request: google.maps.routes.ComputeRoutesRequest = {
      origin,
      destination,
      travelMode,
      language: 'th',
      region: 'TH',
      ...(travelMode === 'DRIVING' ? { routingPreference: 'TRAFFIC_AWARE' as const } : {}),
      fields: ['path', 'distanceMeters', 'durationMillis', 'localizedValues', 'legs'],
    };

    const { routes } = await routesLib.Route.computeRoutes(request);
    const route = routes?.[0];
    if (!route) return null;

    const localized = route.localizedValues;
    const distanceMeters = typeof route.distanceMeters === 'number' ? route.distanceMeters : 0;
    const durationMillis = typeof route.durationMillis === 'number' ? route.durationMillis : 0;

    const distanceText = localized?.distance || formatDistanceFallback(distanceMeters) || '-';
    const durationText = localized?.duration || formatDurationFallback(durationMillis) || '-';

    let path: Array<{ lat: number; lng: number }> | undefined;
    if (Array.isArray(route.path)) {
      path = route.path.map((pt) => ({
        lat: pt.lat,
        lng: pt.lng,
      }));
    }

    const steps: RouteStepItem[] = [];
    const primaryLeg = route.legs?.[0];
    if (primaryLeg && Array.isArray(primaryLeg.steps)) {
      for (const step of primaryLeg.steps) {
        let instruction = (step.instructions || '').trim();
        if (!instruction && step.transitDetails) {
          const lineName =
            step.transitDetails.transitLine?.shortName ||
            step.transitDetails.transitLine?.name ||
            'รถโดยสารสาธารณะ';
          const stopName = step.transitDetails.arrivalStop?.name;
          instruction = stopName
            ? `ขึ้น ${lineName} ไปยัง ${stopName}`
            : `เดินทางด้วย ${lineName}`;
        }
        if (!instruction) {
          instruction = 'เดินทางตามเส้นทาง';
        }
        const stepDist =
          step.localizedValues?.distance || formatDistanceFallback(step.distanceMeters);
        const stepDur =
          step.localizedValues?.staticDuration ||
          formatDurationFallback(step.staticDurationMillis ?? 0);
        steps.push({
          instruction,
          maneuver: step.maneuver ?? null,
          distanceText: stepDist,
          durationText: stepDur,
        });
      }
    }

    return {
      placeId,
      travelMode,
      originLabel,
      originCoords: origin,
      distanceText,
      durationText,
      steps,
      path,
    };
  } catch (err) {
    checkAndNotifyQuotaError(err);
    return null;
  }
}
