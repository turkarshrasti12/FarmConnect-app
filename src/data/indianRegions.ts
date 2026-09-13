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
      bn: 'বিদর্ভ, মহারাষ্ट্র',
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
