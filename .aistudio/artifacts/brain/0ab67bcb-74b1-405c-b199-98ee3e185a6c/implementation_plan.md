# PadThai 77 — แผนผังการพัฒนาเว็บแอปค้นหาร้านผัดไทยทั่วไทย 77 จังหวัด

เว็บแอปพลิเคชันค้นหาร้านผัดไทยทั่วประเทศไทยครบทั้ง 77 จังหวัดบน Google Maps ในสไตล์มินิมอลขาวดำที่เน้นแผนที่และภาพอาหารให้โดดเด่น พร้อมแผนที่ประเทศไทย 3 มิติ (Three.js) สำหรับเลือกภาคและจังหวัด ระบบสุ่มร้านเด็ด บันทึกร้านโปรด ดูเส้นทาง และแชร์ร้านให้เพื่อนได้ทันที

---

## User Review & Critical Decisions

> [!IMPORTANT] การตัดสินใจทั้งหมดด้านล่างอ้างอิงจากคำตอบของคุณในขั้นตอนที่ผ่านมา หากเห็นด้วยสามารถกดอนุมัติเพื่อเริ่มพัฒนาได้ทันที

- **Confirmed Decision 1 — โทนมินิมอลขาวดำ (Monochrome Editorial)**: ใช้พื้นหลังสีขาวสะอาด (`#FFFFFF` / `#FAFAFA`) ตัดกับตัวอักษรและปุ่มหลักสีดำเข้ม (`#0A0A0A`) เส้นแบ่งบางเฉียบ (`#E5E5E5`) และใช้สีทองมะขาม (`#D97706`) เฉพาะจุดสำคัญอย่างคะแนนดาวและหมุดร้านที่ถูกเลือก เพื่อขับให้แผนที่ Google Maps และภาพถ่ายผัดไทยโดดเด่นที่สุด
- **Confirmed Decision 2 — แผนที่ประเทศไทย 3 มิติ (Three.js)**: สร้างฉาก 3 มิติของประเทศไทยแบ่งตามภูมิภาคและหมุด 77 จังหวัด ให้ผู้ใช้หมุนดู กดเลือกภาค/จังหวัดเพื่อเชื่อมต่อไปยังผลการค้นหาบน Google Maps ได้โดยตรง
- **Confirmed Decision 3 — ฟีเจอร์ครบเครื่องสำหรับ Gen Z**: รองรับการกรอง 77 จังหวัด + คะแนนดาว + สถานะเปิดอยู่ตอนนี้, ปุ่มสุ่มร้านผัดไทยเด็ดประจำจังหวัด, การแสดงเส้นทางบน Google Maps และแชร์ลิงก์ร้านให้เพื่อน, รวมถึงรายการบันทึกร้านโปรดส่วนตัว
- **Confirmed Decision 4 — เปิดแอปเข้าสู่ Google Maps ทันที**: หน้าแรกจะเข้าสู่พื้นที่ค้นหาบนแผนที่ Google Maps พร้อมตัวเลือก 77 จังหวัดทันทีโดยไม่ผ่านหน้าคั่น และสามารถสลับเข้าสู่โหมดแผนที่ไทย 3 มิติได้จากแถบนำทางด้านบน

---

## 1. Overview & Core Concept

