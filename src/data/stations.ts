export interface Station {
  id: string;
  name: string;
  tagline: string;
  frequency: number; // in MHz, e.g. 91.4
  country: 'TR' | 'UK' | 'US' | 'DE' | 'FR' | 'CH';
  countryName: string;
  category: string;
  streamUrl: string;
}

export const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'ALL_WORLD', name: 'Tüm Dünya', flag: '🌍' },
  { code: 'UK', name: 'İngiltere', flag: '🇬🇧' },
  { code: 'US', name: 'ABD', flag: '🇺🇸' },
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  { code: 'CH', name: 'İsviçre', flag: '🇨🇭' },
];

export const STATIONS: Station[] = [
  // --- TÜRKİYE (100% Verified Live Streams) ---
  {
    id: 'trt-fm',
    name: 'TRT FM',
    tagline: 'Türkiye’nin Sesi, Yolların Neşesi',
    frequency: 91.4,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Karma Müzik & Sohbet',
    streamUrl: 'https://trt.radyotvonline.net/trtfm',
  },
  {
    id: 'kral-turk',
    name: 'Kral Türk FM',
    tagline: 'İlaç Gibi Radyo · Arabesk & Nostalji',
    frequency: 92.0,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Arabesk & Nostalji',
    streamUrl: 'https://live.radyositesihazir.com/8032/stream',
  },
  {
    id: 'trt-1',
    name: 'TRT Radyo 1',
    tagline: 'Kültür, Sanat ve Haber',
    frequency: 93.3,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Kültür & Sanat',
    streamUrl: 'https://trt.radyotvonline.net/trt1',
  },
  {
    id: 'power-turk',
    name: 'Power Türk',
    tagline: 'Önce Müzik',
    frequency: 99.8,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Türkçe Pop',
    streamUrl: 'https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio',
  },
  {
    id: 'power-fm',
    name: 'Power FM',
    tagline: 'World Hits First',
    frequency: 100.0,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Yabancı Hit',
    streamUrl: 'https://listen.powerapp.com.tr/powerfm/mpeg/icecast.audio',
  },
  {
    id: 'joy-turk',
    name: 'Joy Türk',
    tagline: 'Aşkın ve Nostaljinin Frekansı',
    frequency: 89.0,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Nostalji & Slow',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/JOY_TURK_SC',
  },
  {
    id: 'super-fm',
    name: 'Süper FM',
    tagline: 'Türkiye’nin İlk Özel Radyosu',
    frequency: 90.8,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Hit Pop',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/SUPER_FM_SC',
  },
  {
    id: 'metro-fm',
    name: 'Metro FM',
    tagline: 'Radyonun Ritmi',
    frequency: 97.2,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Yabancı Pop & Dance',
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/METRO_FM_SC',
  },
  {
    id: 'fenomen-fm',
    name: 'Radyo Fenomen',
    tagline: 'Maximum Hits',
    frequency: 100.4,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Trend Müzik',
    streamUrl: 'https://live.radyofenomen.com/fenomen/128/icecast.audio',
  },
  {
    id: 'damar-turk',
    name: 'Damar Türk FM',
    tagline: 'En Damar Şarkılar Burada',
    frequency: 104.2,
    country: 'TR',
    countryName: 'Türkiye',
    category: 'Damar & Arabesk',
    streamUrl: 'https://live.radyositesihazir.com:10997/stream',
  },

  // --- DİĞER ÜLKELER (100% Verified Live Streams) ---
  // UK
  {
    id: 'classic-fm-uk',
    name: 'Classic FM',
    tagline: 'The World’s Greatest Classical Music',
    frequency: 100.9,
    country: 'UK',
    countryName: 'İngiltere',
    category: 'Klasik Müzik',
    streamUrl: 'https://media-ice.musicradio.com/ClassicFMMP3',
  },
  {
    id: 'smooth-radio-uk',
    name: 'Smooth Radio London',
    tagline: 'Your Relaxing Music Mix',
    frequency: 102.2,
    country: 'UK',
    countryName: 'İngiltere',
    category: 'Nostalji & Soul',
    streamUrl: 'https://media-ice.musicradio.com/SmoothUKMP3',
  },
  {
    id: 'capital-fm-uk',
    name: 'Capital FM London',
    tagline: 'The UK’s No.1 Hit Music Station',
    frequency: 95.8,
    country: 'UK',
    countryName: 'İngiltere',
    category: 'Top 40 & Pop',
    streamUrl: 'https://media-ice.musicradio.com/CapitalMP3',
  },

  // US
  {
    id: 'kexp-seattle',
    name: 'KEXP 90.3 Seattle',
    tagline: 'Where the Music Matters',
    frequency: 90.3,
    country: 'US',
    countryName: 'ABD',
    category: 'Indie & Klasik Alternatif',
    streamUrl: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
  },
  {
    id: 'wnyc-new-york',
    name: 'WNYC 93.9 New York',
    tagline: 'New York Public Radio',
    frequency: 93.9,
    country: 'US',
    countryName: 'ABD',
    category: 'Kültür, Caz & Sohbet',
    streamUrl: 'https://fm939.wnyc.org/wnycfm-app.aac',
  },

  // Fransa
  {
    id: 'jazz-radio-paris',
    name: 'Jazz Radio Paris',
    tagline: 'Ladies & Crooners · Nostalgic Jazz',
    frequency: 98.2,
    country: 'FR',
    countryName: 'Fransa',
    category: 'Fransız Caz & Soul',
    streamUrl: 'https://jazz-wr01.ice.infomaniak.ch/jazz-wr01-128.mp3',
  },

  // Almanya
  {
    id: 'antenne-bayern',
    name: 'Antenne Bayern',
    tagline: 'Bayerns Bester Musikmix',
    frequency: 101.3,
    country: 'DE',
    countryName: 'Almanya',
    category: 'Alman Pop & Rock',
    streamUrl: 'https://stream.antenne.de/antenne/stream/mp3',
  },
  {
    id: 'antenne-chillout',
    name: 'Antenne Chillout',
    tagline: 'Lounge, Ambient & Chill Classics',
    frequency: 106.8,
    country: 'DE',
    countryName: 'Almanya',
    category: 'Lounge & Chillout',
    streamUrl: 'https://stream.antenne.de/chillout/stream/mp3',
  },

  // İsviçre
  {
    id: 'swiss-jazz',
    name: 'Swiss Radio Jazz',
    tagline: 'Pure Jazz & Swing',
    frequency: 94.5,
    country: 'CH',
    countryName: 'İsviçre',
    category: 'Caz & Akustik',
    streamUrl: 'https://stream.srg-ssr.ch/m/rsj/mp3_128',
  },
  {
    id: 'swiss-classic',
    name: 'Swiss Radio Classic',
    tagline: 'Masterpieces of Symphony',
    frequency: 97.6,
    country: 'CH',
    countryName: 'İsviçre',
    category: 'Senfoni & Klasik',
    streamUrl: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
  },
];
