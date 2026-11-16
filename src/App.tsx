import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  useApiIsLoaded,
  useApiLoadingStatus,
  APILoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { AlertCircle, RotateCw, Search, Shuffle, X } from 'lucide-react';
import { FavoritesView } from './components/FavoritesView';
import { PadThaiMap } from './components/PadThaiMap';
import { PlaceCard } from './components/PlaceCard';
import { PlaceDetailSheet } from './components/PlaceDetailSheet';
import { ProvinceSelector } from './components/ProvinceSelector';
import { RandomizerModal } from './components/RandomizerModal';
import { Thailand3DView } from './components/Thailand3DView';
import { TopBar } from './components/TopBar';
import {
  DEFAULT_PROVINCE,
  REGION_LABEL_MAP,
  THAILAND_PROVINCES,
  findNearestProvince,
} from './data/thailandProvinces';
import type {
  AppView,
  FavoriteRef,
  FilterState,
  PadThaiPlace,
  Province,
  RouteSummary,
  TravelModeOption,
} from './types/padthai';
import {
  computeInAppRoute,
  fetchPlaceById,
  fetchPlaceRichDetails,
  getGoogleMapsApiKey,
  searchPadThaiByProvince,
} from './utils/placesService';

const FAVORITES_STORAGE_KEY = 'padthai77_favorites_v1';

function loadInitialFavorites(): FavoriteRef[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FavoriteRef =>
        typeof item?.placeId === 'string' && typeof item?.provinceId === 'string'
    );
  } catch {
    return [];
  }
}