- **What It Does**: แอปค้นหาร้านผัดไทยที่ใช้ข้อมูลสถานที่จริงจาก Google Maps Platform ครอบคลุมจุดศูนย์กลางครบทั้ง 77 จังหวัดของประเทศไทย โดยหมุดที่ปักบนแผนที่จะแสดง **ชื่อร้านและคะแนนดาว** ให้เห็นชัดเจนทันที พร้อมรายการร้านอาหารทางด้านซ้าย รูปภาพ เวลาเปิด-ปิด เส้นทาง และเครื่องมือช่วยตัดสินใจสำหรับสายกิน
- **Target Audience / Persona**: ผู้ใช้งาน Gen Z ในประเทศไทยที่ต้องการค้นหาร้านผัดไทยอร่อยๆ ทั้งใกล้ตัวและเวลาเดินทางข้ามจังหวัด ต้องการความรวดเร็ว อ่านง่าย ภาพชัด ไม่รก และแชร์ต่อในกลุ่มเพื่อนได้ในคลิกเดียว
- **Key Value**: รวมพลังของแผนที่ Google Maps ที่แม่นยำ เข้ากับความสนุกในการสำรวจ 77 จังหวัดผ่านแผนที่ไทย 3 มิติ และฟีเจอร์สุ่มร้านเด็ดเมื่อคิดไม่ออก

---

## 2. User Experience & Visual Design

### Key User Flows

1. **ค้นหาทันทีเมื่อเปิดเว็บ (Map-First Entry)**:
   - ผู้ใช้เห็นแผนที่ Google Maps ฝั่งขวาและแผงค้นหา 77 จังหวัดฝั่งซ้าย (บนมือถือเป็นแผนที่ด้านบนและแผ่นรายการแบบเลื่อนด้านล่าง)
   - ระบบค้นหาร้านผัดไทยในจังหวัดตั้งต้น (กรุงเทพมหานคร หรือใช้ตำแหน่ง GPS ปัจจุบันเมื่อกดปุ่ม `ใกล้ฉัน`) แล้วปักหมุดแบบกำหนดเองที่แสดงชื่อร้านและคะแนนดาวบนแผนที่ทันที
2. **เลือก 77 จังหวัดผ่านตัวกรอง หรือ แผนที่ไทย 3 มิติ**:
   - พิมพ์ค้นหาชื่อจังหวัด/เลือกตาม 6 ภูมิภาค หรือกดปุ่ม `แผนที่ไทย 3 มิติ` เพื่อหมุนดูโมเดลประเทศไทย 3 มิติ แล้วคลิกหมุดจังหวัดที่ต้องการเพื่อกระโดดกลับมาค้นหาร้านในจังหวัดนั้นบน Google Maps
3. **กรองและสุ่มร้านเด็ด (Filter & Randomizer)**:
   - กดกรองคะแนนดาว (`ทั้งหมด`, `4.0+`, `4.5+`) และสวิตช์ `เปิดอยู่ตอนนี้`
   - หากเลือกไม่ถูก กดปุ่ม `สุ่มร้านเด็ด` เพื่อสุ่มร้านผัดไทยคะแนนดีในจังหวัดนั้น พร้อมเลื่อนกล้องแผนที่ไปโฟกัสที่หมุดและเปิดการ์ดรายละเอียดร้าน
4. **ดูรายละเอียด นำทาง บันทึก และแชร์**:
   - คลิกหมุดบนแผนที่หรือการ์ดร้านเพื่อดูภาพถ่าย ชื่อร้าน คะแนนดาว จำนวนรีวิว ที่อยู่ เวลาเปิดทำการ คำนวณเส้นทางในแอป (เมื่อเปิด GPS) หรือกดเปิดในแอป Google Maps, บันทึกลง `ร้านโปรด`, และกด `แชร์` ให้เพื่อน

### Visual Identity & Theme

- **Aesthetic Direction**: Minimalist Monochrome Editorial — เน้นโครงสร้างที่ชัดเจนตามกฎ Visual Hierarchy 10 ข้อ ตัดสิ่งรบกวนสายตา (Zero AI Slop: ไม่มีกล่องแคปซูล/ป้าย Pill รอบข้อมูล Metadata ไม่มีจุดกระพริบสถานะ ไม่มีตัวเลขคะแนนสังเคราะห์)
- **Color Palette & Mood (60-30-10)**:
  - *60% Neutral Canvas*: `--background: #FFFFFF` และพื้นผิวรอง `#FAFAFA`
  - *30% Structural Surfaces*: เส้นขอบบาง `#E5E5E5`, ข้อความรอง `#525252` และ `#737373`
  - *10% High-Intent Accent*: สีดำสนิท `--primary: #0A0A0A` สำหรับปุ่มหลัก/สถานะ Active และสีทองมะขาม `--accent: #D97706` เฉพาะดาวคะแนนและหมุดร้านที่ถูกเลือก
