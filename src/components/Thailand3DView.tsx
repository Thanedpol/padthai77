import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  Box,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Flame,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Mountain,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  RotateCw,
  Satellite,
  Search,
  Star,
  TrafficCone,
  X,
} from 'lucide-react';
import { REGIONS, REGION_LABEL_MAP, THAILAND_PROVINCES } from '../data/thailandProvinces';
import type {
  PadThaiPlace,
  PriceFilterOption,
  Province,
  RegionId,
  SortModeOption,
} from '../types/padthai';
import {
  FALLBACK_FOOD_IMAGES,
  haversineDistanceKm,
  searchPadThaiByProvince,
} from '../utils/placesService';

interface Thailand3DViewProps {
  selectedProvince: Province;
  cachedPlacesByProvince: Record<string, PadThaiPlace[]>;
  userLocation: { lat: number; lng: number } | null;
  onCacheProvincePlaces: (provinceId: string, places: PadThaiPlace[]) => void;
  onSelectProvince: (province: Province) => void;
  onSelectPlaceAndOpenSearch: (place: PadThaiPlace, province: Province) => void;
  onBackToMap: () => void;
}

type Thailand3DMode = 'hybrid' | 'terrain' | 'roadmap' | 'threejs';

// Pre-allocated scratch math helpers (zero GC inside animation loop)
const _mouse = new THREE.Vector2();

function projectToXZ(lng: number, lat: number): [number, number] {
  const scale = 1.35;
  const x = (lng - 101.2) * scale;
  const z = -(lat - 13.0) * scale;
  return [x, z];
}

function makeRegionShape(coords: Array<[number, number]>): THREE.Shape {
  const shape = new THREE.Shape();
  coords.forEach(([lng, lat], idx) => {
    const [x, z] = projectToXZ(lng, lat);
    const shapeY = -z;
    if (idx === 0) shape.moveTo(x, shapeY);
    else shape.lineTo(x, shapeY);
  });
  shape.closePath();
  return shape;
}

const REGION_POLYGONS: Record<RegionId, Array<[number, number]>> = {
  north: [
    [97.95, 19.65],
    [98.6, 19.95],
    [99.4, 20.15],
    [99.9, 20.46],
    [100.55, 20.3],
    [100.5, 19.5],
    [101.3, 19.35],
    [101.35, 18.45],
    [100.9, 17.7],
    [100.3, 17.35],
    [99.7, 17.55],
    [99.0, 17.75],
    [98.1, 18.05],
    [97.45, 18.55],
    [97.75, 19.2],
  ],
  northeast: [
    [101.1, 17.6],
    [101.85, 18.05],
    [102.7, 17.95],
    [103.55, 18.42],
    [104.2, 18.15],
    [104.78, 17.4],
    [104.88, 16.5],
    [105.55, 15.65],
    [105.62, 14.45],
    [104.7, 14.32],
    [103.7, 14.35],
    [102.9, 14.15],
    [101.7, 14.45],
    [101.4, 15.25],
    [101.5, 16.35],
    [101.35, 17.05],
  ],
  central: [
    [99.3, 17.25],
    [100.2, 17.4],
    [100.95, 17.15],
    [101.45, 16.6],
    [101.35, 15.4],
    [101.1, 14.4],
    [101.15, 13.75],
    [100.65, 13.48],
    [99.98, 13.38],
    [99.72, 13.95],
    [99.62, 14.95],
    [99.45, 15.85],
    [99.15, 16.6],
  ],
  east: [
    [100.85, 13.55],
    [101.18, 14.35],
    [101.9, 14.25],
    [102.85, 13.92],
    [102.55, 12.95],
    [102.92, 11.75],
    [102.35, 12.05],
    [101.45, 12.6],
    [100.88, 12.92],
  ],
  west: [
    [98.15, 17.9],
    [99.05, 17.6],
    [99.4, 16.55],
    [99.65, 15.1],
    [99.7, 13.95],
    [99.95, 13.35],
    [100.0, 12.65],
    [99.65, 11.45],
    [99.35, 10.95],
    [99.05, 11.2],
    [99.2, 12.55],
    [98.75, 13.9],
    [98.2, 15.15],
    [98.55, 16.1],
    [97.95, 17.05],
  ],
  south: [
    [98.98, 10.95],
    [99.42, 10.9],
    [99.3, 9.75],
    [99.88, 9.15],
    [100.28, 8.2],
    [100.55, 7.25],
    [101.45, 6.85],
    [102.08, 6.22],
    [101.55, 5.75],
    [100.98, 5.65],
    [100.45, 6.45],
    [99.85, 6.55],
    [99.35, 7.35],
    [98.75, 7.95],
    [98.25, 7.82],
    [98.25, 8.75],
    [98.48, 9.85],
  ],
};

const REGION_COLORS: Record<RegionId, number> = {
  north: 0xd4d4d8,
  northeast: 0xe4e4e7,
  central: 0xf4f4f5,
  east: 0xd1d5db,
  west: 0xcbd5e1,
  south: 0xe2e8f0,
};

const REGION_CAMERA_PRESETS: Record<
  RegionId | 'all',
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  all: { pos: [0, 17.5, 17.5], target: [0, 0, -0.5] },
  north: { pos: [-2.2, 10.5, 1.5], target: [-2.0, 0.4, -7.8] },
  northeast: { pos: [3.8, 11.2, 4.5], target: [3.2, 0.4, -4.5] },
  central: { pos: [-0.8, 9.5, 5.2], target: [-0.9, 0.4, -2.5] },
  east: { pos: [1.6, 8.8, 6.5], target: [1.1, 0.4, 0.2] },
  west: { pos: [-3.8, 9.5, 5.2], target: [-2.8, 0.4, -1.8] },
  south: { pos: [-2.0, 11.5, 14.5], target: [-2.0, 0.4, 6.8] },
};

const REGION_GEO_PRESETS: Record<
  RegionId | 'all',
  { center: { lat: number; lng: number }; zoom: number }
