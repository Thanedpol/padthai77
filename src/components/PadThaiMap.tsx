import { useCallback, useEffect, useState } from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useMap,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Maximize2, Minimize2, Navigation, Star } from 'lucide-react';
import type { PadThaiPlace, Province, RouteSummary } from '../types/padthai';
import { FALLBACK_FOOD_IMAGES } from '../utils/placesService';

interface PadThaiMapProps {
  selectedProvince: Province;
  places: PadThaiPlace[];
  /** Place ids of featured shops (ร้านแนะนำ); their pins are highlighted. */
  featuredIds?: Record<string, unknown>;
  selectedPlace: PadThaiPlace | null;
  userLocation: { lat: number; lng: number } | null;
  activeRoute: RouteSummary | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSelectPlace: (place: PadThaiPlace | null) => void;
  onComputeRoute: (place: PadThaiPlace) => void;
}

interface PlacePinMarkerProps {
  place: PadThaiPlace;
  index: number;
  isSelected: boolean;
  isFeatured?: boolean;
  onSelect: (place: PadThaiPlace) => void;
  onCloseInfo: () => void;
  onComputeRoute: (place: PadThaiPlace) => void;
}

function PlacePinMarker({
  place,
  index,
  isSelected,
  isFeatured = false,
  onSelect,
  onCloseInfo,
  onComputeRoute,
}: PlacePinMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [imgError, setImgError] = useState(false);

  const fallbackImg = FALLBACK_FOOD_IMAGES[index % FALLBACK_FOOD_IMAGES.length];
  const imgSrc = !imgError && place.photoUrl ? place.photoUrl : fallbackImg;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        zIndex={
          isSelected ? 50 : isFeatured ? 45 : 10 + Math.round((place.rating ?? 3) * 10)
        }
        title={`${isFeatured ? 'ร้านแนะนำ · ' : ''}${place.displayName}${place.rating !== null ? ` ★ ${place.rating.toFixed(1)}` : ''}`}
        onClick={() => onSelect(place)}
      >
        <div className="flex flex-col items-center cursor-pointer group">
          <div
            className={`px-2.5 py-1 rounded-lg border shadow-md flex items-center gap-1.5 transition-transform duration-150 ${
              isSelected
                ? 'bg-neutral-950 text-white border-neutral-950 scale-105 shadow-xl'
                : isFeatured
                  ? 'bg-amber-400 text-neutral-950 border-amber-600 shadow-lg group-hover:scale-[1.03]'
                  : 'bg-white text-neutral-950 border-neutral-300 group-hover:border-neutral-950 group-hover:scale-[1.03]'
            }`}
          >
            {isFeatured && (
              <span className="text-[9px] font-bold uppercase leading-none shrink-0">แนะนำ</span>
            )}
            <span className="max-w-[128px] truncate text-[11px] font-semibold leading-none">
              {place.displayName}
            </span>
            {place.rating !== null && (
              <span
                className={`inline-flex items-center gap-0.5 text-[11px] font-bold tabular-nums leading-none shrink-0 ${
                  isSelected ? 'text-amber-400' : 'text-neutral-950'
                }`}
              >
                <span className="text-amber-600" aria-hidden="true">
                  ★
                </span>
                {place.rating.toFixed(1)}
              </span>
            )}
          </div>
          <div
            className={`w-2 h-2 rotate-45 -mt-1 border-r border-b ${
              isSelected
                ? 'bg-neutral-950 border-neutral-950'
                : isFeatured
                  ? 'bg-amber-400 border-amber-600'
                  : 'bg-white border-neutral-300 group-hover:border-neutral-950'
            }`}
          />
        </div>
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={280} onCloseClick={onCloseInfo}>
          <div className="p-1 text-neutral-950 font-sans">
            <div className="w-full h-28 rounded-lg overflow-hidden bg-neutral-100 mb-2">
              <img
                src={imgSrc}
                alt={place.displayName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="font-semibold text-sm leading-snug text-neutral-950">
              {place.displayName}
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-600 tabular-nums">
              {place.rating !== null ? (
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-950">
                  <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" aria-hidden="true" />
                  <span>{place.rating.toFixed(1)}</span>
                  {place.userRatingCount !== null && (
                    <span className="font-normal text-neutral-500">
                      ({place.userRatingCount.toLocaleString()})
                    </span>
                  )}
                </span>
              ) : (
                <span>ยังไม่มีคะแนน</span>
              )}
              {place.isOpen !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{place.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}</span>
                </>
              )}
            </div>

            <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">
              {place.formattedAddress}
            </p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onComputeRoute(place)}
                className="flex-1 py-1.5 px-2.5 rounded-md bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1"
              >
                <Navigation className="w-3 h-3" aria-hidden="true" />
                <span>เดินทาง</span>
              </button>
              <a
                href={place.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2.5 rounded-md border border-neutral-300 text-neutral-950 text-xs font-medium hover:border-neutral-950 transition-colors flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
                <span>Maps</span>
              </a>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

function MapCameraAndRouteController({
  selectedProvince,
  selectedPlace,
  activeRoute,
}: {
  selectedProvince: Province;
  selectedPlace: PadThaiPlace | null;
  activeRoute: RouteSummary | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: selectedProvince.lat, lng: selectedProvince.lng });
    map.setZoom(13);
  }, [map, selectedProvince]);

  useEffect(() => {
    if (!map || !selectedPlace) return;
    map.panTo(selectedPlace.location);
    const currentZoom = map.getZoom() ?? 13;
    if (currentZoom < 14) {
      map.setZoom(15);
    }
  }, [map, selectedPlace]);

  useEffect(() => {
    if (!map || !activeRoute?.path || activeRoute.path.length === 0) return;

    const haloLine = new google.maps.Polyline({
      path: activeRoute.path,
      geodesic: true,
      strokeColor: '#FFFFFF',
      strokeOpacity: 0.92,
      strokeWeight: 7,
      zIndex: 40,
      map,
    });

    const coreLine = new google.maps.Polyline({
      path: activeRoute.path,
      geodesic: true,
      strokeColor: '#0A0A0A',
      strokeOpacity: 0.95,
      strokeWeight: 4,
      zIndex: 41,
      map,
    });

    const bounds = new google.maps.LatLngBounds();
    for (const pt of activeRoute.path) {
      bounds.extend(pt);
    }
    map.fitBounds(bounds, { top: 64, right: 64, bottom: 64, left: 64 });

    return () => {
      haloLine.setMap(null);
      coreLine.setMap(null);
    };
  }, [map, activeRoute]);

  return null;
}