- **Typography & Hierarchy**:
  - จับคู่ฟอนต์ไทย-อังกฤษที่อ่านคมชัดและมีบุคลิกสมัยใหม่: `Prompt` หรือ `Plus Jakarta Sans` + `Noto Sans Thai` สำหรับหัวข้อและชื่อร้าน, และใช้ `tabular-nums` (`JetBrains Mono` / `tabular-nums`) สำหรับคะแนนดาว ระยะทาง และจำนวนรีวิวเพื่อให้ตัวเลขเรียงแนวตั้งตรงกันสวยงาม
- **Layout & Top Bar Contract**:
  - แถบด้านบน 1 แถว 3 โซน: `[ชื่อแบรนด์ PADTHAI 77]` — `[ลิงก์นำทาง 4 รายการ: แผนที่ค้นหา · แผนที่ไทย 3 มิติ · สุ่มร้านเด็ด · ร้านโปรด]` — `[ปุ่มหลัก: ใกล้ฉัน]`
  - พื้นที่แผนที่ 3 มิติ (Three.js) แสดงผลเต็มพื้นที่ พร้อมแถบควบคุมแบบพับเก็บได้ด้านล่าง (ใช้พื้นที่ไม่เกิน 15% ของหน้าจอและไม่ใช้ `backdrop-filter` ทับ WebGL)

### Interactive Feedback & Motion

- ตอบสนองการคลิกและ Hover ภายใน `<= 200ms` ด้วย `cubic-bezier(0.16, 1, 0.3, 1)` เฉพาะคุณสมบัติ `transform` และ `opacity`
- มีสถานะ Loading (Skeleton การ์ดร้านอาหาร), Empty State (แนะนำปรับตัวกรองเมื่อไม่พบร้านที่เปิดอยู่), Error Boundary และ Toast แจ้งเตือนเมื่อคัดลอกลิงก์แชร์หรือบันทึกร้านโปรด

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: การค้นหาร้านผัดไทยจาก Google Places API (New) ผ่าน Maps JS SDK**
  - *Chosen Approach*: ใช้ `Place.searchByText()` ผ่าน `useMapsLibrary('places')` ของ `@vis.gl/react-google-maps` โดยส่งคำค้นหา `"ผัดไทย <ชื่อจังหวัด>"` พร้อม `locationBias` พิกัดของจังหวัดนั้น และขอเฉพาะฟิลด์ที่จำเป็น (`id`, `displayName`, `formattedAddress`, `location`, `rating`, `userRatingCount`, `regularOpeningHours`, `photos`, `googleMapsURI`, `priceLevel`)
  - *Why*: หลีกเลี่ยงปัญหา CORS ของการเรียก REST API จากฝั่งเบราว์เซอร์โดยตรง ได้ข้อมูลร้าน ชื่อ คะแนน รูปภาพ และลิงก์ Google Maps จริงตามนโยบาย ToS และประหยัดโควตา API ต่อครั้ง
  - *Alternatives Considered*: การสร้างฐานข้อมูลจำลองหรือเรียก REST API จากฝั่งเบราว์เซอร์ ซึ่งไม่ตรงกับข้อมูลจริงและติดข้อจำกัด CORS

