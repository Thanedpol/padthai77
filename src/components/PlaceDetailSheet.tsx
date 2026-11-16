import { useState } from 'react';
import {
  ArrowLeft,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Footprints,
  Globe,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Star,
  TrainFront,
  X,
} from 'lucide-react';
import type {
  PadThaiPlace,
  RouteSummary,
  TravelModeOption,
} from '../types/padthai';
import { FALLBACK_FOOD_IMAGES } from '../utils/placesService';

interface PlaceDetailSheetProps {
  place: PadThaiPlace;
  variant?: 'rail' | 'floating';
  isFavorite: boolean;
  isLoadingDetails: boolean;
  routeSummary: RouteSummary | null;
  travelMode: TravelModeOption;
  isRouting: boolean;
  onClose: () => void;
  onToggleFavorite: (place: PadThaiPlace) => void;
  onShare: (place: PadThaiPlace) => void;
  onComputeRoute: (place: PadThaiPlace, mode?: TravelModeOption) => void;
}

const TRAVEL_MODES: Array<{
  id: TravelModeOption;
  label: string;
  Icon: typeof Car;
}> = [
  { id: 'DRIVING', label: 'รถยนต์', Icon: Car },
  { id: 'TRANSIT', label: 'ขนส่ง', Icon: TrainFront },
  { id: 'WALKING', label: 'เดิน', Icon: Footprints },
];

