import { Compass, Heart, MapPin, Shuffle } from 'lucide-react';
import type { AppView } from '../types/padthai';

interface TopBarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onOpenRandomizer: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  favoritesCount: number;
}

export function TopBar({
  activeView,
  onChangeView,
  onOpenRandomizer,
  onLocateMe,
  isLocating,
  favoritesCount,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 bg-white border-b border-neutral-200 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 lg:gap-8">
      {/* Zone 1: Brand Wordmark only */}
      <button
        type="button"
        onClick={() => onChangeView('map')}
        className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-neutral-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
      >
        PADTHAI 77
      </button>

      {/* Zone 2: 4 single-line navigation links */}
      <nav
        aria-label="เมนูหลัก"
        className="h-full flex items-center gap-3 sm:gap-5 lg:gap-6"
      >
        <button
          type="button"
          onClick={() => onChangeView('map')}
          className={`relative h-full flex items-center text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeView === 'map'
              ? 'text-neutral-950 font-semibold'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          แผนที่ค้นหา
          {activeView === 'map' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-950" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeView('3d')}
          className={`relative h-full flex items-center gap-1.5 text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeView === '3d'
              ? 'text-neutral-950 font-semibold'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          <Compass className="w-3.5 h-3.5 shrink-0 hidden sm:block" aria-hidden="true" />
          <span>แผนที่ไทย 3 มิติ</span>
          {activeView === '3d' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-950" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenRandomizer}
          className="h-full flex items-center gap-1.5 text-xs lg:text-sm font-medium text-neutral-500 hover:text-neutral-950 whitespace-nowrap shrink-0 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5 shrink-0 hidden sm:block" aria-hidden="true" />
          <span>สุ่มร้านเด็ด</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeView('favorites')}
          className={`relative h-full flex items-center gap-1.5 text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
            activeView === 'favorites'
              ? 'text-neutral-950 font-semibold'
              : 'text-neutral-500 hover:text-neutral-950'
          }`}
        >
          <Heart className="w-3.5 h-3.5 shrink-0 hidden sm:block" aria-hidden="true" />
          <span className="tabular-nums">
            ร้านโปรด{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
          </span>
          {activeView === 'favorites' && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-neutral-950" />
          )}
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className="px-3 lg:px-4 py-2 min-h-[38px] rounded-lg bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-60 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{isLocating ? 'กำลังระบุ...' : 'ใกล้ฉัน'}</span>
        </button>
      </div>
    </header>
  );
}
