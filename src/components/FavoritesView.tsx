import { ArrowLeft, Heart, MapPin, Trash2 } from 'lucide-react';
import { REGION_LABEL_MAP, THAILAND_PROVINCES } from '../data/thailandProvinces';
import type { FavoriteRef, PadThaiPlace, Province } from '../types/padthai';
import { PlaceCard } from './PlaceCard';

interface FavoritesViewProps {
  favorites: FavoriteRef[];
  placesById: Record<string, PadThaiPlace>;
  isHydrating: boolean;
  onSelectFavorite: (place: PadThaiPlace, province: Province) => void;
  onToggleFavorite: (place: PadThaiPlace) => void;
  onRemoveFavoriteId: (placeId: string) => void;
  onShare: (place: PadThaiPlace) => void;
  onBackToMap: () => void;
}

export function FavoritesView({
  favorites,
  placesById,
  isHydrating,
  onSelectFavorite,
  onToggleFavorite,
  onRemoveFavoriteId,
  onShare,
  onBackToMap,
}: FavoritesViewProps) {
  return (
    <main className="h-full overflow-y-auto bg-white">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-neutral-200">
          <div>
            <button
              type="button"
              onClick={onBackToMap}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-950 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>กลับไปหน้าแผนที่ค้นหา</span>
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
              ร้านผัดไทยโปรดของคุณ
            </h1>
            <p className="text-sm text-neutral-500 mt-1 tabular-nums">
              บันทึกไว้ทั้งหมด {favorites.length} ร้าน
            </p>
          </div>
        </div>

        {favorites.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center mx-auto text-neutral-400">
              <Heart className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                ยังไม่มีร้านโปรดที่บันทึกไว้
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                กดปุ่มรูปหัวใจบนการ์ดร้านผัดไทยในจังหวัดใดก็ได้เพื่อเก็บลิสต์ส่วนตัวไว้กลับมาตามรอย
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToMap}
              className="px-5 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              เริ่มสำรวจร้านผัดไทย
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((fav, idx) => {
              const place = placesById[fav.placeId];
              const province =
                THAILAND_PROVINCES.find((p) => p.id === fav.provinceId) ??
                THAILAND_PROVINCES[0];

              if (!place) {
                return (
                  <div
                    key={fav.placeId}
                    className="rounded-xl border border-neutral-200 p-4 flex items-center justify-between gap-3 bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-950">
                        {isHydrating ? 'กำลังโหลดข้อมูลร้าน...' : 'ร้านผัดไทยที่บันทึกไว้'}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {province.nameTh} · {REGION_LABEL_MAP[province.region]}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveFavoriteId(fav.placeId)}
                      aria-label="ลบออกจากร้านโปรด"
                      className="w-9 h-9 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-950 flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                );
              }

              return (
                <div key={fav.placeId} className="space-y-1.5">
                  <div className="text-xs font-medium text-neutral-500 px-1">
                    {province.nameTh} · {REGION_LABEL_MAP[province.region]}
                  </div>
                  <PlaceCard
                    place={place}
                    index={idx}
                    isSelected={false}
                    isFavorite={true}
                    onSelect={(selected) => onSelectFavorite(selected, province)}
                    onToggleFavorite={onToggleFavorite}
                    onShare={onShare}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