export function PlaceDetailSheet({
  place,
  variant = 'floating',
  isFavorite,
  isLoadingDetails,
  routeSummary,
  travelMode,
  isRouting,
  onClose,
  onToggleFavorite,
  onShare,
  onComputeRoute,
}: PlaceDetailSheetProps) {
  const [imgError, setImgError] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [showSteps, setShowSteps] = useState(true);
  const [showReviews, setShowReviews] = useState(true);

  const displayImg =
    !imgError && place.photoUrl ? place.photoUrl : FALLBACK_FOOD_IMAGES[0];

  const activeRouteForPlace =
    routeSummary && routeSummary.placeId === place.id ? routeSummary : null;

  const googleMapsTravelMode =
    travelMode === 'DRIVING'
      ? 'driving'
      : travelMode === 'WALKING'
        ? 'walking'
        : 'transit';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${place.location.lat},${place.location.lng}`
  )}&destination_place_id=${encodeURIComponent(place.id)}&travelmode=${googleMapsTravelMode}`;

  const serviceOptions: string[] = [];
  if (place.hasDineIn) serviceOptions.push('ทานที่ร้าน');
  if (place.hasTakeout) serviceOptions.push('ซื้อกลับบ้าน');
  if (place.hasDelivery) serviceOptions.push('เดลิเวอรี');

  const isRail = variant === 'rail';

  return (
    <aside
      aria-label={`รายละเอียดร้าน ${place.displayName}`}
      className={
        isRail
          ? 'bg-white h-full flex flex-col overflow-hidden'
          : 'bg-white border border-neutral-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-5.5rem)]'
      }
    >
      {isRail && (
        <div className="px-4 py-2.5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-neutral-950 hover:text-neutral-600 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>กลับไปรายการร้าน</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดรายละเอียดร้าน"
            className="w-7 h-7 rounded-lg text-neutral-500 hover:text-neutral-950 hover:bg-neutral-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="relative h-36 sm:h-40 bg-neutral-100 shrink-0">
        <img
          src={displayImg}
          alt={place.displayName}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {!isRail && (
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดรายละเอียดร้าน"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 text-neutral-950 hover:bg-white flex items-center justify-center shadow-sm transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-xs text-neutral-200 mb-0.5">
            {place.provinceNameTh}
          </div>
          <h2 className="text-base font-bold leading-snug line-clamp-2">
            {place.displayName}
          </h2>
        </div>
      </div>

      <div className="p-4 overflow-y-auto space-y-3.5">
        {/* Rating & Open Status */}
        <div className="pb-3 border-b border-neutral-100 space-y-1">
          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 text-sm tabular-nums">
            {place.rating !== null ? (
              <div className="inline-flex items-center gap-1.5 font-semibold text-neutral-950">
                <Star className="w-4 h-4 fill-amber-600 text-amber-600" aria-hidden="true" />
                <span>{place.rating.toFixed(1)}</span>
                {place.userRatingCount !== null && (
                  <span className="text-xs font-normal text-neutral-500">
                    ({place.userRatingCount.toLocaleString()} รีวิว)
                  </span>
                )}
              </div>
            ) : (
              <span className="text-neutral-500 text-xs">ยังไม่มีคะแนนรีวิว</span>
            )}

            {place.isOpen !== null && (
              <>
                <span aria-hidden="true" className="text-neutral-300">
                  ·
                </span>
                <span
                  className={`text-xs font-medium ${
                    place.isOpen ? 'text-neutral-950' : 'text-neutral-400'
                  }`}
                >
                  {place.isOpen ? 'เปิดให้บริการอยู่' : 'ปิดให้บริการขณะนี้'}
                </span>
              </>
            )}

            {place.priceLevel && (
              <>
                <span aria-hidden="true" className="text-neutral-300">
                  ·
                </span>
                <span className="text-xs text-neutral-600">{place.priceLevel}</span>
              </>
            )}
          </div>

          {serviceOptions.length > 0 && (
            <div className="text-xs text-neutral-500">
              {serviceOptions.join(' · ')}
            </div>
          )}
        </div>

        {/* Authentic Google Editorial Summary */}
        {place.editorialSummary && (
          <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5">
            {place.editorialSummary}
          </p>
        )}

        {/* Primary Directions Button + Google Maps Link */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onComputeRoute(place, travelMode)}
            disabled={isRouting}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{isRouting ? 'กำลังค้นหาเส้นทาง...' : 'เดินทาง'}</span>
          </button>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 text-xs font-medium hover:border-neutral-950 transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>เปิด Google Maps</span>
          </a>
        </div>

        {/* Turn-by-Turn Route Breakdown */}
        {activeRouteForPlace && (
          <div className="rounded-xl border border-neutral-950 bg-neutral-50 overflow-hidden">
            <div className="bg-neutral-950 text-white px-3.5 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-medium truncate">
                  จาก: {activeRouteForPlace.originLabel}
                </div>
                <div className="text-xs font-mono font-semibold tabular-nums shrink-0 text-amber-400">
                  {activeRouteForPlace.distanceText} · {activeRouteForPlace.durationText}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-0.5">
                {TRAVEL_MODES.map(({ id, label, Icon }) => {
                  const selected = travelMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={isRouting}
                      onClick={() => onComputeRoute(place, id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        selected
                          ? 'bg-white text-neutral-950'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeRouteForPlace.steps.length > 0 && (
              <div className="p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSteps((prev) => !prev)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-neutral-950"
                >
                  <span>
                    ขั้นตอนเส้นทางสู่ร้าน ({activeRouteForPlace.steps.length} ขั้นตอน)
                  </span>
                  {showSteps ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  )}
                </button>

                {showSteps && (
                  <ol className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeRouteForPlace.steps.map((step, idx) => (
                      <li
                        key={`${idx}-${step.instruction.slice(0, 20)}`}
                        className="flex items-start gap-2 text-xs text-neutral-700 pb-2 border-b border-neutral-200/70 last:border-b-0 last:pb-0"
                      >
                        <span className="w-5 h-5 rounded-md bg-neutral-200 text-neutral-950 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-neutral-950 leading-snug">
                            {step.instruction}
                          </div>
                          {(step.distanceText || step.durationText) && (
                            <div className="text-[11px] text-neutral-500 tabular-nums mt-0.5">
                              {[step.distanceText, step.durationText]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}

        {/* Address, Website, Phone, Opening Hours */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-neutral-700 leading-relaxed">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{place.formattedAddress}</span>
          </div>

          {place.websiteUri && (
            <div className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" aria-hidden="true" />
              <a
                href={place.websiteUri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-950 underline underline-offset-2 hover:text-neutral-600 break-all"
              >
                {place.websiteUri}
              </a>
            </div>
          )}

          {place.phoneNumber && (
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
              <a
                href={`tel:${place.phoneNumber.replace(/\s+/g, '')}`}
                className="text-neutral-950 hover:underline tabular-nums"
              >
                {place.phoneNumber}
              </a>
            </div>
          )}

          {place.openingHoursText.length > 0 && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setShowHours((prev) => !prev)}
                className="flex items-center gap-2 text-xs font-medium text-neutral-950 hover:text-neutral-600 transition-colors"
              >
                <Clock className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden="true" />
                <span>{showHours ? 'ซ่อนเวลาเปิด-ปิด' : 'ดูเวลาเปิด-ปิดประจำสัปดาห์'}</span>
              </button>
              {showHours && (
                <ul className="pl-6 space-y-1 text-xs text-neutral-600 tabular-nums">
                  {place.openingHoursText.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isLoadingDetails && (
            <div className="text-[11px] text-neutral-400">
              กำลังดึงข้อมูลเว็บไซต์ เบอร์โทร และรีวิวจาก Google Places...
            </div>
          )}
        </div>

        {/* Save & Share Actions */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onToggleFavorite(place)}
            className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              isFavorite
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950'
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 shrink-0 ${isFavorite ? 'fill-white' : ''}`}
              aria-hidden="true"
            />
            <span>{isFavorite ? 'บันทึกโปรดแล้ว' : 'บันทึกร้านโปรด'}</span>
          </button>

          <button
            type="button"
            onClick={() => onShare(place)}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 text-xs font-medium hover:border-neutral-950 transition-colors flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>แชร์ให้เพื่อน</span>
          </button>
        </div>

        {/* Authentic User Reviews from Google Places */}
        {place.reviews && place.reviews.length > 0 && (
          <div className="pt-2 border-t border-neutral-100 space-y-2">
            <button
              type="button"
              onClick={() => setShowReviews((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-neutral-950"
            >
              <span>รีวิวจากผู้ใช้ Google Maps ({place.reviews.length})</span>
              {showReviews ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            {showReviews && (
              <div className="space-y-2.5">
                {place.reviews.slice(0, 3).map((rev, idx) => (
                  <div
                    key={`${rev.authorName}-${idx}`}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-2.5 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-neutral-950 truncate">
                        {rev.authorName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0 text-neutral-500 tabular-nums">
                        {rev.rating !== null && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-neutral-950">
                            <span className="text-amber-600" aria-hidden="true">
                              ★
                            </span>
                            {rev.rating.toFixed(1)}
                          </span>
                        )}
                        {rev.relativeTime && <span>· {rev.relativeTime}</span>}
                      </div>
                    </div>
                    {rev.text && (
                      <p className="text-xs text-neutral-700 leading-relaxed line-clamp-3">
                        {rev.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pt-1 text-right">
          <a
            href={place.googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-500 hover:text-neutral-950 underline underline-offset-2"
          >
            ดูข้อมูลทั้งหมดบนหน้า Google Maps
          </a>
        </div>
      </div>
    </aside>
  );
}