- **Decision 2: รูปแบบการแสดงผลหมุดปัก (Pinned Marker Details)**
  - *Chosen Approach*: ใช้ `<AdvancedMarker>` ที่มีคอมโพเนนต์การ์ดหมุดแบบมินิมอลแสดง **ชื่อร้าน + คะแนนดาว (เช่น ★ 4.7)** บนตัวหมุดโดยตรง และเมื่อคลิกหมุดจะเปิด `<InfoWindow>` พร้อมรายละเอียดครบถ้วนและเชื่อมกับแผงรายละเอียดร้าน
  - *Why*: ผู้ใช้กวาดสายตาบนแผนที่แล้วเห็นชื่อร้านและเรตติ้งทันทีตามโจทย์ โดยยังคงความสะอาดตาและปรับสีหมุดที่เลือกให้เด่นชัด
  - *Alternatives Considered*: ใช้หมุดกลมธรรมดาที่ต้องคลิกทีละอันถึงจะเห็นชื่อร้าน ซึ่งทำให้เปรียบเทียบร้านบนแผนที่ได้ช้ากว่า

- **Decision 3: การออกแบบแผนที่ประเทศไทย 3 มิติ (Three.js) แบบ Procedural**
  - *Chosen Approach*: สร้างโมเดล 3 มิติของประเทศไทยแบ่งเป็นกลุ่มภูมิภาค 6 ส่วน (เหนือ, กลาง, อีสาน, ตะวันออก, ตะวันตก, ใต้) ด้วย `ExtrudeGeometry` แบบมีขอบเอียง (Bevel) พร้อมพื้นผิวและแสงสตูดิโอ (`RoomEnvironment`, Key/Fill Light, Contact Shadow) และหมุดจังหวัด 77 จุดที่ใช้ Raycasting สำหรับชี้และคลิก พร้อม `OrbitControls` ที่ปรับความนุ่มนวลด้วย Exponential Damping
  - *Why*: ไม่ต้องพึ่งไฟล์โมเดล `.glb` หรือภาพพื้นผิวภายนอกที่เสี่ยง 404 โหลดไว 60fps และเชื่อมสถานะจังหวัดระหว่าง 3 มิติกับ Google Maps ได้ทันที
  - *Alternatives Considered*: โหลดไฟล์โมเดล 3 มิติภายนอกหรือเรนเดอร์แค่กล่องสี่เหลี่ยมธรรมดา

- **Decision 4: การจัดเก็บร้านโปรด (Favorites Persistence) ตามข้อกำหนด Google Maps ToS**
  - *Chosen Approach*: จัดเก็บเฉพาะรายการ `placeId` และรหัสจังหวัดใน `localStorage` แล้วดึงข้อมูลล่าสุดจาก Session Cache หรือ `Place.fetchFields()` เมื่อเปิดรายการโปรด
  - *Why*: ปฏิบัติตามเงื่อนไขการแคชข้อมูลของ Google Maps Platform Terms of Service อย่างเคร่งครัด

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         App Shell & Quota Guard                         │
│  [Global Error/Quota Banner]   [Top Bar: Brand | Views | Near Me CTA]   │
└───────────────┬─────────────────────────────────────────┬───────────────┘
                │                                         │
                ▼ (Active View: "map")                    ▼ (Active View: "3d")