export function PadThaiMap({
  selectedProvince,
  places,
  featuredIds,
  selectedPlace,
  userLocation,
  activeRoute,
  isExpanded = false,
  onToggleExpand,
  onSelectPlace,
  onComputeRoute,
}: PadThaiMapProps) {
  const handleMapClick = useCallback(() => {
    onSelectPlace(null);
  }, [onSelectPlace]);

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={{ lat: selectedProvince.lat, lng: selectedProvince.lng }}
        defaultZoom={13}
        gestureHandling="greedy"
        clickableIcons={false}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onClick={handleMapClick}
        style={{ width: '100%', height: '100%' }}
      >
        <MapCameraAndRouteController
          selectedProvince={selectedProvince}
          selectedPlace={selectedPlace}
          activeRoute={activeRoute}
        />

        {userLocation && (
          <AdvancedMarker position={userLocation} zIndex={60} title="ตำแหน่งของคุณ">
            <div className="w-5 h-5 rounded-full bg-neutral-950 border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
          </AdvancedMarker>
        )}

        {activeRoute?.originCoords && !userLocation && (
          <AdvancedMarker
            position={activeRoute.originCoords}
            zIndex={55}
            title={`จุดเริ่มต้น: ${activeRoute.originLabel}`}
          >
            <div className="px-2 py-0.5 rounded-md bg-neutral-950 text-white border border-white text-[10px] font-medium shadow-md whitespace-nowrap">
              จุดเริ่มต้น
            </div>
          </AdvancedMarker>
        )}

        {places.map((place, idx) => (
          <PlacePinMarker
            key={place.id}
            place={place}
            index={idx}
            isSelected={selectedPlace?.id === place.id}
            isFeatured={Boolean(featuredIds?.[place.id])}
            onSelect={onSelectPlace}
            onCloseInfo={() => onSelectPlace(null)}
            onComputeRoute={onComputeRoute}
          />
        ))}
      </GoogleMap>

      {onToggleExpand && (
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? 'หดแผนที่กลับขนาดปกติ' : 'ขยายแผนที่เต็มจอ'}
          title={isExpanded ? 'หดกลับ (Esc)' : 'ขยายเต็มจอ'}
          className={`absolute top-3 right-3 z-20 h-10 px-3 rounded-xl border shadow-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            isExpanded
              ? 'bg-neutral-950 text-white border-neutral-950 hover:bg-neutral-800'
              : 'bg-white/95 text-neutral-950 border-neutral-200 hover:border-neutral-950'
          }`}
        >
          {isExpanded ? (
            <>
              <Minimize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>หดกลับ</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>เต็มจอ</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
