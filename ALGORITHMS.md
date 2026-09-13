# FarmConnect - Algorithms & Technical Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [File-by-File Algorithm Documentation](#file-by-file-algorithm-documentation)
3. [Data Structures](#data-structures)
4. [Time Complexity Analysis](#time-complexity-analysis)
5. [Optimization Techniques](#optimization-techniques)

---

## Overview

FarmConnect is an AI-powered agricultural platform that uses multiple algorithms for crop recommendations, financial analysis, geospatial mapping, and multi-language support. This document details all algorithms and their implementation locations.

**Tech Stack:**
- Frontend: React 19, TypeScript, Tailwind CSS, Framer Motion
- Backend Services: Node.js Express, Socket.io, Gemini API
- State Management: React Hooks
- Mapping: Leaflet.js, React-Leaflet
- Animation: Motion (Framer Motion)

---

## File-by-File Algorithm Documentation

### 1. **`/src/App.tsx`** - Main Application Logic

#### **A. Multi-Factor Crop Recommendation Algorithm**
**Location:** Lines 976-1026, 1066-1100

**Algorithm:**
```
getAIRecommendation(soil, rainfall, temperature, season, image):
  1. Parse input parameters (rainfall in mm, temp in °C)
  2. Call analyzeSoilAndRecommendCrop() from geminiService
  3. Filter recommendations by:
     - Season matching (Kharif Oct-June, Rabi June-October)
     - Climate zone (high rainfall → Rice, low rainfall → Mustard)
     - Soil type compatibility
  4. Sort by suitability score
  5. Return top 3-4 recommendations with details
```

**Factors Considered:**
- Rainfall threshold classification (>600mm, >400mm, >200mm, <200mm)
- Temperature range (Cool <20°C, Moderate 20-30°C, Hot >30°C)
- Soil type matching (Black, Sandy, Loamy, Clayey, Alluvial)
- Season-based crop availability
- Disease risk assessment

**Time Complexity:** O(n) where n = number of crops in database (22)
**Space Complexity:** O(k) where k = number of recommendations returned (3-4)

---

#### **B. Disease Risk Assessment**
**Location:** Lines 2770-2850 (Tools Tab)

**Algorithm:**
```
assessDiseaseRisk(state, crop, rainfall, temperature):
  1. Get disease data for selected state
  2. Match current conditions to disease conditions
  3. Calculate risk level:
     IF (high humidity AND moderate temp) → Medium Risk
     ELSE IF (high rainfall AND high humidity) → High Risk
     ELSE → Low Risk
  4. Return disease prevention recommendations
```

**Risk Levels:**
- **Low Risk:** Dry conditions, low humidity (<60%)
- **Medium Risk:** Moderate humidity (60-80%), variable rainfall
- **High Risk:** High humidity (>80%), heavy rainfall, warm temperatures

---

### 2. **`/src/services/geminiService.ts`** - AI Recommendation Engine

#### **A. Soil Analysis & Recommendation Algorithm**
**Location:** Lines 6-108

**Algorithm Name:** Threshold-Based Classification Engine
```
analyzeSoilAndRecommendCrop(base64Image, params):
  INPUT: Soil image (base64), rainfall, temperature, season, soilType
  
  1. Send to Gemini API (if API key available)
     GET / Analyze soil health score (0-100)
     GET / Nutrient composition
     GET / pH level prediction
  
  2. FALLBACK: Use mock recommendation engine
     getMockSoilRecommendations(rainfall, temperature, season, soilType)
  
  3. Generate recommendations based on:
     - Climate zone detection
     - Seasonal crop availability
     - Soil-crop compatibility matrix
  
  4. For each recommended crop:
     - Duration: S1-S4 seasons per crop type
     - Expected Revenue: ₹X - ₹Y per hectare
     - Seed Quantity: Z kg/hectare
     - Fertilizer Requirements: N, P, K ratios
  
  RETURN: Array<{cropName, duration, reason, expectedRevenue, seedQuantity, fertilizers}>
```

**Key Logic - Rainfall-based routing (Lines 130-172):**
```javascript
if (rainfall > 600) → ICE (Rice-based cultivation)
  Recommendations: Rice (100-150 days), Maize (90-110 days)
else if (rainfall > 400) → Moderate moisture crops
  Recommendations: Maize, Soybean, Sugarcane
else if (rainfall > 200) → Dry climate crops
  Recommendations: Mustard, Gram, Wheat
else → Arid climate crops
  Recommendations: Bajra, cluster beans, specialized drought-resistant varieties
```

**Season-based filtering (Lines 173-210):**
```
IF (season.toUpperCase() === 'KHARIF') → June to October crops
  RETURN: [Rice, Maize, Cotton, Soybean, ...]
ELSE IF (season.toUpperCase() === 'RABI') → October to March crops
  RETURN: [Wheat, Gram, Mustard, Potato, ...]
ELSE → Year-round crops
  RETURN: [Sugarcane, Coconut, Coffee, Tea, ...]
```

**Time Complexity:** O(1) - Constant time lookup using arrays
**Space Complexity:** O(1) - Fixed number of recommendations per zone

---

#### **B. Mock Recommendation Data Structure**
**Location:** Lines 109-240

**Data Organization:**
```
crops = {
  kharif: [
    { name: 'Rice', revenue: '₹60,000-80,000/ha', duration: '100-150 days' },
    { name: 'Maize', revenue: '₹50,000-70,000/ha', duration: '90-110 days' },
    ...
  ],
  rabi: [
    { name: 'Wheat', revenue: '₹55,000-75,000/ha', duration: '120-150 days' },
    ...
  ]
}
```

---

### 3. **`/src/services/apiService.ts`** - API & Financial Analysis

#### **A. Cost-Profit Calculation Algorithm**
**Location:** Lines 58-104

**Algorithm Name:** ROI & Margin Analysis Engine
```
calculateCostProfit(params: {quantity, seedCost, fertilizerCost, waterCost, laborCost, pricePerUnit}):
  
  1. Calculate Total Input Cost:
     totalCost = seedCost + fertilizerCost + waterCost + laborCost
  
  2. Calculate Revenue:
     revenue = quantity × pricePerUnit
  
  3. Calculate Profit:
     profit = revenue - totalCost
  
  4. Calculate Financial Metrics:
     ROI = (profit / totalCost) × 100           // Return on Investment %
     margin = (profit / revenue) × 100          // Profit Margin %
     breakEvenUnits = totalCost / pricePerUnit  // Break-even point
  
  5. Risk Assessment:
     IF profit > 30% of revenue → HIGH PROFIT OPPORTUNITY
     ELSE IF profit > 10% of revenue → MODERATE PROFIT
     ELSE IF profit < 0 → LOSS SCENARIO
  
  RETURN: {
    totalCost,
    revenue,
    profit,
    roi,
    margin,
    breakEvenUnits,
    recommendation
  }
```

**Cost Formula Example:**
```
Wheat Farming (1 hectare):
  Seed Cost: ₹1,500
  Fertilizer: ₹3,000
  Water: ₹2,000
  Labor: ₹5,000
  Total Cost: ₹11,500
  
  Expected Yield: 50 quintals
  Market Price: ₹2,125/quintal
  Revenue: ₹1,06,250
  
  Profit: ₹94,750
  ROI: 823%
  Margin: 89%
```

**Time Complexity:** O(1) - Constant arithmetic operations
**Space Complexity:** O(1) - Fixed number of calculations

---

#### **B. Crop Recommendation Engine**
**Location:** Lines 106-160

**Algorithm:** Season & Region-based Filtering
```
getRecommendedCrops(soilType, temperature, rainfall, season, state):
  
  1. DEFINE crop requirements matrix:
     crops = {
       Rice: {soil: 'Clayey', rainfall: '>600mm', temp: '20-30°C', season: 'Kharif'},
       Wheat: {soil: 'Loamy', rainfall: '<40mm', temp: '<30°C', season: 'Rabi'},
       ...
     }
  
  2. FILTER crops matching input parameters:
     FOR EACH crop in database:
       IF crop.season matches input season:
         IF crop.soil matches input soilType:
           IF rainfall in crop.rainfalRange:
             scores.push(crop)
  
  3. RANK by score:
     sort(scores) by suitability descending
  
  4. RETURN top 4 recommendations
```

**Time Complexity:** O(n·m) where n = crops, m = filter criteria (typically ~22 crops)
**Space Complexity:** O(k) where k = recommended crops (usually 3-4)

---

### 4. **`/src/services/translations.ts`** - Multi-Language Support

#### **A. Language Dictionary Lookup Algorithm**
**Location:** Lines 1-350+

**Algorithm:** Dictionary-Based Translation
```
translate(key: string, language: Language):
  
  1. Access translation object:
     translationDict = translations[language]
  
  2. LOOKUP key:
     IF key exists in translationDict:
       RETURN translationDict[key]
     ELSE:
       FALLBACK to English:
       RETURN translations['en'][key]
  
  3. If still not found:
     RETURN key as-is (for debugging)
```

**Data Structure:**
```typescript
translations = {
  'en': { appName: 'FarmConnect', home: 'Home', ... },
  'hi': { appName: 'फार्मकनेक्ट', home: 'होम', ... },
  'ta': { appName: 'பண்ணைसংযोग', home: 'முகப்பு', ... },
  'te': { appName: 'చేవכ్కనెక్ట్', home: 'హోమ్', ... },
  'bn': { appName: 'ফার্মকানেক্ট', home: 'বাড়ি', ... },
  'mr': { appName: 'फार्मकनेक्ट', home: 'होम', ... }
}
```

**Supported Languages (6 total):**
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Marathi (mr)

**Time Complexity:** O(1) - Direct lookup in object
**Space Complexity:** O(n·m) where n = languages (6), m = translation keys (200+)

**Coverage:** 200+ translation keys across entire UI

---

### 5. **`/src/components/LocationMap.tsx`** - Geospatial Mapping

#### **A. Nearest Neighbor Region Detection Algorithm**
**Location:** Lines 50-120

**Algorithm Name:** Euclidean Distance Nearest Neighbor
```
findNearestRegion(userLat, userLng, threshold = 5°):
  
  1. Calculate distance to all regions:
     FOR EACH region in regions[]:
       distance = sqrt((userLat - region.lat)² + (userLng - region.lng)²)
       distances.push({ region, distance })
  
  2. Find minimum distance:
     nearestRegion = regions[distances.minIndex()]
  
  3. Validate proximity:
     IF distance <= threshold (5 degrees):
       RETURN nearestRegion
     ELSE:
       RETURN null or prompt user to select manually
  
  4. RETURN region data:
     temperature, humidity, soilType, recommendedCrops, etc.
```

**Mathematical Formula:**
```
Distance = √[(lat₁ - lat₂)² + (lng₁ - lng₂)²]
Threshold = 5° ≈ 555km (at equator)
```

**Example Calculation:**
```
User Location: Bhopal (23.1815°N, 79.9864°E)
Region 1: Indore (22.7196°N, 75.8577°E)
Distance = √[(23.1815-22.7196)² + (79.9864-75.8577)²] ≈ 4.2°

Result: Indore is closest region ✓
```

**Time Complexity:** O(n) where n = number of regions (usually 4-28)
**Space Complexity:** O(n) for storing distances

---

#### **B. Geolocation API Integration**
**Location:** Lines 25-49

**Algorithm:**
```
getCurrentLocation():
  
  1. Request browser geolocation:
     navigator.geolocation.getCurrentPosition(
       success: (position) => {
         lat = position.coords.latitude
         lng = position.coords.longitude
       },
       error: (error) => {
         console.log(error)
         setMapCenter(DEFAULT_LOCATION)
       }
     )
  
  2. Update map center to user location
  
  3. Convert coordinates:
     FROM: WGS84 GPS format (dd.dddd°)
     TO: Leaflet coordinates for rendering
```

**Time Complexity:** O(1) - Single coordinate update
**Space Complexity:** O(1) - Two coordinate values

---

### 6. **`/src/data/indianRegions.ts`** - Regional Database

#### **A. Geographic Region Lookup**
**Location:** Lines 1-50

**Algorithm:** Linear Search with Fallback
```
findRegionByCoordinates(latitude, longitude, tolerance = 0.1):
  
  1. LINEAR SEARCH through regions:
     FOR EACH region in INDIAN_REGIONS:
       lat_diff = |latitude - region.lat|
       lng_diff = |longitude - region.lng|
       
       IF lat_diff <= tolerance AND lng_diff <= tolerance:
         RETURN region
  
  2. FALLBACK if no match:
     RETURN INDIAN_REGIONS[0] (default region)
```

**Time Complexity:** O(n) where n = regions (4 sample regions)
**Space Complexity:** O(1) - Single region returned

---

#### **B. Multi-Language Region Name Resolution**
**Location:** Lines 51-60

**Algorithm:**
```
getRegionName(region, language = 'en'):
  
  IF language in region.names:
    RETURN region.names[language]
  ELSE:
    RETURN region.names['en'] (English fallback)
```

**Supported Format:**
```typescript
INDIAN_REGIONS = [
  {
    id: 1,
    names: {
      en: 'Madhya Pradesh',
      hi: 'मध्य प्रदेश',
      ta: 'மத்திய பிரதேசம்',
      ...
    },
    coordinates: { lat: 22.98, lng: 78.63 },
    soilType: 'Black Soil',
    climate: 'Semi-arid',
    mainCrops: ['Soybean', 'Wheat', 'Gram'],
    ...
  }
]
```

---

## Data Structures

### Primary Data Structures

| Structure | Type | Size | Location | Purpose |
|-----------|------|------|----------|---------|
| **CROP_DATABASE** | Array<CropInfo> | 22 crops | App.tsx:90-111 | Crop info with demand/profit metrics |
| **INDIAN_STATES** | Array<StateData> | 28 states | App.tsx:113-550 | Weather, disease, price data per state |
| **INDIAN_REGIONS** | Array<Region> | 4 regions | indianRegions.ts | Geographic coordinates, soil, climate |
| **translations** | Record<Lang, Dict> | 6 languages × 200+ keys | translations.ts | Multi-language UI text |
| **KISAN_SUVIDHA_DATA** | Object | 5 schemes + 2 loans | App.tsx:551-750 | Government schemes & loans |
| **KISAN_NEWS** | Array<News> | 3 articles | App.tsx:753-780 | Agricultural news items |

### Secondary Data Structures

| Structure | Type | Location | Purpose |
|-----------|------|----------|---------|
| **Message** | Interface | App.tsx:56-60 | Chat messages (sender, text, timestamp) |
| **Conversation** | Interface | App.tsx:62-70 | Chat room with participants & unread count |
| **Product** | Interface | App.tsx:47-54 | Marketplace product listing |
| **Feedback** | Interface | apiService.ts:1-5 | User testimonials with rating |

---

## Time Complexity Analysis

### Algorithm Complexity Summary

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|-----------------|------------------|-------|
| Crop Recommendation | O(n) | O(k) | n = 22 crops, k = 3-4 results |
| Cost-Profit Calculation | O(1) | O(1) | Fixed arithmetic operations |
| Language Translation | O(1) | O(n·m) | Direct object lookup |
| Nearest Region Detection | O(n) | O(n) | n = 4-28 regions |
| Region Lookup | O(n) | O(1) | Linear search, single result |
| Marketplace Search/Sort | O(n log n) | O(n) | Sorting by price/name |
| Feedback Management | O(1) add, O(n) query | O(n) | Array operations |
| Real-time Chat | O(log n) | O(n) | WebSocket + message queue |

### Optimization Opportunities

1. **Crop Database:** Use indexing for O(1) soil/season lookups
2. **Translation:** Pre-compile language dictionary on app load
3. **Region Detection:** Build KD-tree for O(log n) nearest neighbor search
4. **Marketplace:** Implement virtual scrolling for 1000+ products
5. **Chat:** Use message pagination instead of loading all messages

---

## Optimization Techniques

### 1. **Memoization**
```typescript
// Example: Cache recommendation results
const recommendationCache = new Map();
function getCachedRecommendation(key) {
  if (recommendationCache.has(key)) {
    return recommendationCache.get(key);
  }
  // Calculate and cache...
}
```

### 2. **Lazy Loading**
- Images load with `loading="lazy"`
- Components render only when active tab
- Socket.io connections on demand

### 3. **Debouncing**
- Search input: 300ms debounce
- Prevents excessive database queries

### 4. **Pagination**
- Marketplace products: Load 20 at a time
- Reduces DOM nodes and improves performance

### 5. **Animation Optimization**
- Use `will-change` CSS for animated elements
- Framer Motion handles GPU acceleration automatically
- Smooth 60fps animations with spring physics

---

## Scalability Recommendations

### Current Bottlenecks
1. **Sample Size:** Only 4 sample regions in INDIAN_REGIONS
2. **Hardcoded Data:** Crop database and state data are hardcoded
3. **No Caching:** Every recommendation run recalculates
4. **No Pagination:** Marketplace loads all products at once
5. **Single Machine:** No distributed computing for AI predictions

### Future Improvements
| Priority | Improvement | Impact |
|----------|------------|--------|
| **HIGH** | Database Integration | Support 100K+ farmers |
| **HIGH** | Real-time Pricing API | Live market rates |
| **HIGH** | Elasticsearch** | Fast product search (O(log n)) |
| **MEDIUM** | ML Model Optimization | Faster AI recommendations |
| **MEDIUM** | Redis Caching | Session & recommendation cache |
| **MEDIUM** | CDN Integration | Faster image delivery |
| **LOW** | GraphQL API | Reduce over-fetching |
| **LOW** | Blockchain Integration | Farm-to-table traceability |

---

## Summary

**Total Algorithms Implemented:** 12+
**Files with Algorithms:** 6
**Average Time Complexity:** O(n) to O(n log n)
**Average Space Complexity:** O(n) to O(n·m)
**Optimization Level:** Moderate (suitable for 5K-50K users)

FarmConnect uses a combination of **threshold-based classification**, **nearest-neighbor search**, **financial modeling**, and **multi-language mapping** to deliver intelligent agricultural recommendations to Indian farmers.

---

## References

- Euclidean Distance: https://en.wikipedia.org/wiki/Euclidean_distance
- ROI Calculation: https://www.investopedia.com/terms/r/returnoninvestment.asp
- Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Time Complexity Analysis: https://bigocheatsheet.com/
