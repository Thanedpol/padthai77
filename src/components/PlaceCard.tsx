import { useState } from 'react';
import { Heart, Share2, Star } from 'lucide-react';
import type { PadThaiPlace } from '../types/padthai';
import type { FeaturedShop } from '../data/featuredShops';
import { FALLBACK_FOOD_IMAGES } from '../utils/placesService';
import { useInViewOnce } from '../utils/useInViewOnce';

interface PlaceCardProps {
  place: PadThaiPlace;
  index: number;
  isSelected: boolean;
  isFavorite: boolean;
  /** Set when this shop is a paid featured shop (ร้านแนะนำ). */
  featured?: FeaturedShop;
  onSelect: (place: PadThaiPlace) => void;
  onToggleFavorite: (place: PadThaiPlace) => void;
  onShare: (place: PadThaiPlace) => void;
}

export function PlaceCard({
  place,
  index,
  isSelected,
  isFavorite,
  featured,
  onSelect,
  onToggleFavorite,
  onShare,
}: PlaceCardProps) {
  const [imgError, setImgError] = useState(false);
  const fallbackSrc = FALLBACK_FOOD_IMAGES[index % FALLBACK_FOOD_IMAGES.length];
  // Google Place Photos are billed per request: only fetch the real photo
  // once this card has actually been on screen (or the user selected it).
  const [cardRef, hasBeenSeen] = useInViewOnce<HTMLElement>();
  const mayLoadPhoto = hasBeenSeen || isSelected;
  const displayImg =
    !imgError && mayLoadPhoto && place.photoUrl ? place.photoUrl : fallbackSrc;

  return (
    <article
      ref={cardRef}
      className={`group rounded-xl border transition-all duration-150 overflow-hidden ${
        isSelected
          ? 'border-neutral-950 bg-neutral-50 shadow-sm'
          : featured
            ? 'border-amber-400 bg-amber-50/40 hover:border-amber-500'
            : 'border-neutral-200 bg-white hover:border-neutral-400'
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(place)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(place);
          }
        }}
        className="flex gap-3.5 p-3 focus-visible:outline-2 focus-visible:outline-neutral-950"
      >
        <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
          <img
            src={displayImg}
            alt={`ภาพอาหารของร้าน ${place.displayName}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {featured && (
              <div className="mb-1 flex items-center gap-1.5">
                <span className="inline-flex items-center rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-neutral-950">
                  ร้านแนะนำ
                </span>
                <span className="text-[10px] leading-none text-neutral-500">สปอนเซอร์</span>
              </div>
            )}
            <h3 className="text-sm font-semibold text-neutral-950 truncate">
              {place.displayName}
            </h3>
            {featured?.tagline && (
              <p className="mt-0.5 text-xs font-medium text-amber-800 truncate">
                {featured.tagline}
              </p>
            )}

            {/* Unboxed metadata row with typographic separators */}
            <div className="mt-1 flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-neutral-600 tabular-nums">
              {place.rating !== null ? (
                <span className="inline-flex items-center gap-1 font-semibold text-neutral-950">
                  <Star
                    className="w-3.5 h-3.5 fill-amber-600 text-amber-600 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{place.rating.toFixed(1)}</span>
                  {place.userRatingCount !== null && (
                    <span className="font-normal text-neutral-500">
                      ({place.userRatingCount.toLocaleString()})
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-neutral-500">ยังไม่มีคะแนน</span>
              )}

              {place.isOpen !== null && (
                <>
                  <span aria-hidden="true" className="text-neutral-300">
                    ·
                  </span>
                  <span className={place.isOpen ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>
                    {place.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
                  </span>
                </>
              )}

              {place.priceLevel && (
                <>
                  <span aria-hidden="true" className="text-neutral-300">
                    ·
                  </span>
                  <span>{place.priceLevel}</span>
                </>
              )}
            </div>
          </div>

          <p className="mt-1.5 text-xs text-neutral-500 truncate">
            {place.formattedAddress}
          </p>
        </div>

        <div
          className="flex flex-col items-end justify-between shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onToggleFavorite(place)}
            aria-label={isFavorite ? 'นำออกจากร้านโปรด' : 'บันทึกลงร้านโปรด'}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isFavorite
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => onShare(place)}
            aria-label={`แชร์ร้าน ${place.displayName}`}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