> = {
  all: { center: { lat: 13.3, lng: 101.2 }, zoom: 6 },
  north: { center: { lat: 18.8, lng: 99.3 }, zoom: 8 },
  northeast: { center: { lat: 16.2, lng: 103.3 }, zoom: 8 },
  central: { center: { lat: 14.4, lng: 100.5 }, zoom: 9 },
  east: { center: { lat: 13.1, lng: 101.6 }, zoom: 9 },
  west: { center: { lat: 14.2, lng: 99.4 }, zoom: 8 },
  south: { center: { lat: 8.3, lng: 99.8 }, zoom: 8 },
};

function matchesPriceFilter(priceLevel: string | null, filter: PriceFilterOption): boolean {
  if (filter === 'all') return true;
  if (!priceLevel) return false;
  if (filter === 'INEXPENSIVE') return priceLevel === '฿';
  if (filter === 'MODERATE') return priceLevel === '฿฿';
  if (filter === 'EXPENSIVE') return priceLevel === '฿฿฿' || priceLevel === '฿฿฿฿';
  return true;
}

function detectProvinceInQuery(query: string): Province | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  let best: Province | null = null;
  let bestLen = 0;
  for (const prov of THAILAND_PROVINCES) {
    const th = prov.nameTh.toLowerCase();
    const en = prov.nameEn.toLowerCase();
    if (q.includes(th) && th.length > bestLen) {
      best = prov;
      bestLen = th.length;
    } else if (q.includes(en) && en.length > bestLen) {
      best = prov;
      bestLen = en.length;
    }
  }
  return best;
}

function createProceduralGridTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.06)';
    ctx.lineWidth = 1;
    const step = 32;
    for (let i = 0; i <= 512; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = anisotropy;
  return tex;
}

function createTerrainRoughnessTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1800; i += 1) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const v = 175 + Math.floor(Math.random() * 65);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function Google3DLayerController({
  mapTypeId,
  showTraffic,
  tilt,
  heading,
  cameraTarget,
}: {
  mapTypeId: 'hybrid' | 'terrain' | 'roadmap';
  showTraffic: boolean;
  tilt: number;
  heading: number;
  cameraTarget: { center: { lat: number; lng: number }; zoom: number; nonce: number };
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapTypeId);
  }, [map, mapTypeId]);

  useEffect(() => {
    if (!map) return;
    map.setTilt(tilt);
    map.setHeading(heading);
  }, [map, tilt, heading]);

  useEffect(() => {
    if (!map) return;
    map.panTo(cameraTarget.center);
    map.setZoom(cameraTarget.zoom);
  }, [map, cameraTarget]);

  useEffect(() => {
    if (!map || !showTraffic) return;
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    return () => {
      trafficLayer.setMap(null);
    };
  }, [map, showTraffic]);

  return null;
}

