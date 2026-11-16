export type RegionId =
  | 'central'
  | 'north'
  | 'northeast'
  | 'east'
  | 'west'
  | 'south';

export interface Province {
  id: string;
  nameTh: string;
  nameEn: string;
  region: RegionId;
  lat: number;
  lng: number;
}

export interface PlaceReview {
  authorName: string;
  authorUri: string | null;
  rating: number | null;
  text: string;
  relativeTime: string;
}

export interface PadThaiPlace {
  id: string;
  displayName: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  rating: number | null;
  userRatingCount: number | null;
  isOpen: boolean | null;
  openingHoursText: string[];
  photoUrl: string | null;
  googleMapsUri: string;
  priceLevel: string | null;
  provinceId: string;
  provinceNameTh: string;
  websiteUri?: string | null;
  phoneNumber?: string | null;
  editorialSummary?: string | null;
  hasDineIn?: boolean | null;
  hasTakeout?: boolean | null;
  hasDelivery?: boolean | null;
  reviews?: PlaceReview[];
  detailsLoaded?: boolean;
}

export interface FavoriteRef {
  placeId: string;
  provinceId: string;
  savedAt: number;
}

export type MapLayerType = 'hybrid' | 'terrain' | 'roadmap';

export type TravelModeOption = 'DRIVING' | 'WALKING' | 'TRANSIT';

export interface RouteStepItem {
  instruction: string;
  maneuver: string | null;
  distanceText: string;
  durationText: string;
}

export interface RouteSummary {
  placeId: string;
  travelMode: TravelModeOption;
  originLabel: string;
  originCoords: {
    lat: number;
    lng: number;
  };
  distanceText: string;
  durationText: string;
  steps: RouteStepItem[];
  encodedPolyline?: string;
  path?: Array<{ lat: number; lng: number }>;
}

export type AppView = 'map' | '3d' | 'favorites';

export type PriceFilterOption = 'all' | 'INEXPENSIVE' | 'MODERATE' | 'EXPENSIVE';

export type SortModeOption = 'relevance' | 'nearest' | 'popular';

export interface FilterState {
  minRating: 0 | 4 | 4.5;
  openNowOnly: boolean;
  searchKeyword: string;
}

