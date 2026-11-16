import { useEffect, useState } from 'react';
import { MapPin, RefreshCw, Star, X } from 'lucide-react';
import type { PadThaiPlace, Province } from '../types/padthai';
import { FALLBACK_FOOD_IMAGES } from '../utils/placesService';

interface RandomizerModalProps {
  isOpen: boolean;
  province: Province;
  places: PadThaiPlace[];
  onClose: () => void;
  onConfirmPlace: (place: PadThaiPlace) => void;
}

export function RandomizerModal({
  isOpen,
  province,
  places,
  onClose,
  onConfirmPlace,
}: RandomizerModalProps) {
  const [candidate, setCandidate] = useState<PadThaiPlace | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [imgError, setImgError] = useState(false);

  const runShuffle = () => {
    if (places.length === 0) return;
    setImgError(false);

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion || places.length === 1) {
      const pick = places[Math.floor(Math.random() * places.length)];
      setCandidate(pick);
      setIsSpinning(false);
      return;
    }

    setIsSpinning(true);
    let ticks = 0;
    const totalTicks = 10;
    const timer = window.setInterval(() => {
      ticks += 1;
      const randomPick = places[Math.floor(Math.random() * places.length)];
      setCandidate(randomPick);
      if (ticks >= totalTicks) {
        window.clearInterval(timer);
        setIsSpinning(false);
      }
    }, 65);

    return () => window.clearInterval(timer);
  };

  useEffect(() => {
    if (!isOpen) return;
    const cleanup = runShuffle();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, province.id]);

  if (!isOpen) return null;

  const displayImg =
    !imgError && candidate?.photoUrl
      ? candidate.photoUrl
      : FALLBACK_FOOD_IMAGES[1];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="randomizer-title"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 id="randomizer-title" className="text-base font-bold text-neutral-950">
              สุ่มร้านผัดไทยเด็ด
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {province.nameTh} · จากทั้งหมด {places.length} ร้านที่ค้นพบ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างสุ่มร้าน"
            className="w-9 h-9 rounded-lg hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {places.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-500">
              ยังไม่มีรายการร้านผัดไทยให้สุ่มในตัวกรองปัจจุบัน ลองปรับตัวกรองหรือเลือกจังหวัดอื่น
            </div>
          ) : candidate ? (
            <div
              className={`transition-opacity duration-150 ${
                isSpinning ? 'opacity-70' : 'opacity-100'
              }`}
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100 mb-4">
                <img
                  src={displayImg}
                  alt={candidate.displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-lg font-bold text-neutral-950 leading-snug">
                {candidate.displayName}
              </h3>

              <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-600 tabular-nums">
                {candidate.rating !== null ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-neutral-950">
                    <Star
                      className="w-3.5 h-3.5 fill-amber-600 text-amber-600"
                      aria-hidden="true"
                    />
                    <span>{candidate.rating.toFixed(1)}</span>
                    {candidate.userRatingCount !== null && (
                      <span className="font-normal text-neutral-500">
                        ({candidate.userRatingCount.toLocaleString()} รีวิว)
                      </span>
                    )}
                  </span>
                ) : (
                  <span>ร้านแนะนำในพื้นที่</span>
                )}
                {candidate.isOpen !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{candidate.isOpen ? 'เปิดอยู่ตอนนี้' : 'ปิดอยู่'}</span>
                  </>
                )}
              </div>

              <div className="mt-2 flex items-start gap-1.5 text-xs text-neutral-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="line-clamp-2">{candidate.formattedAddress}</span>
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={runShuffle}
                  disabled={isSpinning}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-950 text-xs font-medium hover:border-neutral-950 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>สุ่มใหม่</span>
                </button>
                <button
                  type="button"
                  onClick={() => onConfirmPlace(candidate)}
                  disabled={isSpinning}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
                >
                  ปักหมุดดูร้านนี้บนแผนที่
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
