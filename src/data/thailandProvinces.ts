import type { Province, RegionId } from '../types/padthai';

export const REGIONS: Array<{ id: RegionId; labelTh: string; labelEn: string }> = [
  { id: 'central', labelTh: 'ภาคกลาง', labelEn: 'Central' },
  { id: 'north', labelTh: 'ภาคเหนือ', labelEn: 'North' },
  { id: 'northeast', labelTh: 'ภาคอีสาน', labelEn: 'Northeast' },
  { id: 'east', labelTh: 'ภาคตะวันออก', labelEn: 'East' },
  { id: 'west', labelTh: 'ภาคตะวันตก', labelEn: 'West' },
  { id: 'south', labelTh: 'ภาคใต้', labelEn: 'South' },
];

export const REGION_LABEL_MAP: Record<RegionId, string> = {
  central: 'ภาคกลาง',
  north: 'ภาคเหนือ',
  northeast: 'ภาคอีสาน',
  east: 'ภาคตะวันออก',
  west: 'ภาคตะวันตก',
  south: 'ภาคใต้',
};

export const THAILAND_PROVINCES: Province[] = [
  // 1. ภาคกลาง (Central - 22 provinces)
  { id: 'bangkok', nameTh: 'กรุงเทพมหานคร', nameEn: 'Bangkok', region: 'central', lat: 13.7563, lng: 100.5018 },
  { id: 'nonthaburi', nameTh: 'นนทบุรี', nameEn: 'Nonthaburi', region: 'central', lat: 13.8591, lng: 100.5217 },
  { id: 'pathum-thani', nameTh: 'ปทุมธานี', nameEn: 'Pathum Thani', region: 'central', lat: 14.0208, lng: 100.5250 },
  { id: 'samut-prakan', nameTh: 'สมุทรปราการ', nameEn: 'Samut Prakan', region: 'central', lat: 13.5991, lng: 100.5998 },
  { id: 'samut-sakhon', nameTh: 'สมุทรสาคร', nameEn: 'Samut Sakhon', region: 'central', lat: 13.5475, lng: 100.2744 },
  { id: 'samut-songkhram', nameTh: 'สมุทรสงคราม', nameEn: 'Samut Songkhram', region: 'central', lat: 13.4098, lng: 100.0023 },
  { id: 'nakhon-pathom', nameTh: 'นครปฐม', nameEn: 'Nakhon Pathom', region: 'central', lat: 13.8196, lng: 100.0621 },
  { id: 'ayutthaya', nameTh: 'พระนครศรีอยุธยา', nameEn: 'Phra Nakhon Si Ayutthaya', region: 'central', lat: 14.3532, lng: 100.5689 },
  { id: 'ang-thong', nameTh: 'อ่างทอง', nameEn: 'Ang Thong', region: 'central', lat: 14.5896, lng: 100.4550 },
  { id: 'lopburi', nameTh: 'ลพบุรี', nameEn: 'Lopburi', region: 'central', lat: 14.7995, lng: 100.6534 },
  { id: 'sing-buri', nameTh: 'สิงห์บุรี', nameEn: 'Sing Buri', region: 'central', lat: 14.8936, lng: 100.3967 },
  { id: 'chai-nat', nameTh: 'ชัยนาท', nameEn: 'Chai Nat', region: 'central', lat: 15.1852, lng: 100.1251 },
  { id: 'saraburi', nameTh: 'สระบุรี', nameEn: 'Saraburi', region: 'central', lat: 14.5289, lng: 100.9101 },
  { id: 'nakhon-nayok', nameTh: 'นครนายก', nameEn: 'Nakhon Nayok', region: 'central', lat: 14.2069, lng: 101.2131 },
  { id: 'suphan-buri', nameTh: 'สุพรรณบุรี', nameEn: 'Suphan Buri', region: 'central', lat: 14.4745, lng: 100.1177 },
  { id: 'kamphaeng-phet', nameTh: 'กำแพงเพชร', nameEn: 'Kamphaeng Phet', region: 'central', lat: 16.4828, lng: 99.5227 },
  { id: 'phichit', nameTh: 'พิจิตร', nameEn: 'Phichit', region: 'central', lat: 16.4429, lng: 100.3488 },
  { id: 'phitsanulok', nameTh: 'พิษณุโลก', nameEn: 'Phitsanulok', region: 'central', lat: 16.8211, lng: 100.2659 },
  { id: 'phetchabun', nameTh: 'เพชรบูรณ์', nameEn: 'Phetchabun', region: 'central', lat: 16.4190, lng: 101.1563 },
  { id: 'sukhothai', nameTh: 'สุโขทัย', nameEn: 'Sukhothai', region: 'central', lat: 17.0078, lng: 99.8230 },
  { id: 'nakhon-sawan', nameTh: 'นครสวรรค์', nameEn: 'Nakhon Sawan', region: 'central', lat: 15.7047, lng: 100.1372 },
  { id: 'uthai-thani', nameTh: 'อุทัยธานี', nameEn: 'Uthai Thani', region: 'central', lat: 15.3835, lng: 100.0246 },

  // 2. ภาคเหนือ (North - 9 provinces)
  { id: 'chiang-mai', nameTh: 'เชียงใหม่', nameEn: 'Chiang Mai', region: 'north', lat: 18.7883, lng: 98.9853 },
  { id: 'chiang-rai', nameTh: 'เชียงราย', nameEn: 'Chiang Rai', region: 'north', lat: 19.9105, lng: 99.8406 },
  { id: 'lamphun', nameTh: 'ลำพูน', nameEn: 'Lamphun', region: 'north', lat: 18.5745, lng: 99.0087 },
  { id: 'lampang', nameTh: 'ลำปาง', nameEn: 'Lampang', region: 'north', lat: 18.2888, lng: 99.4908 },
  { id: 'phrae', nameTh: 'แพร่', nameEn: 'Phrae', region: 'north', lat: 18.1446, lng: 100.1403 },
  { id: 'nan', nameTh: 'น่าน', nameEn: 'Nan', region: 'north', lat: 18.7756, lng: 100.7730 },
  { id: 'phayao', nameTh: 'พะเยา', nameEn: 'Phayao', region: 'north', lat: 19.1665, lng: 99.9019 },
  { id: 'mae-hong-son', nameTh: 'แม่ฮ่องสอน', nameEn: 'Mae Hong Son', region: 'north', lat: 19.3020, lng: 97.9654 },
  { id: 'uttaradit', nameTh: 'อุตรดิตถ์', nameEn: 'Uttaradit', region: 'north', lat: 17.6201, lng: 100.0993 },

  // 3. ภาคตะวันออกเฉียงเหนือ / อีสาน (Northeast - 20 provinces)
  { id: 'nakhon-ratchasima', nameTh: 'นครราชสีมา', nameEn: 'Nakhon Ratchasima', region: 'northeast', lat: 14.9799, lng: 102.0978 },
  { id: 'buri-ram', nameTh: 'บุรีรัมย์', nameEn: 'Buri Ram', region: 'northeast', lat: 14.9930, lng: 103.1029 },
  { id: 'surin', nameTh: 'สุรินทร์', nameEn: 'Surin', region: 'northeast', lat: 14.8829, lng: 103.4937 },
  { id: 'si-sa-ket', nameTh: 'ศรีสะเกษ', nameEn: 'Si Sa Ket', region: 'northeast', lat: 15.1186, lng: 104.3220 },
  { id: 'ubon-ratchathani', nameTh: 'อุบลราชธานี', nameEn: 'Ubon Ratchathani', region: 'northeast', lat: 15.2448, lng: 104.8473 },
  { id: 'yasothon', nameTh: 'ยโสธร', nameEn: 'Yasothon', region: 'northeast', lat: 15.7926, lng: 104.1453 },
  { id: 'chaiyaphum', nameTh: 'ชัยภูมิ', nameEn: 'Chaiyaphum', region: 'northeast', lat: 15.8068, lng: 102.0315 },
  { id: 'amnat-charoen', nameTh: 'อำนาจเจริญ', nameEn: 'Amnat Charoen', region: 'northeast', lat: 15.8657, lng: 104.6258 },
  { id: 'bueng-kan', nameTh: 'บึงกาฬ', nameEn: 'Bueng Kan', region: 'northeast', lat: 18.3609, lng: 103.6464 },
  { id: 'nong-bua-lamphu', nameTh: 'หนองบัวลำภู', nameEn: 'Nong Bua Lamphu', region: 'northeast', lat: 17.2218, lng: 102.4260 },
  { id: 'khon-kaen', nameTh: 'ขอนแก่น', nameEn: 'Khon Kaen', region: 'northeast', lat: 16.4322, lng: 102.8236 },
  { id: 'udon-thani', nameTh: 'อุดรธานี', nameEn: 'Udon Thani', region: 'northeast', lat: 17.4138, lng: 102.7872 },
  { id: 'loei', nameTh: 'เลย', nameEn: 'Loei', region: 'northeast', lat: 17.4860, lng: 101.7223 },
  { id: 'nong-khai', nameTh: 'หนองคาย', nameEn: 'Nong Khai', region: 'northeast', lat: 17.8783, lng: 102.7413 },
  { id: 'maha-sarakham', nameTh: 'มหาสารคาม', nameEn: 'Maha Sarakham', region: 'northeast', lat: 16.1851, lng: 103.3026 },
  { id: 'roi-et', nameTh: 'ร้อยเอ็ด', nameEn: 'Roi Et', region: 'northeast', lat: 16.0538, lng: 103.6520 },
  { id: 'kalasin', nameTh: 'กาฬสินธุ์', nameEn: 'Kalasin', region: 'northeast', lat: 16.4314, lng: 103.5059 },
  { id: 'sakon-nakhon', nameTh: 'สกลนคร', nameEn: 'Sakon Nakhon', region: 'northeast', lat: 17.1546, lng: 104.1348 },
  { id: 'nakhon-phanom', nameTh: 'นครพนม', nameEn: 'Nakhon Phanom', region: 'northeast', lat: 17.3920, lng: 104.7696 },
  { id: 'mukdahan', nameTh: 'มุกดาหาร', nameEn: 'Mukdahan', region: 'northeast', lat: 16.5425, lng: 104.7209 },

  // 4. ภาคตะวันออก (East - 7 provinces)
  { id: 'chon-buri', nameTh: 'ชลบุรี', nameEn: 'Chon Buri', region: 'east', lat: 13.3611, lng: 100.9847 },
  { id: 'rayong', nameTh: 'ระยอง', nameEn: 'Rayong', region: 'east', lat: 12.6814, lng: 101.2816 },
  { id: 'chanthaburi', nameTh: 'จันทบุรี', nameEn: 'Chanthaburi', region: 'east', lat: 12.6114, lng: 102.1039 },
  { id: 'trat', nameTh: 'ตราด', nameEn: 'Trat', region: 'east', lat: 12.2428, lng: 102.5175 },
  { id: 'chachoengsao', nameTh: 'ฉะเชิงเทรา', nameEn: 'Chachoengsao', region: 'east', lat: 13.6904, lng: 101.0779 },
  { id: 'prachin-buri', nameTh: 'ปราจีนบุรี', nameEn: 'Prachin Buri', region: 'east', lat: 14.0509, lng: 101.3727 },
  { id: 'sa-kaeo', nameTh: 'สระแก้ว', nameEn: 'Sa Kaeo', region: 'east', lat: 13.8240, lng: 102.0646 },

  // 5. ภาคตะวันตก (West - 5 provinces)
  { id: 'kanchanaburi', nameTh: 'กาญจนบุรี', nameEn: 'Kanchanaburi', region: 'west', lat: 14.0228, lng: 99.5328 },
  { id: 'tak', nameTh: 'ตาก', nameEn: 'Tak', region: 'west', lat: 16.8840, lng: 99.1259 },
  { id: 'ratchaburi', nameTh: 'ราชบุรี', nameEn: 'Ratchaburi', region: 'west', lat: 13.5283, lng: 99.8134 },
  { id: 'phetchaburi', nameTh: 'เพชรบุรี', nameEn: 'Phetchaburi', region: 'west', lat: 13.1119, lng: 99.9398 },
  { id: 'prachuap-khiri-khan', nameTh: 'ประจวบคีรีขันธ์', nameEn: 'Prachuap Khiri Khan', region: 'west', lat: 11.8124, lng: 99.7973 },

  // 6. ภาคใต้ (South - 14 provinces)
  { id: 'chumphon', nameTh: 'ชุมพร', nameEn: 'Chumphon', region: 'south', lat: 10.4930, lng: 99.1800 },
  { id: 'ranong', nameTh: 'ระนอง', nameEn: 'Ranong', region: 'south', lat: 9.9529, lng: 98.6085 },
  { id: 'surat-thani', nameTh: 'สุราษฎร์ธานี', nameEn: 'Surat Thani', region: 'south', lat: 9.1382, lng: 99.3217 },
  { id: 'phang-nga', nameTh: 'พังงา', nameEn: 'Phang Nga', region: 'south', lat: 8.4501, lng: 98.5255 },
  { id: 'phuket', nameTh: 'ภูเก็ต', nameEn: 'Phuket', region: 'south', lat: 7.8804, lng: 98.3923 },
  { id: 'krabi', nameTh: 'กระบี่', nameEn: 'Krabi', region: 'south', lat: 8.0863, lng: 98.9063 },
  { id: 'nakhon-si-thammarat', nameTh: 'นครศรีธรรมราช', nameEn: 'Nakhon Si Thammarat', region: 'south', lat: 8.4304, lng: 99.9631 },
  { id: 'trang', nameTh: 'ตรัง', nameEn: 'Trang', region: 'south', lat: 7.5563, lng: 99.6114 },
  { id: 'phatthalung', nameTh: 'พัทลุง', nameEn: 'Phatthalung', region: 'south', lat: 7.6167, lng: 100.0740 },
  { id: 'songkhla', nameTh: 'สงขลา', nameEn: 'Songkhla', region: 'south', lat: 7.1898, lng: 100.5954 },
  { id: 'satun', nameTh: 'สตูล', nameEn: 'Satun', region: 'south', lat: 6.6238, lng: 100.0674 },
  { id: 'pattani', nameTh: 'ปัตตานี', nameEn: 'Pattani', region: 'south', lat: 6.8695, lng: 101.2505 },
  { id: 'yala', nameTh: 'ยะลา', nameEn: 'Yala', region: 'south', lat: 6.5411, lng: 101.2804 },
  { id: 'narathiwat', nameTh: 'นราธิวาส', nameEn: 'Narathiwat', region: 'south', lat: 6.4255, lng: 101.8253 },
];

export const DEFAULT_PROVINCE = THAILAND_PROVINCES[0]; // กรุงเทพมหานคร

export function findNearestProvince(lat: number, lng: number): Province {
  let nearest = THAILAND_PROVINCES[0];
  let bestDist = Infinity;
  for (const p of THAILAND_PROVINCES) {
    const dLat = p.lat - lat;
    const dLng = p.lng - lng;
    const d = dLat * dLat + dLng * dLng;
    if (d < bestDist) {
      bestDist = d;
      nearest = p;
    }
  }
  return nearest;
}