┌───────────────────────────────────────┐   ┌─────────────────────────────┐
│     Google Maps Discovery Workspace   │   │  Three.js Thailand 3D View  │
│  ┌──────────────┐  ┌───────────────┐  │   │  - 6 Extruded Regions       │
│  │ Left Rail /  │  │  <Map> +      │  │   │  - 77 Province Beacons      │
│  │ Bottom Sheet │  │  <AdvMarker>  │  │   │  - Raycaster Hover/Click    │
│  │ - 77 Prov.   │◄─┤  (Name+Rating)│  │   │  - Collapsible Bottom Dock  │
│  │ - Filters    │  │  <InfoWindow> │  │   └──────────────┬──────────────┘
│  │ - Randomizer │  │  Route Layer  │  │                  │
│  │ - List Cards │  └───────┬───────┘  │                  │ (Select Province)
│  └──────┬───────┘          │          │                  │
└─────────┼──────────────────┼──────────┴──────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Services & Static Province Registry                 │
│  - 77 Provinces Catalog (Thai/EN Names, Region, Lat/Lng Bounds)         │
│  - Places SDK Service: Place.searchByText() & Place.fetchFields()       │
│  - Routes SDK Service: Route.computeRoutes() (In-app Directions)        │
│  - Favorites Store (placeId list in localStorage) + Web Share Helper    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **Province Catalog (77 Provinces)**: ข้อมูลคงที่ของทั้ง 77 จังหวัด ประกอบด้วย `id`, `nameTh`, `nameEn`, `region` (`north` | `northeast` | `central` | `east` | `west` | `south`), `center` (`{ lat, lng }`), และตำแหน่งพิกัดบนแผนที่ 3 มิติ
- **PadThaiPlace**: ข้อมูลร้านอาหารที่ได้จาก Google Places API (New) เท่านั้น (`id`, `displayName`, `formattedAddress`, `location`, `rating`, `userRatingCount`, `isOpen`, `openingHoursText`, `photoUrl`, `googleMapsUri`, `priceLevel`)
- **App State**: `activeView` (`'map' | '3d' | 'favorites'`), `selectedProvince`, `filterMinRating`, `filterOpenNow`, `userLocation`, `places`, `selectedPlaceId`, `activeRoutePolyline`, `favoritePlaceIds`, `isLoading`, `quotaExceeded`

### Interactive Component & State Mapping

- **Province Selector & 3D Map**: เมื่อผู้ใช้คลิกจังหวัดในแผงค้นหาหรือหมุดจังหวัดบนแผนที่ไทย 3 มิติ -> อัปเดต `selectedProvince`, สลับกลับเป็นมุมมองแผนที่ (หากมาจาก 3 มิติ), ย้ายกล้อง Google Map ไปยังพิกัดจังหวัดนั้น และเรียก `Place.searchByText` (แคชผลลัพธ์ใน Session ชั่วคราวเพื่อลดการยิงซ้ำ)
- **Filter Bar & Randomizer**: การเปลี่ยน `minRating` หรือ `openNow` จะกรองรายการใน UI และหมุดบนแผนที่ทันที ปุ่ม `สุ่มร้านเด็ด` จะสุ่ม 1 ร้านจากผลลัพธ์ที่ผ่านตัวกรอง เลื่อนกล้องไปที่ร้านนั้น และเปิด `<InfoWindow>`
- **Map Pins & Place Detail**: คลิก `<AdvancedMarker>` หรือการ์ดร้าน -> ตั้งค่า `selectedPlaceId`, เปิด `<InfoWindow>` และแผงรายละเอียดพร้อมปุ่ม `ดูเส้นทาง` (เรียก `Route.computeRoutes` หากมี `userLocation` หรือเปิดลิงก์ Google Maps), `แชร์ร้าน` (Web Share / Copy Link), และ `บันทึกโปรด`
- **Quota & Error Defense**: ติดตั้ง Global Listener ในจุดเริ่มต้นแอป (`gm_authFailure`, `OverQuotaMapError`, `OVER_QUERY_LIMIT`, HTTP `429` / `RESOURCE_EXHAUSTED`) เพื่อแสดงแถบแจ้งเตือนมาตรฐานที่ด้านบนโดยไม่บังหน้าจอแอป

### Key Sequences & Integrations

- **Google Maps Platform SDKs**: `@vis.gl/react-google-maps` (`<APIProvider language="th" region="TH">`, `<Map mapId="DEMO_MAP_ID" internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}>`, `<AdvancedMarker>`, `<InfoWindow>`), `places` library (`Place.searchByText`), และ `routes` library (`Route.computeRoutes`).
- **3D Engine**: `three` + `OrbitControls` + `RoomEnvironment` บน `<canvas>` แยกจาก React UI ด้วย `useRef` เพื่อความลื่นไหล 60fps และรองรับ Software WebGL อย่างปลอดภัย