function PadThaiWorkspace() {
  const apiIsLoaded = useApiIsLoaded();
  const apiStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');

  const [activeView, setActiveView] = useState<AppView>('map');
  const [selectedProvince, setSelectedProvince] = useState<Province>(DEFAULT_PROVINCE);
  const [filters, setFilters] = useState<FilterState>({
    minRating: 0,
    openNowOnly: false,
    searchKeyword: '',
  });

  const [placesByProvince, setPlacesByProvince] = useState<Record<string, PadThaiPlace[]>>({});
  const [placesById, setPlacesById] = useState<Record<string, PadThaiPlace>>({});
  const [activeDetailedQuery, setActiveDetailedQuery] = useState<string>('');
  const [customSearchResults, setCustomSearchResults] = useState<PadThaiPlace[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [selectedPlace, setSelectedPlace] = useState<PadThaiPlace | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelModeOption>('DRIVING');
  const [activeRoute, setActiveRoute] = useState<RouteSummary | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const [favorites, setFavorites] = useState<FavoriteRef[]>(loadInitialFavorites);
  const [isHydratingFavorites, setIsHydratingFavorites] = useState(false);
  const [isRandomizerOpen, setIsRandomizerOpen] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMapExpanded) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsMapExpanded(false);
        window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMapExpanded]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  }, []);

  // Persist only placeId + provinceId per Google Maps Platform ToS
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage quota errors
    }
  }, [favorites]);

  const loadProvincePlaces = useCallback(
    async (province: Province, forceRefresh = false) => {
      if (!placesLib) return;
      if (!forceRefresh && placesByProvince[province.id]) {
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchPadThaiByProvince(placesLib, province);
        setPlacesByProvince((prev) => ({ ...prev, [province.id]: results }));
        setPlacesById((prev) => {
          const next = { ...prev };
          for (const item of results) {
            next[item.id] = item;
          }
          return next;
        });
      } catch {
        setSearchError('ไม่สามารถดึงข้อมูลร้านผัดไทยจาก Google Places ได้ในขณะนี้');
      } finally {
        setIsSearching(false);
      }
    },
    [placesLib, placesByProvince]
  );

  // Trigger search when Places library is ready or province changes
  useEffect(() => {
    if (!placesLib) return;
    loadProvincePlaces(selectedProvince);
  }, [placesLib, selectedProvince, loadProvincePlaces]);

  // Hydrate missing favorite places when user visits Favorites view
  useEffect(() => {
    if (activeView !== 'favorites' || !placesLib) return;
    const missing = favorites.filter((fav) => !placesById[fav.placeId]);
    if (missing.length === 0) return;

    let cancelled = false;
    setIsHydratingFavorites(true);

    Promise.all(
      missing.map(async (fav) => {
        const prov =
          THAILAND_PROVINCES.find((p) => p.id === fav.provinceId) ?? DEFAULT_PROVINCE;
        return fetchPlaceById(placesLib, fav.placeId, prov);
      })
    )
      .then((fetched) => {
        if (cancelled) return;
        setPlacesById((prev) => {
          const next = { ...prev };
          for (const item of fetched) {
            if (item) next[item.id] = item;
          }
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setIsHydratingFavorites(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeView, placesLib, favorites, placesById]);

  const handleDetailedSearchSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = filters.searchKeyword.trim();
      if (!placesLib) return;

      if (!q) {
        setActiveDetailedQuery('');
        setCustomSearchResults(null);
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setSelectedPlace(null);
      setActiveRoute(null);
      try {
        const results = await searchPadThaiByProvince(placesLib, selectedProvince, q);
        setActiveDetailedQuery(q);
        setCustomSearchResults(results);
        setPlacesById((prev) => {
          const next = { ...prev };
          for (const item of results) {
            next[item.id] = prev[item.id]?.detailsLoaded
              ? { ...item, ...prev[item.id] }
              : item;
          }
          return next;
        });
      } catch {
        setSearchError('ไม่สามารถค้นหาร้านผัดไทยตามคำค้นนี้ได้ในขณะนี้');
      } finally {
        setIsSearching(false);
      }
    },
    [filters.searchKeyword, placesLib, selectedProvince]
  );

  const handleResetDetailedSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, searchKeyword: '' }));
    setActiveDetailedQuery('');
    setCustomSearchResults(null);
    setSearchError(null);
  }, []);

  const rawProvincePlaces = useMemo(
    () => customSearchResults ?? placesByProvince[selectedProvince.id] ?? [],
    [customSearchResults, placesByProvince, selectedProvince.id]
  );

  const filteredPlaces = useMemo(() => {
    const kw = activeDetailedQuery ? '' : filters.searchKeyword.trim().toLowerCase();
    return rawProvincePlaces.filter((place) => {
      if (filters.minRating > 0 && (place.rating ?? 0) < filters.minRating) {
        return false;
      }
      if (filters.openNowOnly && place.isOpen !== true) {
        return false;
      }
      if (kw) {
        const hay = `${place.displayName} ${place.formattedAddress}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [rawProvincePlaces, filters, activeDetailedQuery]);

  const favoriteIdSet = useMemo(() => {
    const record: Record<string, boolean> = {};
    for (const f of favorites) {
      record[f.placeId] = true;
    }
    return record;
  }, [favorites]);

  const handleSelectProvince = useCallback((province: Province) => {
    setSelectedProvince(province);
    setActiveDetailedQuery('');
    setCustomSearchResults(null);
    setSelectedPlace(null);
    setActiveRoute(null);
    setActiveView('map');
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        const nearest = findNearestProvince(coords.lat, coords.lng);
        setSelectedProvince(nearest);
        setSelectedPlace(null);
        setActiveRoute(null);
        setActiveView('map');
        setIsLocating(false);
        showToast(`ย้ายไปที่ ${nearest.nameTh} ตามตำแหน่งของคุณแล้ว`);
      },
      () => {
        setIsLocating(false);
        showToast('ไม่สามารถเข้าถึงตำแหน่งของคุณได้ กรุณาอนุญาตการเข้าถึง GPS');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [showToast]);

  const handleToggleFavorite = useCallback(
    (place: PadThaiPlace) => {
      setFavorites((prev) => {
        const exists = prev.some((f) => f.placeId === place.id);
        if (exists) {
          showToast(`นำ "${place.displayName}" ออกจากร้านโปรดแล้ว`);
          return prev.filter((f) => f.placeId !== place.id);
        }
        showToast(`บันทึก "${place.displayName}" ลงร้านโปรดแล้ว`);
        return [
          { placeId: place.id, provinceId: place.provinceId, savedAt: Date.now() },
          ...prev,
        ];
      });
    },
    [showToast]
  );

  const handleRemoveFavoriteId = useCallback((placeId: string) => {
    setFavorites((prev) => prev.filter((f) => f.placeId !== placeId));
  }, []);

  const handleSharePlace = useCallback(
    async (place: PadThaiPlace) => {
      const shareText = `ปักหมุดร้านผัดไทย: ${place.displayName}${
        place.rating !== null ? ` (★ ${place.rating.toFixed(1)})` : ''
      } · ${place.provinceNameTh}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: place.displayName,
            text: shareText,
            url: place.googleMapsUri,
          });
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }

      try {
        await navigator.clipboard.writeText(`${shareText}\n${place.googleMapsUri}`);
        showToast(`คัดลอกลิงก์ร้าน "${place.displayName}" แล้ว ส่งให้เพื่อนได้เลย`);
      } catch {
        showToast('คัดลอกลิงก์ไม่สำเร็จ กรุณาเปิดผ่าน Google Maps');
      }
    },
    [showToast]
  );

  const handleSelectPlace = useCallback(
    (place: PadThaiPlace | null) => {
      if (!place) {
        setSelectedPlace(null);
        setActiveRoute(null);
        return;
      }

      const cached = placesById[place.id];
      const current = cached && cached.detailsLoaded ? cached : place;
      setSelectedPlace(current);

      if (activeRoute && activeRoute.placeId !== place.id) {
        setActiveRoute(null);
      }

      if (!current.detailsLoaded && placesLib) {
        setIsLoadingDetails(true);
        fetchPlaceRichDetails(placesLib, current)
          .then((enriched) => {
            setPlacesById((prev) => ({ ...prev, [enriched.id]: enriched }));
            setPlacesByProvince((prev) => {
              const list = prev[enriched.provinceId];
              if (!list) return prev;
              return {
                ...prev,
                [enriched.provinceId]: list.map((item) =>
                  item.id === enriched.id ? enriched : item
                ),
              };
            });
            setCustomSearchResults((prev) =>
              prev ? prev.map((item) => (item.id === enriched.id ? enriched : item)) : prev
            );
            setSelectedPlace((prev) => (prev?.id === enriched.id ? enriched : prev));
          })
          .finally(() => {
            setIsLoadingDetails(false);
          });
      }
    },
    [placesById, placesLib, activeRoute]
  );

  const handleComputeRoute = useCallback(
    async (place: PadThaiPlace, requestedMode?: TravelModeOption) => {
      const modeToUse = requestedMode ?? travelMode;
      if (requestedMode) {
        setTravelMode(requestedMode);
      }

      handleSelectPlace(place);
      if (!routesLib) {
        showToast('ระบบเส้นทางกำลังเตรียมพร้อม กรุณาลองอีกครั้ง');
        return;
      }

      const calculateWithOrigin = async (
        origin: { lat: number; lng: number },
        originLabel: string
      ) => {
        setIsRouting(true);
        const route = await computeInAppRoute(
          routesLib,
          origin,
          place.location,
          place.id,
          modeToUse,
          originLabel
        );
        setIsRouting(false);
        if (route) {
          setActiveRoute(route);
        } else {
          showToast('ไม่พบเส้นทางสำหรับโหมดการเดินทางนี้ ลองเปลี่ยนโหมดหรือเปิดผ่าน Google Maps');
        }
      };

      if (userLocation) {
        await calculateWithOrigin(userLocation, 'ตำแหน่งปัจจุบันของคุณ');
        return;
      }

      const fallbackOrigin = { lat: selectedProvince.lat, lng: selectedProvince.lng };
      const fallbackLabel = `ใจกลางเมือง${selectedProvince.nameTh}`;

      if (!navigator.geolocation) {
        showToast(`แสดงเส้นทางจาก${fallbackLabel}`);
        await calculateWithOrigin(fallbackOrigin, fallbackLabel);
        return;
      }

      setIsRouting(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          await calculateWithOrigin(coords, 'ตำแหน่งปัจจุบันของคุณ');
        },
        async () => {
          showToast(`ไม่สามารถระบุ GPS ได้ แสดงเส้นทางเริ่มต้นจาก${fallbackLabel}`);
          await calculateWithOrigin(fallbackOrigin, fallbackLabel);
        },
        { enableHighAccuracy: false, timeout: 6000 }
      );
    },
    [travelMode, handleSelectPlace, routesLib, userLocation, selectedProvince, showToast]
  );

  const handleToggleMapExpand = useCallback(() => {
    setIsMapExpanded((prev) => !prev);
    window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
  }, []);

  const handleChangeView = useCallback((view: AppView) => {
    setIsRandomizerOpen(false);
    setIsMapExpanded(false);
    if (view !== 'map') {
      setSelectedPlace(null);
      setActiveRoute(null);
    }
    setActiveView(view);
  }, []);

  const handleOpenRandomizer = useCallback(() => {
    setIsMapExpanded(false);
    if (activeView !== 'map') {
      setSelectedPlace(null);
      setActiveRoute(null);
      setActiveView('map');
    }
    setIsRandomizerOpen(true);
  }, [activeView]);

  const mapsFailed =
    apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-white text-neutral-950 overflow-hidden">
      <TopBar
        activeView={activeView}
        onChangeView={handleChangeView}
        onOpenRandomizer={handleOpenRandomizer}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        favoritesCount={favorites.length}
      />

      {activeView === '3d' && (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <Thailand3DView
            selectedProvince={selectedProvince}
            cachedPlacesByProvince={placesByProvince}
            userLocation={userLocation}
            onCacheProvincePlaces={(provinceId, results) => {
              setPlacesByProvince((prev) => ({ ...prev, [provinceId]: results }));
              setPlacesById((prev) => {
                const next = { ...prev };
                for (const item of results) {
                  next[item.id] = prev[item.id]?.detailsLoaded
                    ? { ...item, ...prev[item.id] }
                    : item;
                }
                return next;
              });
            }}
            onSelectProvince={handleSelectProvince}
            onSelectPlaceAndOpenSearch={(place, province) => {
              setSelectedProvince(province);
              setActiveDetailedQuery('');
              setCustomSearchResults(null);
              handleSelectPlace(place);
              setActiveView('map');
            }}
            onBackToMap={() => handleChangeView('map')}
          />
        </div>
      )}

      {activeView === 'favorites' && (
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <FavoritesView
            favorites={favorites}
            placesById={placesById}
            isHydrating={isHydratingFavorites}
            onSelectFavorite={(place, province) => {
              setSelectedProvince(province);
              setActiveDetailedQuery('');
              setCustomSearchResults(null);
              handleSelectPlace(place);
              setActiveView('map');
            }}
            onToggleFavorite={handleToggleFavorite}
            onRemoveFavoriteId={handleRemoveFavoriteId}
            onShare={handleSharePlace}
            onBackToMap={() => handleChangeView('map')}
          />
        </div>
      )}

      {activeView === 'map' && (
        <div className="flex-1 min-h-0 flex flex-col-reverse md:flex-row overflow-hidden">
          {/* Left Discovery Rail (Tablet/Desktop side rail, Mobile 52% bottom) */}
          <section
            aria-label="รายการร้านผัดไทยและตัวกรอง"
            className="w-full md:w-[360px] lg:w-[400px] xl:w-[430px] h-[52%] md:h-full border-t md:border-t-0 md:border-r border-neutral-200 bg-white flex flex-col shrink-0 z-10 overflow-hidden"
          >
            {/* On <xl screens, show PlaceDetailSheet cleanly inside the rail so it never covers the map or tabs */}
            {selectedPlace && (
              <div className="xl:hidden h-full flex flex-col overflow-hidden">
                <PlaceDetailSheet
                  variant="rail"
                  place={selectedPlace}
                  isFavorite={Boolean(favoriteIdSet[selectedPlace.id])}
                  isLoadingDetails={isLoadingDetails}
                  routeSummary={activeRoute}
                  travelMode={travelMode}
                  isRouting={isRouting}
                  onClose={() => handleSelectPlace(null)}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleSharePlace}
                  onComputeRoute={handleComputeRoute}
                />
              </div>
            )}

            <div
              className={
                selectedPlace
                  ? 'hidden xl:flex xl:flex-col h-full overflow-hidden'
                  : 'flex flex-col h-full overflow-hidden'
              }
            >
              {/* Province + Filter Controls */}
              <div className="p-4 border-b border-neutral-200 space-y-3 bg-white">
              <ProvinceSelector
                selectedProvince={selectedProvince}
                onSelectProvince={handleSelectProvince}
                onOpen3DSelector={() => setActiveView('3d')}
              />

              {/* Detailed Search Form with Search Button */}
              <form onSubmit={handleDetailedSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search
                    className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={filters.searchKeyword}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, searchKeyword: e.target.value }))
                    }
                    placeholder={`ค้นหาละเอียด เช่น กุ้งสด, ย่านดัง ใน${selectedProvince.nameTh}...`}
                    aria-label="ค้นหาร้านผัดไทยแบบละเอียด"
                    className="w-full h-10 pl-9 pr-8 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:bg-white"
                  />
                  {(filters.searchKeyword || activeDetailedQuery) && (
                    <button
                      type="button"
                      onClick={handleResetDetailedSearch}
                      aria-label="ล้างคำค้นหาร้าน"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSearching || !placesLib}
                  className="h-10 px-3.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>ค้นหา</span>
                </button>
              </form>

              {/* Rating & Open Now Segmented Filters + Randomizer */}
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-0.5 p-1 rounded-lg bg-neutral-100">
                  {([0, 4, 4.5] as const).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, minRating: rating }))
                      }
                      className={`px-2 py-1 rounded-md text-[11px] font-medium tabular-nums whitespace-nowrap transition-colors ${
                        filters.minRating === rating
                          ? 'bg-white text-neutral-950 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      {rating === 0 ? 'ทุกคะแนน' : `★ ${rating.toFixed(1)}+`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        openNowOnly: !prev.openNowOnly,
                      }))
                    }
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-colors ${
                      filters.openNowOnly
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950'
                    }`}
                  >
                    เปิดอยู่ตอนนี้
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRandomizerOpen(true)}
                    title="สุ่มร้านผัดไทยเด็ดในจังหวัดนี้"
                    className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-950 hover:border-neutral-950 text-[11px] font-medium whitespace-nowrap flex items-center gap-1 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>สุ่ม</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Result Summary Header */}
            <div className="px-4 py-2.5 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between gap-2 text-xs text-neutral-600 tabular-nums">
              <div className="truncate flex items-center gap-1.5">
                <span className="truncate">
                  {activeDetailedQuery
                    ? `ค้นหา "${activeDetailedQuery}" · ${selectedProvince.nameTh}`
                    : `${selectedProvince.nameTh} (${REGION_LABEL_MAP[selectedProvince.region]})`}
                </span>
                {activeDetailedQuery && (
                  <button
                    type="button"
                    onClick={handleResetDetailedSearch}
                    className="text-[11px] font-medium text-neutral-950 underline underline-offset-2 shrink-0"
                  >
                    ดูทั้งหมด
                  </button>
                )}
              </div>
              <span className="font-medium text-neutral-950 shrink-0">
                {isSearching
                  ? 'กำลังค้นหาร้าน...'
                  : `พบ ${filteredPlaces.length} ร้าน`}
              </span>
            </div>

            {/* Restaurant List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-neutral-50/50">
              {mapsFailed ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-neutral-700 mx-auto" />
                  <h2 className="text-sm font-semibold text-neutral-950">
                    ไม่สามารถเชื่อมต่อ Google Maps ได้
                  </h2>
                  <p className="text-xs text-neutral-500">
                    กรุณาตรวจสอบการตั้งค่า Google Maps API key หรือลองรีเฟรชหน้าเว็บใหม่อีกครั้ง
                  </p>
                </div>
              ) : isSearching || !apiIsLoaded ? (
                <div className="space-y-2.5" aria-label="กำลังโหลดรายการร้านผัดไทย">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-neutral-200 bg-white p-3 flex gap-3.5 animate-pulse"
                    >
                      <div className="w-24 h-20 rounded-lg bg-neutral-200 shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-neutral-200 rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 rounded w-1/2" />
                        <div className="h-3 bg-neutral-100 rounded w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchError ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center space-y-3">
                  <p className="text-xs text-neutral-600">{searchError}</p>
                  <button
                    type="button"
                    onClick={() =>
                      activeDetailedQuery
                        ? handleDetailedSearchSubmit()
                        : loadProvincePlaces(selectedProvince, true)
                    }
                    className="px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>ลองค้นหาใหม่</span>
                  </button>
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center space-y-3">
                  <div className="text-sm font-semibold text-neutral-950">
                    ไม่พบร้านผัดไทยที่ตรงกับตัวกรอง
                  </div>
                  <p className="text-xs text-neutral-500">
                    ลองลดเงื่อนไขคะแนนดาว ปิดตัวกรอง "เปิดอยู่ตอนนี้" หรือล้างคำค้นหา
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({
                        minRating: 0,
                        openNowOnly: false,
                        searchKeyword: '',
                      });
                      setActiveDetailedQuery('');
                      setCustomSearchResults(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-950 hover:border-neutral-950"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                filteredPlaces.map((place, idx) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    index={idx}
                    isSelected={selectedPlace?.id === place.id}
                    isFavorite={Boolean(favoriteIdSet[place.id])}
                    onSelect={handleSelectPlace}
                    onToggleFavorite={handleToggleFavorite}
                    onShare={handleSharePlace}
                  />
                ))
              )}
            </div>
            </div>
          </section>

          {/* Right Canvas: Full-Height Google Maps + Floating Detail Sheet */}
          <section
            aria-label="แผนที่ Google Maps แสดงหมุดร้านผัดไทย"
            className={
              isMapExpanded
                ? 'fixed inset-0 z-50 bg-neutral-100'
                : 'relative flex-1 h-[48%] md:h-full min-w-0 bg-neutral-100'
            }
          >
            <PadThaiMap
              selectedProvince={selectedProvince}
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              userLocation={userLocation}
              activeRoute={activeRoute}
              isExpanded={isMapExpanded}
              onToggleExpand={handleToggleMapExpand}
              onSelectPlace={handleSelectPlace}
              onComputeRoute={(p) => handleComputeRoute(p)}
            />

            {selectedPlace && (
              <div
                className={
                  isMapExpanded
                    ? 'hidden sm:block absolute top-16 right-3 z-20 w-[356px]'
                    : 'hidden xl:block absolute top-16 right-3 z-20 w-[356px]'
                }
              >
                <PlaceDetailSheet
                  variant="floating"
                  place={selectedPlace}
                  isFavorite={Boolean(favoriteIdSet[selectedPlace.id])}
                  isLoadingDetails={isLoadingDetails}
                  routeSummary={activeRoute}
                  travelMode={travelMode}
                  isRouting={isRouting}
                  onClose={() => handleSelectPlace(null)}
                  onToggleFavorite={handleToggleFavorite}
                  onShare={handleSharePlace}
                  onComputeRoute={handleComputeRoute}
                />
              </div>
            )}
          </section>
        </div>
      )}

      <RandomizerModal
        isOpen={isRandomizerOpen && activeView === 'map'}
        province={selectedProvince}
        places={filteredPlaces}
        onClose={() => setIsRandomizerOpen(false)}
        onConfirmPlace={(picked) => {
          setIsRandomizerOpen(false);
          handleSelectPlace(picked);
        }}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-medium shadow-lg whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  const apiKey = getGoogleMapsApiKey();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white text-neutral-950">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {!apiKey ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-neutral-50">
          <div className="max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center space-y-2">
            <h1 className="text-lg font-bold text-neutral-950">PADTHAI 77</h1>
            <p className="text-sm text-neutral-600">
              ยังไม่ได้ตั้งค่า Google Maps API key (VITE_GOOGLE_MAPS_API_KEY) ในสภาพแวดล้อม
            </p>
          </div>
        </div>
      ) : (
        <APIProvider
          apiKey={apiKey}
          language="th"
          region="TH"
          libraries={['places', 'marker', 'routes', 'geometry']}
        >
          <PadThaiWorkspace />
        </APIProvider>
      )}
    </div>
  );
}
