export interface Region {
  id: string;
  name: { [key: string]: string };
  lat: number;
  lng: number;
  temp: number;
  rainfall: number;
  soil: string;
  seasons: string[];
  climate: string;
}

export const INDIAN_REGIONS: Region[] = [
  {
    id: 'punjab',
    name: {
      en: 'Punjab',
      hi: 'पंजाब',
      ta: 'பஞ்சாப்',
      te: 'పంజాబ్',
      bn: 'পাঞ্জাব',
      mr: 'पंजाब'
    },
    lat: 31.1471,
    lng: 75.3412,
    temp: 22,
    rainfall: 650,
    soil: 'alluvial',
    seasons: ['rabi', 'kharif'],
    climate: 'Semi-arid'
  },
  {
    id: 'haryana',
    name: {
      en: 'Haryana',
      hi: 'हरियाणा',
      ta: 'ஹரியானா',
      te: 'హర్యానా',
      bn: 'হরিয়ানা',
      mr: 'हरियाणा'
    },
    lat: 29.0588,
    lng: 76.0856,
    temp: 24,
    rainfall: 550,
    soil: 'alluvial',
    seasons: ['rabi', 'kharif'],
    climate: 'Semi-arid'
  },
  {
    id: 'maharashtra_vidarbha',
    name: {
      en: 'Vidarbha, Maharashtra',
      hi: 'विदर्भ, महाराष्ट्र',
      ta: 'விதர்பா, மகாராஷ்டிரா',
      te: 'విదర్భ, మహారాష్ట్ర',
      bn: 'বিদর্ভ, মহারাষ্ট্র',
      mr: 'विदर्भ, महाराष्ट्र'
    },
    lat: 21.1458,
    lng: 79.0882,
    temp: 28,
    rainfall: 1100,
    soil: 'black',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'gujarat_saurashtra',
    name: {
      en: 'Saurashtra, Gujarat',
      hi: 'सौराष्ट्र, गुजरात',
      ta: 'சௌராஷ்டிரா, குஜராத்',
      te: 'సౌరాష్ట్ర, గుజరాత్',
      bn: 'সৌরাষ্ট্র, গুজরাট',
      mr: 'सौराष्ट्र, गुजरात'
    },
    lat: 22.3094,
    lng: 70.8007,
    temp: 27,
    rainfall: 600,
    soil: 'black',
    seasons: ['kharif', 'zaid'],
    climate: 'Arid'
  },
  {
    id: 'uttar_pradesh_west',
    name: {
      en: 'Western UP',
      hi: 'पश्चिमी उत्तर प्रदेश',
      ta: 'மேற்கு உத்திரப் பிரதேசம்',
      te: 'పశ్చిమ ఉత్తర ప్రదేశ్',
      bn: 'পশ্চিম উত্তরপ্রদেশ',
      mr: 'पश्चिम उत्तर प्रदेश'
    },
    lat: 28.6139,
    lng: 77.2090,
    temp: 25,
    rainfall: 800,
    soil: 'alluvial',
    seasons: ['rabi', 'kharif'],
    climate: 'Humid Subtropical'
  },
  {
    id: 'west_bengal_delta',
    name: {
      en: 'Bengal Delta',
      hi: 'बंगाल डेल्टा',
      ta: 'வங்காள டெல்டா',
      te: 'బెంగాల్ డెల్టా',
      bn: 'বঙ্গীয় বদ্বীপ',
      mr: 'बंगाल डेल्टा'
    },
    lat: 22.5726,
    lng: 88.3639,
    temp: 26,
    rainfall: 1600,
    soil: 'alluvial',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical Wet'
  },
  {
    id: 'tamil_nadu_cauvery',
    name: {
      en: 'Cauvery Delta, TN',
      hi: 'कावेरी डेल्टा, तमिलनाडु',
      ta: 'காவிரி டெல்டா, தமிழ்நாடு',
      te: 'కావేరి డెల్టా, తమిళనాడు',
      bn: 'কাবেরী বদ্বীপ, তামিলনাড়ু',
      mr: 'कावेरी डेल्टा, तामिळनाडू'
    },
    lat: 10.7870,
    lng: 79.1378,
    temp: 29,
    rainfall: 1000,
    soil: 'alluvial',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'andhra_coastal',
    name: {
      en: 'Coastal Andhra',
      hi: 'तटीय आंध्र',
      ta: 'கடலோர ஆந்திரா',
      te: 'కోస్తా ఆంధ్ర',
      bn: 'উপকূলীয় অন্ধ্র',
      mr: 'किनारपट्टी आंध्र'
    },
    lat: 16.5062,
    lng: 80.6480,
    temp: 28,
    rainfall: 1200,
    soil: 'alluvial',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'karnataka_plateau',
    name: {
      en: 'Karnataka Plateau',
      hi: 'कर्नाटक पठार',
      ta: 'கர்நாடக பீடபூமி',
      te: 'కర్ణాటక పీఠభూమి',
      bn: 'কর্ণাটক মালভূমি',
      mr: 'कर्नाटक पठार'
    },
    lat: 12.9716,
    lng: 77.5946,
    temp: 24,
    rainfall: 900,
    soil: 'red',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'rajasthan_thar',
    name: {
      en: 'Thar Desert, Rajasthan',
      hi: 'थार मरुस्थल, राजस्थान',
      ta: 'தார் பாலைவனம், ராஜஸ்தான்',
      te: 'థార్ ఎడారి, రాజస్థాన్',
      bn: 'থর মরুভূমি, রাজস্থান',
      mr: 'थार वाळवंट, राजस्थान'
    },
    lat: 26.2389,
    lng: 73.0243,
    temp: 32,
    rainfall: 250,
    soil: 'sandy',
    seasons: ['kharif', 'zaid'],
    climate: 'Arid'
  },
  {
    id: 'madhya_pradesh_malwa',
    name: {
      en: 'Malwa Plateau, MP',
      hi: 'मालवा पठार, मध्य प्रदेश',
      ta: 'மால்வா பீடபூமி, மத்திய பிரதேசம்',
      te: 'మాల్వా పీఠభూమి, మధ్యప్రదేశ్',
      bn: 'মালওয়া মালভূমি, মধ্যপ্রদেশ',
      mr: 'माळवा पठार, मध्य प्रदेश'
    },
    lat: 23.2599,
    lng: 77.4126,
    temp: 26,
    rainfall: 950,
    soil: 'black',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'bihar_gangetic',
    name: {
      en: 'Gangetic Bihar',
      hi: 'गंगा का मैदान, बिहार',
      ta: 'கங்கை பீகார்',
      te: 'గంగా బీహార్',
      bn: 'গাঙ্গেয় বিহার',
      mr: 'गंगेचा बिहार'
    },
    lat: 25.0961,
    lng: 85.3131,
    temp: 25,
    rainfall: 1200,
    soil: 'alluvial',
    seasons: ['rabi', 'kharif'],
    climate: 'Humid Subtropical'
  },
  {
    id: 'assam_valley',
    name: {
      en: 'Brahmaputra Valley',
      hi: 'ब्रह्मपुत्र घाटी',
      ta: 'பிரம்மபுத்திரா பள்ளத்தாக்கு',
      te: 'బ్రహ్మపుత్ర లోయ',
      bn: 'ব্রহ্মপুত্র উপত্যকা',
      mr: 'ब्रह्मपुत्रा खोरे'
    },
    lat: 26.1445,
    lng: 91.7362,
    temp: 23,
    rainfall: 2500,
    soil: 'alluvial',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical Monsoon'
  },
  {
    id: 'kerala_coastal',
    name: {
      en: 'Coastal Kerala',
      hi: 'तटीय केरल',
      ta: 'கடலோர கேரளா',
      te: 'కోస్తా కేరళ',
      bn: 'উপকূলীয় কেরালা',
      mr: 'किनारपट्टी केरळ'
    },
    lat: 10.8505,
    lng: 76.2711,
    temp: 27,
    rainfall: 3000,
    soil: 'laterite',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical Wet'
  },
  {
    id: 'odisha_coastal',
    name: {
      en: 'Coastal Odisha',
      hi: 'तटीय ओडिशा',
      ta: 'கடலோர ஒடிசா',
      te: 'కోస్తా ఒడిశా',
      bn: 'উপকূলীয় ওড়িশা',
      mr: 'किनारपट्टी ओडिशा'
    },
    lat: 20.2961,
    lng: 85.8245,
    temp: 26,
    rainfall: 1500,
    soil: 'alluvial',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'telangana_plateau',
    name: {
      en: 'Telangana Plateau',
      hi: 'तेलंगाना पठार',
      ta: 'தெலுங்கானா பீடபூமி',
      te: 'తెలంగాణ పీఠభూమి',
      bn: 'তেলেঙ্গানা মালভূমি',
      mr: 'तेलंगणा पठार'
    },
    lat: 17.3850,
    lng: 78.4867,
    temp: 28,
    rainfall: 850,
    soil: 'red',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'chhattisgarh_plain',
    name: {
      en: 'Chhattisgarh Plain',
      hi: 'छत्तीसगढ़ का मैदान',
      ta: 'சத்தீஸ்கர் சமவெளி',
      te: 'ఛత్తీస్‌గఢ్ మైదానం',
      bn: 'ছত্তিশগড় সমভূমি',
      mr: 'छत्तीसगडचे मैदान'
    },
    lat: 21.2787,
    lng: 81.6669,
    temp: 27,
    rainfall: 1300,
    soil: 'red',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'himachal_hills',
    name: {
      en: 'Himachal Hills',
      hi: 'हिमाचल की पहाड़ियाँ',
      ta: 'இமாச்சல மலைகள்',
      te: 'హిమాచల్ కొండలు',
      bn: 'হিমাচল পাহাড়',
      mr: 'हिमाचल टेकड्या'
    },
    lat: 31.1048,
    lng: 77.1734,
    temp: 15,
    rainfall: 1100,
    soil: 'mountain',
    seasons: ['kharif', 'rabi'],
    climate: 'Subtropical Highland'
  },
  {
    id: 'jandk_valley',
    name: {
      en: 'Kashmir Valley',
      hi: 'कश्मीर घाटी',
      ta: 'காஷ்மீர் பள்ளத்தாக்கு',
      te: 'కాశ్మీర్ లోయ',
      bn: 'কাশ্মীর উপত্যকা',
      mr: 'काश्मीर खोरे'
    },
    lat: 34.0837,
    lng: 74.7973,
    temp: 12,
    rainfall: 700,
    soil: 'mountain',
    seasons: ['kharif', 'rabi'],
    climate: 'Humid Continental'
  },
  {
    id: 'uttarakhand_hills',
    name: {
      en: 'Uttarakhand Hills',
      hi: 'उत्तराखंड की पहाड़ियाँ',
      ta: 'உத்தரகண்ட் மலைகள்',
      te: 'ఉత్తరాఖండ్ కొండలు',
      bn: 'উত্তরাখণ্ড পাহাড়',
      mr: 'उत्तराखंड टेकड्या'
    },
    lat: 30.3165,
    lng: 78.0322,
    temp: 16,
    rainfall: 1500,
    soil: 'mountain',
    seasons: ['kharif', 'rabi'],
    climate: 'Subtropical Highland'
  },
  {
    id: 'jharkhand_plateau',
    name: {
      en: 'Chota Nagpur Plateau',
      hi: 'छोटा नागपुर पठार',
      ta: 'சோட்டா நாக்பூர் பீடபூமி',
      te: 'ఛోటా నాగ్‌పూర్ పీఠభూమి',
      bn: 'ছোট নাগপুর মালভূমি',
      mr: 'छोटा नागपूर पठार'
    },
    lat: 23.3441,
    lng: 85.3096,
    temp: 25,
    rainfall: 1300,
    soil: 'red',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical'
  },
  {
    id: 'goa_konkan',
    name: {
      en: 'Konkan Coast, Goa',
      hi: 'कोंकण तट, गोवा',
      ta: 'கொங்கன் கடற்கரை, கோவா',
      te: 'కొంకణ్ తీరం, గోవా',
      bn: 'কোঙ্কন উপকূল, গোয়া',
      mr: 'कोकण किनारपट्टी, गोवा'
    },
    lat: 15.2993,
    lng: 74.1240,
    temp: 27,
    rainfall: 3000,
    soil: 'laterite',
    seasons: ['kharif', 'rabi'],
    climate: 'Tropical Wet'
  }
];

export const findRegionByCoordinates = (lat: number, lng: number): Region | null => {
  let nearest: Region | null = null;
  let minDistance = Infinity;

  INDIAN_REGIONS.forEach(region => {
    const distance = Math.sqrt(Math.pow(region.lat - lat, 2) + Math.pow(region.lng - lng, 2));
    if (distance < minDistance) {
      minDistance = distance;
      nearest = region;
    }
  });

  // Only return if reasonably close (within ~5 degrees for this simple demo)
  return minDistance < 5 ? nearest : null;
};

export const getRegionName = (region: Region, lang: string): string => {
  return region.name[lang] || region.name['en'];
};
