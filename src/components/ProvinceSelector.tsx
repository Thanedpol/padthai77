import { useMemo, useState } from 'react';
import { ChevronDown, Compass, Search, X } from 'lucide-react';
import { REGIONS, REGION_LABEL_MAP, THAILAND_PROVINCES } from '../data/thailandProvinces';
import type { Province, RegionId } from '../types/padthai';

interface ProvinceSelectorProps {
  selectedProvince: Province;
  onSelectProvince: (province: Province) => void;
  onOpen3DSelector: () => void;
}

export function ProvinceSelector({
  selectedProvince,
  onSelectProvince,
  onOpen3DSelector,
}: ProvinceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<RegionId | 'all'>('all');

  const filteredProvinces = useMemo(() => {
    const q = query.trim().toLowerCase();
    return THAILAND_PROVINCES.filter((p) => {
      if (activeRegion !== 'all' && p.region !== activeRegion) return false;
      if (!q) return true;
      return p.nameTh.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
    });
  }, [query, activeRegion]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-neutral-500">
          พื้นที่ค้นหา · 77 จังหวัดทั่วไทย
        </span>
        <button
          type="button"
          onClick={onOpen3DSelector}
          className="text-xs font-medium text-neutral-950 hover:text-amber-600 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          <Compass className="w-3.5 h-3.5" aria-hidden="true" />
          <span>เลือกบนแผนที่ 3 มิติ</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white hover:border-neutral-950 transition-colors flex items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-neutral-950"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-neutral-950 truncate">
            {selectedProvince.nameTh}
          </div>
          <div className="text-xs text-neutral-500 truncate">
            {selectedProvince.nameEn} · {REGION_LABEL_MAP[selectedProvince.region]}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="mt-2 rounded-xl border border-neutral-200 bg-white shadow-xl overflow-hidden z-30">
          <div className="p-3 border-b border-neutral-200 space-y-2.5">
            <div className="relative">
              <Search
                className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อจังหวัด (ไทย / EN)..."
                aria-label="ค้นหาจังหวัด"
                className="w-full h-10 pl-9 pr-8 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:bg-white"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="ล้างคำค้นหาจังหวัด"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setActiveRegion('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeRegion === 'all'
                    ? 'bg-neutral-950 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950'
                }`}
              >
                ทั้งหมด (77)
              </button>
              {REGIONS.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setActiveRegion(region.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    activeRegion === region.id
                      ? 'bg-neutral-950 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  {region.labelTh}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
            {filteredProvinces.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                ไม่พบจังหวัดที่ตรงกับคำค้นหา "{query}"
              </div>
            ) : (
              filteredProvinces.map((province) => {
                const isSelected = province.id === selectedProvince.id;
                return (
                  <button
                    key={province.id}
                    type="button"
                    onClick={() => {
                      onSelectProvince(province);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors ${
                      isSelected ? 'bg-neutral-950 text-white' : 'hover:bg-neutral-50 text-neutral-950'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{province.nameTh}</div>
                      <div
                        className={`text-xs truncate ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        {province.nameEn}
                      </div>
                    </div>
                    <span
                      className={`text-xs whitespace-nowrap shrink-0 ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      {REGION_LABEL_MAP[province.region]}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