function PlaceMarker3D({
  place,
  index,
  isSelected,
  province,
  onSelect,
  onCloseInfo,
  onOpenFullPlace,
}: {
  place: PadThaiPlace;
  index: number;
  isSelected: boolean;
  province: Province;
  onSelect: (p: PadThaiPlace) => void;
  onCloseInfo: () => void;
  onOpenFullPlace: (place: PadThaiPlace, province: Province) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [imgError, setImgError] = useState(false);

  const fallbackImg = FALLBACK_FOOD_IMAGES[index % FALLBACK_FOOD_IMAGES.length];
  const imgSrc = !imgError && place.photoUrl ? place.photoUrl : fallbackImg;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={place.location}
        zIndex={isSelected ? 70 : 35 + Math.round((place.rating ?? 3) * 5)}
        title={`${place.displayName}${place.rating !== null ? ` ★ ${place.rating.toFixed(1)}` : ''}`}
        onClick={() => onSelect(place)}
      >
        <div className="flex flex-col items-center cursor-pointer group">
          <div
            className={`px-2.5 py-1 rounded-lg border shadow-md flex items-center gap-1.5 transition-transform ${
              isSelected
                ? 'bg-neutral-950 text-white border-white scale-105 shadow-xl'
                : 'bg-white/95 text-neutral-950 border-neutral-300 group-hover:border-neutral-950 group-hover:scale-[1.03]'
            }`}
          >
            <span className="max-w-[120px] truncate text-[11px] font-semibold leading-none">
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
              isSelected ? 'bg-neutral-950 border-white' : 'bg-white/95 border-neutral-300'
            }`}
          />
        </div>
      </AdvancedMarker>

      {isSelected && marker && (
        <InfoWindow anchor={marker} maxWidth={270} onCloseClick={onCloseInfo}>
          <div className="p-1 text-neutral-950 font-sans">
            <div className="w-full h-24 rounded-lg overflow-hidden bg-neutral-100 mb-2">
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

            <div className="mt-1 flex items-center flex-wrap gap-1.5 text-xs text-neutral-600 tabular-nums">
              {place.rating !== null && (
                <span className="inline-flex items-center gap-0.5 font-semibold text-neutral-950">
                  <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" aria-hidden="true" />
                  <span>{place.rating.toFixed(1)}</span>
                  {place.userRatingCount !== null && (
                    <span className="font-normal text-neutral-500">
                      ({place.userRatingCount.toLocaleString()})
                    </span>
                  )}
                </span>
              )}
              {place.priceLevel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{place.priceLevel}</span>
                </>
              )}
              {place.isOpen !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{place.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}</span>
                </>
              )}
            </div>

            <p className="mt-1 text-xs text-neutral-500 line-clamp-2">{place.formattedAddress}</p>

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenFullPlace(place, province)}
                className="flex-1 py-1.5 px-2.5 rounded-md bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1"
              >
                <Navigation className="w-3 h-3" aria-hidden="true" />
                <span>เดินทาง & รายละเอียด</span>
              </button>
              <a
                href={place.googleMapsUri}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2.5 rounded-md border border-neutral-300 text-neutral-950 text-xs font-medium hover:border-neutral-950 transition-colors flex items-center justify-center gap-1"
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

function ThreeDThailandCanvas({
  focusedProvince,
  activeRegionFilter,
  presetTriggerNonce,
  onHoverProvince,
  onPickProvince,
  onWebglError,
}: {
  focusedProvince: Province;
  activeRegionFilter: RegionId | 'all';
  presetTriggerNonce: number;
  onHoverProvince: (p: Province | null) => void;
  onPickProvince: (p: Province) => void;
  onWebglError: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const focusedProvinceRef = useRef(focusedProvince);
  focusedProvinceRef.current = focusedProvince;
  const onHoverRef = useRef(onHoverProvince);
  onHoverRef.current = onHoverProvince;
  const onPickRef = useRef(onPickProvince);
  onPickRef.current = onPickProvince;
  const onErrorRef = useRef(onWebglError);
  onErrorRef.current = onWebglError;

  const cameraPresetRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...REGION_CAMERA_PRESETS.all.pos),
    target: new THREE.Vector3(...REGION_CAMERA_PRESETS.all.target),
  });

  const requestRenderFnRef = useRef<() => void>(() => {});

  useEffect(() => {
    const preset = REGION_CAMERA_PRESETS[activeRegionFilter];
    cameraPresetRef.current = {
      active: true,
      pos: new THREE.Vector3(...preset.pos),
      target: new THREE.Vector3(...preset.target),
    };
    requestRenderFnRef.current();
  }, [activeRegionFilter, presetTriggerNonce]);

  useEffect(() => {
    requestRenderFnRef.current();
  }, [focusedProvince.id]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      onErrorRef.current();
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const bgHex = 0xf4f4f5;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.014);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(...REGION_CAMERA_PRESETS.all.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...REGION_CAMERA_PRESETS.all.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 6;
    controls.maxDistance = 32;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minPolarAngle = 0.2;

    controls.addEventListener('start', () => {
      cameraPresetRef.current.active = false;
    });

    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x525252, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.8);
    keyLight.position.set(10, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 45;
    const d = 14;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    rimLight.position.set(-12, 8, -12);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const gridTexture = createProceduralGridTexture(maxAniso);
    const roughTexture = createTerrainRoughnessTexture();

    const mapRootGroup = new THREE.Group();
    scene.add(mapRootGroup);

    const plinthLowerGeo = new THREE.CylinderGeometry(12.2, 12.6, 0.6, 64);
    const plinthLowerMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.78,
      metalness: 0.15,
    });
    const plinthLower = new THREE.Mesh(plinthLowerGeo, plinthLowerMat);
    plinthLower.position.y = -0.35;
    plinthLower.receiveShadow = true;
    mapRootGroup.add(plinthLower);

    const bezelRingGeo = new THREE.TorusGeometry(12.0, 0.12, 16, 72);
    bezelRingGeo.rotateX(Math.PI / 2);
    const bezelRingMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      roughness: 0.25,
      metalness: 0.88,
    });
    const bezelRing = new THREE.Mesh(bezelRingGeo, bezelRingMat);
    bezelRing.position.y = 0.02;
    mapRootGroup.add(bezelRing);

    const oceanGeo = new THREE.CircleGeometry(11.9, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.85,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.position.y = 0.0;
    oceanMesh.receiveShadow = true;
    mapRootGroup.add(oceanMesh);

    const regionMeshes: Array<{ regionId: RegionId; mesh: THREE.Mesh }> = [];
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: 0.34,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 3,
    };

    const regionIds: RegionId[] = ['north', 'northeast', 'central', 'east', 'west', 'south'];
    regionIds.forEach((regionId) => {
      const shape = makeRegionShape(REGION_POLYGONS[regionId]);
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color: REGION_COLORS[regionId],
        roughness: 0.65,
        roughnessMap: roughTexture,
        metalness: 0.08,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.04;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { regionId };
      mapRootGroup.add(mesh);
      regionMeshes.push({ regionId, mesh });
    });

    const beaconHitTargets: THREE.Object3D[] = [];
    const beaconGroupList: Array<{
      province: Province;
      group: THREE.Group;
      capMat: THREE.MeshStandardMaterial;
      stemMat: THREE.MeshStandardMaterial;
    }> = [];

    const collarGeo = new THREE.CylinderGeometry(0.11, 0.14, 0.05, 16);
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.32, 10);
    const capGeo = new THREE.OctahedronGeometry(0.095, 0);
    const hitGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x262626,
      roughness: 0.5,
      metalness: 0.4,
    });

    THAILAND_PROVINCES.forEach((province) => {
      const [px, pz] = projectToXZ(province.lng, province.lat);
      const group = new THREE.Group();
      group.position.set(px, 0.44, pz);

      const stemMat = new THREE.MeshStandardMaterial({
        color: 0x404040,
        roughness: 0.3,
        metalness: 0.75,
      });
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x171717,
        roughness: 0.25,
        metalness: 0.65,
      });

      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.y = 0.025;
      group.add(collar);

      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = 0.2;
      stem.castShadow = true;
      group.add(stem);

      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.42;
      cap.castShadow = true;
      group.add(cap);

      const hitProxy = new THREE.Mesh(hitGeo, hitMat);
      hitProxy.position.y = 0.3;
      hitProxy.layers.set(1);
      hitProxy.userData = { province };
      group.add(hitProxy);
      beaconHitTargets.push(hitProxy);

      mapRootGroup.add(group);
      beaconGroupList.push({ province, group, capMat, stemMat });
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let currentHoverId: string | null = null;
    let lastRaycastMs = 0;

    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function updateSceneVisuals(dt: number): boolean {
      let needsAnotherFrame = false;

      if (cameraPresetRef.current.active) {
        const lambda = 7;
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          cameraPresetRef.current.pos.x,
          lambda,
          dt
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          cameraPresetRef.current.pos.y,
          lambda,
          dt
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          cameraPresetRef.current.pos.z,
          lambda,
          dt
        );
        controls.target.x = THREE.MathUtils.damp(
          controls.target.x,
          cameraPresetRef.current.target.x,
          lambda,
          dt
        );
        controls.target.y = THREE.MathUtils.damp(
          controls.target.y,
          cameraPresetRef.current.target.y,
          lambda,
          dt
        );
        controls.target.z = THREE.MathUtils.damp(
          controls.target.z,
          cameraPresetRef.current.target.z,
          lambda,
          dt
        );

        const dist =
          camera.position.distanceTo(cameraPresetRef.current.pos) +
          controls.target.distanceTo(cameraPresetRef.current.target);
        if (dist < 0.04) {
          camera.position.copy(cameraPresetRef.current.pos);
          controls.target.copy(cameraPresetRef.current.target);
          cameraPresetRef.current.active = false;
        } else {
          needsAnotherFrame = true;
        }
      }

      const selId = focusedProvinceRef.current.id;
      for (const item of beaconGroupList) {
        const isSel = item.province.id === selId;
        const isHov = item.province.id === currentHoverId;
        const targetScale = isSel ? 1.55 : isHov ? 1.35 : 1.0;

        item.group.scale.x = THREE.MathUtils.damp(item.group.scale.x, targetScale, 12, dt);
        item.group.scale.y = THREE.MathUtils.damp(item.group.scale.y, targetScale, 12, dt);
        item.group.scale.z = THREE.MathUtils.damp(item.group.scale.z, targetScale, 12, dt);

        if (Math.abs(item.group.scale.y - targetScale) > 0.01) {
          needsAnotherFrame = true;
        }

        if (isSel) {
          item.capMat.color.setHex(0xd97706);
          item.capMat.emissive.setHex(0x92400e);
          item.capMat.emissiveIntensity = 0.6;
        } else if (isHov) {
          item.capMat.color.setHex(0xf59e0b);
          item.capMat.emissive.setHex(0x78350f);
          item.capMat.emissiveIntensity = 0.4;
        } else {
          item.capMat.color.setHex(0x171717);
          item.capMat.emissive.setHex(0x000000);
          item.capMat.emissiveIntensity = 0;
        }
      }

      return needsAnotherFrame;
    }

    function requestRender() {
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const controlsChanged = controls.update();
        const animating = updateSceneVisuals(dt);
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty || animating || (controls.enableDamping && controlsChanged)) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    }

    requestRenderFnRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    const updateMouseCoords = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handlePointerMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastMs < 40) return;
      lastRaycastMs = now;

      updateMouseCoords(ev);
      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(beaconHitTargets, false);

      if (hits.length > 0) {
        const prov = hits[0].object.userData.province as Province;
        if (currentHoverId !== prov.id) {
          currentHoverId = prov.id;
          onHoverRef.current(prov);
          renderer.domElement.style.cursor = 'pointer';
          requestRender();
        }
      } else if (currentHoverId !== null) {
        currentHoverId = null;
        onHoverRef.current(null);
        renderer.domElement.style.cursor = 'grab';
        requestRender();
      }
    };

    let downPos = { x: 0, y: 0 };
    const handlePointerDown = (ev: PointerEvent) => {
      downPos = { x: ev.clientX, y: ev.clientY };
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const dx = ev.clientX - downPos.x;
      const dy = ev.clientY - downPos.y;
      if (dx * dx + dy * dy > 25) return;

      updateMouseCoords(ev);
      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(beaconHitTargets, false);
      if (hits.length > 0) {
        const prov = hits[0].object.userData.province as Province;
        onPickRef.current(prov);
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onErrorRef.current();
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    window.addEventListener('resize', handleResize);

    requestRender();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      controls.dispose();

      gridTexture.dispose();
      roughTexture.dispose();
      envTex.dispose();
      plinthLowerGeo.dispose();
      plinthLowerMat.dispose();
      bezelRingGeo.dispose();
      bezelRingMat.dispose();
      oceanGeo.dispose();
      oceanMat.dispose();
      collarGeo.dispose();
      collarMat.dispose();
      stemGeo.dispose();
      capGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();

      regionMeshes.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      beaconGroupList.forEach(({ capMat, stemMat }) => {
        capMat.dispose();
        stemMat.dispose();
      });

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
}

export function Thailand3DView({
  selectedProvince,
  cachedPlacesByProvince,
  userLocation,
  onCacheProvincePlaces,
  onSelectProvince,
  onSelectPlaceAndOpenSearch,
  onBackToMap,
}: Thailand3DViewProps) {
  const placesLib = useMapsLibrary('places');

  const [layerMode, setLayerMode] = useState<Thailand3DMode>('hybrid');
  const [showTraffic, setShowTraffic] = useState(false);
  const [tilt, setTilt] = useState(45);
  const [heading, setHeading] = useState(0);

  const [focusedProvince, setFocusedProvince] = useState<Province>(selectedProvince);
  const [hoveredProvince, setHoveredProvince] = useState<Province | null>(null);
  const [activeRegionFilter, setActiveRegionFilter] = useState<RegionId | 'all'>('all');
  const [presetTriggerNonce, setPresetTriggerNonce] = useState(0);
  const [cameraTarget, setCameraTarget] = useState<{
    center: { lat: number; lng: number };
    zoom: number;
    nonce: number;
  }>({
    center: REGION_GEO_PRESETS.all.center,
    zoom: REGION_GEO_PRESETS.all.zoom,
    nonce: 0,
  });

  // Search & Filters inside 3D Thailand Map
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilterOption>('all');
  const [sortMode, setSortMode] = useState<SortModeOption>('popular');
  const [custom3DResults, setCustom3DResults] = useState<PadThaiPlace[] | null>(null);
  const [isSearching3D, setIsSearching3D] = useState(false);
  const [searchError3D, setSearchError3D] = useState<string | null>(null);
  const [selectedPlace3D, setSelectedPlace3D] = useState<PadThaiPlace | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isFullscreen3D, setIsFullscreen3D] = useState(false);

  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglError, setWebglError] = useState(false);

  useEffect(() => {
    setFocusedProvince(selectedProvince);
  }, [selectedProvince]);

  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsFullscreen3D((prev) => {
          if (prev) {
            window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
            return false;
          }
          return prev;
        });
        return;
      }
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (ev.key === 'h' || ev.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load baseline places for focusedProvince if not already cached
  useEffect(() => {
    if (!placesLib || custom3DResults !== null) return;
    if (cachedPlacesByProvince[focusedProvince.id]) return;

    let cancelled = false;
    setIsSearching3D(true);
    setSearchError3D(null);

    searchPadThaiByProvince(placesLib, focusedProvince)
      .then((results) => {
        if (cancelled) return;
        onCacheProvincePlaces(focusedProvince.id, results);
      })
      .catch(() => {
        if (!cancelled) {
          setSearchError3D('ไม่สามารถโหลดรายการร้านผัดไทยในจังหวัดนี้ได้');
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching3D(false);
      });

    return () => {
      cancelled = true;
    };
  }, [placesLib, focusedProvince, cachedPlacesByProvince, custom3DResults, onCacheProvincePlaces]);

  const executeLiveSearch3D = useCallback(
    async (
      targetProvince: Province,
      queryText: string,
      nextPrice: PriceFilterOption,
      nextSort: SortModeOption
    ) => {
      if (!placesLib) return;
      setIsSearching3D(true);
      setSearchError3D(null);
      setSelectedPlace3D(null);

      try {
        const refPoint = userLocation ?? {
          lat: targetProvince.lat,
          lng: targetProvince.lng,
        };
        const results = await searchPadThaiByProvince(placesLib, targetProvince, {
          detailedQuery: queryText,
          priceFilter: nextPrice,
          rankByDistance: nextSort === 'nearest',
          biasCenter: refPoint,
        });
        setCustom3DResults(results);
        setActiveQuery(queryText);

        if (results.length > 0) {
          setCameraTarget((prev) => ({
            center: results[0].location,
            zoom: 13,
            nonce: prev.nonce + 1,
          }));
        } else {
          setCameraTarget((prev) => ({
            center: { lat: targetProvince.lat, lng: targetProvince.lng },
            zoom: 12,
            nonce: prev.nonce + 1,
          }));
        }
      } catch {
        setSearchError3D('ไม่สามารถค้นหาร้านผัดไทยตามเงื่อนไขนี้ได้');
      } finally {
        setIsSearching3D(false);
      }
    },
    [placesLib, userLocation]
  );

  const handleSearchSubmit3D = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = searchInput.trim();
    const matchedProvince = detectProvinceInQuery(raw);
    const targetProvince = matchedProvince ?? focusedProvince;

    if (matchedProvince && matchedProvince.id !== focusedProvince.id) {
      setFocusedProvince(matchedProvince);
    }

    if (!raw && priceFilter === 'all' && sortMode !== 'nearest') {
      setCustom3DResults(null);
      setActiveQuery('');
      return;
    }

    await executeLiveSearch3D(targetProvince, raw, priceFilter, sortMode);
  };

  const handleResetSearch3D = () => {
    setSearchInput('');
    setActiveQuery('');
    setPriceFilter('all');
    setCustom3DResults(null);
    setSelectedPlace3D(null);
    setSearchError3D(null);
  };

  const handlePriceFilterChange = async (nextPrice: PriceFilterOption) => {
    setPriceFilter(nextPrice);
    setSelectedPlace3D(null);
    if (activeQuery || nextPrice !== 'all') {
      await executeLiveSearch3D(focusedProvince, activeQuery, nextPrice, sortMode);
    } else if (sortMode !== 'nearest') {
      setCustom3DResults(null);
    }
  };

  const handleSortModeChange = async (nextSort: SortModeOption) => {
    setSortMode(nextSort);
    setSelectedPlace3D(null);
    if (nextSort === 'nearest' || activeQuery || priceFilter !== 'all') {
      await executeLiveSearch3D(focusedProvince, activeQuery, priceFilter, nextSort);
    } else {
      setCustom3DResults(null);
    }
  };

  const handleFocusRegion = useCallback((region: RegionId | 'all') => {
    setActiveRegionFilter(region);
    setPresetTriggerNonce((n) => n + 1);
    setSelectedPlace3D(null);
    const geo = REGION_GEO_PRESETS[region];
    setCameraTarget((prev) => ({
      center: geo.center,
      zoom: geo.zoom,
      nonce: prev.nonce + 1,
    }));
  }, []);

  const handlePickProvinceOnLayer = useCallback((prov: Province) => {
    setFocusedProvince(prov);
    setCustom3DResults(null);
    setActiveQuery('');
    setSearchInput('');
    setSelectedPlace3D(null);
    setCameraTarget((prev) => ({
      center: { lat: prov.lat, lng: prov.lng },
      zoom: 12,
      nonce: prev.nonce + 1,
    }));
  }, []);

  const handleSelectMode = (mode: Thailand3DMode) => {
    setLayerMode(mode);
    if (mode === 'threejs') {
      setShowTraffic(false);
    }
  };

  const handleToggleTraffic = () => {
    setShowTraffic((prev) => {
      const next = !prev;
      if (next && layerMode === 'threejs') {
        setLayerMode('hybrid');
      }
      if (next && cameraTarget.zoom < 9) {
        setCameraTarget((c) => ({
          center: { lat: focusedProvince.lat, lng: focusedProvince.lng },
          zoom: 12,
          nonce: c.nonce + 1,
        }));
      }
      return next;
    });
  };

  const referenceOrigin = useMemo(
    () => userLocation ?? { lat: focusedProvince.lat, lng: focusedProvince.lng },
    [userLocation, focusedProvince]
  );

  const rawResults = useMemo(
    () => custom3DResults ?? cachedPlacesByProvince[focusedProvince.id] ?? [],
    [custom3DResults, cachedPlacesByProvince, focusedProvince.id]
  );

  const filteredAndSortedPlaces = useMemo(() => {
    const filtered = rawResults.filter((place) => matchesPriceFilter(place.priceLevel, priceFilter));

    const withDistance = filtered.map((place) => ({
      place,
      distanceKm: haversineDistanceKm(referenceOrigin, place.location),
    }));

    if (sortMode === 'nearest') {
      withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortMode === 'popular') {
      withDistance.sort((a, b) => {
        const countDiff = (b.place.userRatingCount ?? 0) - (a.place.userRatingCount ?? 0);
        if (countDiff !== 0) return countDiff;
        return (b.place.rating ?? 0) - (a.place.rating ?? 0);
      });
    }

    return withDistance;
  }, [rawResults, priceFilter, sortMode, referenceOrigin]);

  const handleSelectResultItem = (place: PadThaiPlace) => {
    setSelectedPlace3D(place);
    if (layerMode === 'threejs') {
      setLayerMode('hybrid');
    }
    setCameraTarget((prev) => ({
      center: place.location,
      zoom: 16,
      nonce: prev.nonce + 1,
    }));
  };

  const visibleProvinces = useMemo(() => {
    if (activeRegionFilter === 'all') return THAILAND_PROVINCES;
    return THAILAND_PROVINCES.filter((p) => p.region === activeRegionFilter);
  }, [activeRegionFilter]);

  const activeDisplayProvince = hoveredProvince ?? focusedProvince;

  const modeOptions: Array<{
    id: Thailand3DMode;
    label: string;
    Icon: typeof Satellite;
  }> = [
    { id: 'hybrid', label: 'ดาวเทียม', Icon: Satellite },
    { id: 'terrain', label: 'ภูมิประเทศ', Icon: Mountain },
    { id: 'roadmap', label: 'แผนที่ 3D', Icon: Layers },
    { id: 'threejs', label: 'โมเดล 3D', Icon: Box },
  ];

  const priceOptions: Array<{ id: PriceFilterOption; label: string }> = [
    { id: 'all', label: 'ทุกราคา' },
    { id: 'INEXPENSIVE', label: '฿ ประหยัด' },
    { id: 'MODERATE', label: '฿฿ ปานกลาง' },
    { id: 'EXPENSIVE', label: '฿฿฿ พรีเมียม' },
  ];

  const sortOptions: Array<{ id: SortModeOption; label: string }> = [
    { id: 'popular', label: 'ฮิตมากที่สุด' },
    { id: 'nearest', label: 'ใกล้ที่สุด' },
    { id: 'relevance', label: 'แนะนำ' },
  ];

  // Note: Never apply backdrop-filter over active WebGL canvas (use solid/rgba surfaces)
  return (
    <div className="w-full h-full flex flex-col-reverse md:flex-row bg-neutral-100 overflow-hidden">
      {/* Left Interactive Search & Filter Discovery Sidebar (no overlap with map or controls) */}
      {!panelCollapsed && !isFullscreen3D && (
        <aside
          aria-label="ค้นหาและตัวกรองบนแผนที่ไทย 3 มิติ"
          className="w-full md:w-[340px] lg:w-[370px] h-[52%] md:h-full border-t md:border-t-0 md:border-r border-neutral-200 bg-white flex flex-col shrink-0 z-10 overflow-hidden"
        >
          {/* Province Header + Collapse Toggle */}
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between gap-2 shrink-0">
            <div className="min-w-0">
              <div className="text-[11px] text-neutral-500">
                {hoveredProvince ? 'กำลังชี้จังหวัด' : 'แผนที่ไทย 3 มิติ · 77 จังหวัด'}
              </div>
              <div className="text-sm font-bold text-neutral-950 truncate">
                {activeDisplayProvince.nameTh}{' '}
                <span className="font-normal text-xs text-neutral-500">
                  ({REGION_LABEL_MAP[activeDisplayProvince.region]})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setPanelCollapsed(true);
                  window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                }}
                aria-label="ย่อแผงค้นหาและตัวกรอง"
                className="w-8 h-8 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:text-neutral-950 hover:border-neutral-950 flex items-center justify-center"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBackToMap}
                title="กลับหน้าแผนที่ค้นหา"
                className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950 whitespace-nowrap flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                <span>กลับ</span>
              </button>
            </div>
          </div>

          {/* Search Box + Filters */}
          <div className="p-3.5 border-b border-neutral-100 space-y-2.5 shrink-0">
            <form onSubmit={handleSearchSubmit3D} className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="ค้นหาร้าน ย่าน หรือจังหวัด..."
                  aria-label="ค้นหาบนแผนที่ไทย 3 มิติ"
                  className="w-full h-9 pl-8 pr-7 rounded-xl border border-neutral-200 bg-neutral-50 text-xs text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:bg-white"
                />
                {(searchInput || activeQuery) && (
                  <button
                    type="button"
                    onClick={handleResetSearch3D}
                    aria-label="ล้างคำค้นหา"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-950"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching3D || !placesLib}
                className="h-9 px-3 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                ค้นหา
              </button>
            </form>

            {/* Sort Filter: ฮิตมากที่สุด | ใกล้ที่สุด | แนะนำ */}
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-neutral-500">จัดเรียงผลลัพธ์</div>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-neutral-100">
                {sortOptions.map(({ id, label }) => {
                  const active = sortMode === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSortModeChange(id)}
                      className={`py-1 px-1.5 rounded-md text-[11px] font-medium whitespace-nowrap flex items-center justify-center gap-1 transition-colors ${
                        active
                          ? 'bg-neutral-950 text-white shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      {id === 'popular' && <Flame className="w-3 h-3 shrink-0" aria-hidden="true" />}
                      {id === 'nearest' && <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />}
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Filter: ทุกราคา | ฿ | ฿฿ | ฿฿฿ */}
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-neutral-500">ช่วงราคา</div>
              <div className="grid grid-cols-4 gap-1">
                {priceOptions.map(({ id, label }) => {
                  const active = priceFilter === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handlePriceFilterChange(id)}
                      className={`py-1.5 px-1 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-colors ${
                        active
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-950'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="px-3.5 py-2 bg-neutral-50 border-b border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 tabular-nums shrink-0">
            <span className="truncate">
              {activeQuery ? `คำค้น "${activeQuery}"` : `ร้านผัดไทยใน${focusedProvince.nameTh}`}
            </span>
            <span className="font-semibold text-neutral-950 shrink-0">
              {isSearching3D ? 'กำลังค้นหา...' : `พบ ${filteredAndSortedPlaces.length} ร้าน`}
            </span>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 bg-neutral-50/40">
            {isSearching3D ? (
              <div className="p-4 text-center text-xs text-neutral-500">
                กำลังดึงข้อมูลร้านผัดไทยใน{focusedProvince.nameTh}...
              </div>
            ) : searchError3D ? (
              <div className="p-3 text-center text-xs text-neutral-600 space-y-2">
                <p>{searchError3D}</p>
                <button
                  type="button"
                  onClick={() => executeLiveSearch3D(focusedProvince, activeQuery, priceFilter, sortMode)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-950 text-white text-xs font-medium"
                >
                  ลองใหม่
                </button>
              </div>
            ) : filteredAndSortedPlaces.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500 space-y-2">
                <p>ไม่พบร้านที่ตรงกับตัวกรองราคาหรือคำค้นใน{focusedProvince.nameTh}</p>
                {(priceFilter !== 'all' || activeQuery) && (
                  <button
                    type="button"
                    onClick={handleResetSearch3D}
                    className="px-3 py-1 rounded-lg border border-neutral-300 text-neutral-950 text-[11px] font-medium hover:border-neutral-950"
                  >
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            ) : (
              filteredAndSortedPlaces.map(({ place, distanceKm }) => {
                const isSelected = selectedPlace3D?.id === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleSelectResultItem(place)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-colors space-y-1 ${
                      isSelected
                        ? 'border-neutral-950 bg-neutral-950 text-white'
                        : 'border-neutral-200 bg-white hover:border-neutral-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs font-semibold line-clamp-1 ${
                          isSelected ? 'text-white' : 'text-neutral-950'
                        }`}
                      >
                        {place.displayName}
                      </span>
                      <span
                        className={`text-[11px] tabular-nums shrink-0 ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-500'
                        }`}
                      >
                        {distanceKm < 1
                          ? `${Math.round(distanceKm * 1000)} ม.`
                          : `${distanceKm.toFixed(1)} กม.`}
                      </span>
                    </div>

                    <div
                      className={`flex items-center flex-wrap gap-1.5 text-[11px] tabular-nums ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-600'
                      }`}
                    >
                      {place.rating !== null && (
                        <span className="inline-flex items-center gap-0.5 font-semibold">
                          <span className="text-amber-500" aria-hidden="true">
                            ★
                          </span>
                          <span className={isSelected ? 'text-white' : 'text-neutral-950'}>
                            {place.rating.toFixed(1)}
                          </span>
                          {place.userRatingCount !== null && (
                            <span>({place.userRatingCount.toLocaleString()})</span>
                          )}
                        </span>
                      )}
                      {place.priceLevel && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{place.priceLevel}</span>
                        </>
                      )}
                      {place.isOpen !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{place.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}</span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Action to Open Search Map for Focused Province */}
          <div className="p-2.5 border-t border-neutral-100 bg-white shrink-0">
            <button
              type="button"
              onClick={() => onSelectProvince(focusedProvince)}
              className="w-full min-h-[36px] px-3 py-1.5 rounded-xl bg-neutral-950 text-white text-xs font-medium hover:bg-neutral-800 whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>เปิดทั้งหมดในแท็บแผนที่ค้นหา ({focusedProvince.nameTh})</span>
            </button>
          </div>
        </aside>
      )}

      {/* Right Canvas: Satellite / Terrain / 3D / Traffic Map */}
      <div
        className={
          isFullscreen3D
            ? 'fixed inset-0 z-50 bg-neutral-100'
            : 'relative flex-1 h-[48%] md:h-full min-w-0'
        }
      >
        {layerMode === 'threejs' ? (
          <ThreeDThailandCanvas
            focusedProvince={focusedProvince}
            activeRegionFilter={activeRegionFilter}
            presetTriggerNonce={presetTriggerNonce}
            onHoverProvince={setHoveredProvince}
            onPickProvince={handlePickProvinceOnLayer}
            onWebglError={() => setWebglError(true)}
          />
        ) : (
          <GoogleMap
            mapId="DEMO_MAP_ID"
            mapTypeId={layerMode}
            defaultCenter={REGION_GEO_PRESETS.all.center}
            defaultZoom={REGION_GEO_PRESETS.all.zoom}
            gestureHandling="greedy"
            clickableIcons={false}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            onClick={() => setSelectedPlace3D(null)}
            style={{ width: '100%', height: '100%' }}
          >
            <Google3DLayerController
              mapTypeId={layerMode}
              showTraffic={showTraffic}
              tilt={tilt}
              heading={heading}
              cameraTarget={cameraTarget}
            />

            {/* 77 Province Markers */}
            {visibleProvinces.map((prov) => {
              const isSel = prov.id === focusedProvince.id;
              return (
                <AdvancedMarker
                  key={prov.id}
                  position={{ lat: prov.lat, lng: prov.lng }}
                  zIndex={isSel ? 25 : 10}
                  title={`${prov.nameTh} (${REGION_LABEL_MAP[prov.region]})`}
                  onClick={() => handlePickProvinceOnLayer(prov)}
                >
                  <div
                    onMouseEnter={() => setHoveredProvince(prov)}
                    onMouseLeave={() => setHoveredProvince(null)}
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-medium cursor-pointer shadow-sm transition-transform whitespace-nowrap ${
                      isSel
                        ? 'bg-neutral-950 text-white border-white scale-105 shadow-md font-semibold'
                        : 'bg-white/95 text-neutral-950 border-neutral-300 hover:border-neutral-950 hover:scale-105'
                    }`}
                  >
                    {prov.nameTh}
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Pad Thai Restaurant Pins matching Search & Filters */}
            {filteredAndSortedPlaces.map(({ place }, idx) => (
              <PlaceMarker3D
                key={place.id}
                place={place}
                index={idx}
                isSelected={selectedPlace3D?.id === place.id}
                province={focusedProvince}
                onSelect={handleSelectResultItem}
                onCloseInfo={() => setSelectedPlace3D(null)}
                onOpenFullPlace={onSelectPlaceAndOpenSearch}
              />
            ))}
          </GoogleMap>
        )}

        {webglError && layerMode === 'threejs' && (
          <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center p-6 z-20">
            <div className="max-w-md rounded-2xl bg-white border border-neutral-200 p-6 text-center space-y-3">
              <h2 className="text-base font-bold text-neutral-950">
                ไม่สามารถเปิดโมเดล 3 มิติบนอุปกรณ์นี้ได้
              </h2>
              <p className="text-xs text-neutral-600">
                สามารถสลับไปใช้มุมมองดาวเทียมหรือภูมิประเทศของประเทศไทยแทนได้ทันที
              </p>
              <button
                type="button"
                onClick={() => setLayerMode('hybrid')}
                className="px-4 py-2 rounded-lg bg-neutral-950 text-white text-xs font-medium"
              >
                สลับเป็นแผนที่ดาวเทียม
              </button>
            </div>
          </div>
        )}

        {/* Expand Search Panel Button when collapsed */}
        {panelCollapsed && !isFullscreen3D && (
          <button
            type="button"
            onClick={() => {
              setPanelCollapsed(false);
              window.setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
            }}
            className="absolute top-3 left-3 z-10 h-9 px-3 rounded-xl bg-white/95 border border-neutral-200 shadow-md text-xs font-semibold text-neutral-950 hover:border-neutral-950 flex items-center gap-1.5"
          >
            <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            <span>ค้นหา & ตัวกรอง</span>
          </button>
        )}

        {/* Top-Right Satellite / Terrain / 3D / Live Traffic Control Bar */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5 max-w-[calc(100%-1.5rem)]">
          <div className="flex items-center flex-wrap gap-1 p-1 rounded-xl bg-white/95 border border-neutral-200 shadow-md">
            {modeOptions.map(({ id, label, Icon }) => {
              const active = layerMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectMode(id)}
                  aria-pressed={active}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}

            <div className="w-px h-5 bg-neutral-200 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={handleToggleTraffic}
              aria-pressed={showTraffic}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                showTraffic
                  ? 'bg-amber-600 text-white'
                  : 'text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              <TrafficCone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>การจราจรสด</span>
            </button>

            <div className="w-px h-5 bg-neutral-200 mx-0.5" aria-hidden="true" />

            <button
              type="button"
              onClick={() => {
                setIsFullscreen3D((prev) => !prev);
                window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
              }}
              aria-pressed={isFullscreen3D}
              aria-label={isFullscreen3D ? 'หดแผนที่กลับขนาดปกติ' : 'ขยายแผนที่เต็มจอ'}
              title={isFullscreen3D ? 'หดกลับ (Esc)' : 'ขยายเต็มจอ'}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                isFullscreen3D
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              {isFullscreen3D ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>หดกลับ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>เต็มจอ</span>
                </>
              )}
            </button>
          </div>

          {/* Camera Tilt / Rotation Controls for 3D Perspective on Google Maps */}
          {layerMode !== 'threejs' && (
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/95 border border-neutral-200 shadow-sm text-[11px]">
                <button
                  type="button"
                  onClick={() => setTilt((t) => (t === 0 ? 45 : 0))}
                  className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1 whitespace-nowrap ${
                    tilt > 0 ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                  title="สลับมุมกล้องเอียง 3 มิติ"
                >
                  <Compass className="w-3 h-3" aria-hidden="true" />
                  <span>{tilt > 0 ? 'เอียง 45°' : 'มุมมองบน 0°'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeading((h) => (h - 45 + 360) % 360)}
                  aria-label="หมุนมุมกล้องทวนเข็มนาฬิกา"
                  className="p-1 rounded-lg text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                  title="หมุนซ้าย 45°"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setHeading((h) => (h + 45) % 360)}
                  aria-label="หมุนมุมกล้องตามเข็มนาฬิกา"
                  className="p-1 rounded-lg text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                  title="หมุนขวา 45°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {showTraffic && (
                <div className="px-2.5 py-1.5 rounded-xl bg-white/95 border border-neutral-200 shadow-sm text-[11px] text-neutral-700 flex items-center gap-2 whitespace-nowrap">
                  <span className="font-medium text-neutral-950">จราจร:</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    คล่องตัว
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
                    ชะลอตัว
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-600" aria-hidden="true" />
                    ติดขัด
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsible Unified Bottom Control Dock inside Map Canvas */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[min(780px,calc(100%-1.5rem))] flex flex-col items-center pointer-events-none">
          <button
            type="button"
            onClick={() => setDockCollapsed((prev) => !prev)}
            className="pointer-events-auto mb-1.5 px-3 py-1 rounded-full bg-white/95 border border-neutral-200 shadow-sm text-[11px] font-medium text-neutral-700 hover:text-neutral-950 flex items-center gap-1"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>แสดงแถบภาค (H)</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>ซ่อนแถบภาค (H)</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="pointer-events-auto w-full rounded-2xl bg-white/95 border border-neutral-200 shadow-lg px-2.5 py-2 flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleFocusRegion('all')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeRegionFilter === 'all'
                      ? 'bg-neutral-950 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:text-neutral-950'
                  }`}
                >
                  ทุกภาค (77)
                </button>
                {REGIONS.map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => handleFocusRegion(reg.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeRegionFilter === reg.id
                        ? 'bg-neutral-950 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:text-neutral-950'
                    }`}
                  >
                    {reg.labelTh}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setHeading(0);
                    handleFocusRegion('all');
                  }}
                  title="รีเซ็ตมุมมองทั้งประเทศ"
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-neutral-950 hover:text-neutral-950 flex items-center gap-1 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>รีเซ็ต</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

