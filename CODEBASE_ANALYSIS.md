# FarmConnect Codebase Analysis
## Algorithms, Data Structures, and Business Logic Documentation

---

## 1. `/src/App.tsx` - Main Application Component

### Data Structures

#### **CropInfo Interface**
```typescript
interface CropInfo {
  name: string;
  season: string;
  duration: string;
  soil: string;
  water: string;
  description: string;
  demand: number; // 1-10
  profit: number; // 1-10
  cost: number; // 1-10
  type: 'Crop' | 'Seed' | 'Vegetable' | 'Fruit';
}
```
- **Type**: Structured object with weighted scoring
- **Purpose**: Stores comprehensive crop metadata with demand/profit/cost ratings for comparison algorithms
- **Size**: 22 crop entries in CROP_DATABASE

#### **StateData Interface**
```typescript
interface StateData {
  name: string;
  temp: number;
  humidity: number;
  rainfall: number;
  wind: number;
  moisture: number;
  risk: 'Low' | 'Medium' | 'High';
  crops: string[];
  prices: { crop: string; price: string; trend: 'up' | 'down' }[];
  gradient: string;
  diseases: DiseaseInfo[];
  weather: 'sunny' | 'cloudy' | 'rainy';
}
```
- **Type**: Multi-attribute weather and agronomical data structure
- **Purpose**: Holds regional climate data, disease information, and market trends
- **Size**: 28+ state entries in INDIAN_STATES

#### **Message & Conversation Interfaces**
```typescript
interface Message {
  room: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  participantName: string;
  participantRole: 'farmer' | 'customer';
  lastMessage?: string;
  lastTimestamp?: number;
  unreadCount: number;
  avatar?: string;
}
```
- **Type**: Real-time messaging data structures
- **Purpose**: Socket.io based chat functionality with conversation threading

### Algorithms & Logic Patterns

#### **Crop Recommendation Scoring Algorithm**
The application employs a **multi-factor matching algorithm** based on:
1. Soil type compatibility
2. Rainfall suitability
3. Temperature range
4. Season alignment
5. Market demand (encoded as number 1-10)

**Process Flow**:
```
User Input (temp, rainfall, season, state)
    ↓
Match against CROP_DATABASE
    ↓
Filter by season (Rabi/Kharif/Annual)
    ↓
Score based on environmental factors
    ↓
Rank by demand × profit ratio
    ↓
Return top recommendations
```

#### **Disease Risk Assessment Pattern**
- Uses a **tri-level risk classification** (Low/Medium/High)
- Each state has associated diseases with:
  - Symptoms identification
  - Prevention strategies
- Risk level correlated with humidity and rainfall metrics

#### **Market Trend Analysis**
- Simple trend indicator: 'up' | 'down'
- Embedded in price objects: `{ crop, price, trend }`
- Used for farmer decision-making and portfolio optimization

### Optimization Techniques

1. **Data Localization**: CROP_DATABASE includes 22 comprehensive crop entries to minimize API calls
2. **Gradient Caching**: Pre-computed Tailwind gradient strings for UI rendering
3. **Filtered Search**: Pre-categorized crops by type (Crop/Seed/Vegetable/Fruit)
4. **State Memoization**: React hooks (useState, useEffect, useCallback) for component re-render optimization

### Business Logic

#### **Product Listing Feature**
- Farmers can list products with: name, price, unit, location, farmer ID, image URL
- Supports direct customer-to-farmer connection

#### **Role-Based Access Control**
- Two user types: `farmer` | `customer`
- Conditional UI rendering based on role
- Separate view flows for each role

---

## 2. `/src/services/geminiService.ts` - AI Crop Recommendation Service

### Algorithms

#### **Parameter-Based Recommendation Engine**
**Function**: `getMockSoilRecommendations()`

**Algorithm Flow**:
```
Parse Input Parameters:
  rainfall (mm) → continuous value
  temperature (°C) → continuous value
  season → categorical (kharif/rabi/monsoon/winter)
  soilType → categorical (loam/black/sandy/alluvial/clayey)
  
Kharif Season Logic (June-October):
  IF rainfall > 600mm:
    Recommend Rice (100-150 days, 40-50 kg seeds, high nitrogen)
  IF rainfall > 400mm OR loamy soil:
    Recommend Maize (90-110 days, 20-25 kg seeds)
  IF black soil detected:
    Recommend Cotton (160-180 days, specialized fertilizer mix)
  IF rainfall > 300mm OR loamy soil:
    Recommend Soybean (100-120 days, low nitrogen requirement)

Rabi Season Logic (October-March):
  IF temperature < 30°C:
    Recommend Wheat (120-150 days, standard mix)
  IF rainfall 200-600mm:
    Recommend Gram (90-120 days, minimal nitrogen)
  IF sandy/alluvial soil:
    Recommend Mustard (110-140 days, low water requirement)
  Always add Potato (90-120 days, high labor intensive)

Annual Crops:
  IF temperature > 25°C AND rainfall > 400mm:
    Recommend Sugarcane (10-12 months, high yield potential)

Fallback Logic:
  IF no conditions matched:
    Default to Wheat + Maize + Gram combination
    
Constraint: Return maximum 4 recommendations
```

**Mathematical Basis**:
- Threshold-based classification (rainfall >600, >400, >300 mm thresholds)
- Temperature ranges (< 30°C for cool season crops)
- Boolean logical operators (AND/OR) for multi-factor evaluation

#### **Revenue Projection Formula**
```
expectedRevenue = seedQuantity × average_yield × market_price
fertilizer_cost_estimation = crop_type × complexity_index
```

### Data Structures

#### **Recommendation Object**
```typescript
{
  cropName: string;
  duration: string;
  reason: string;           // Textual explanation
  expectedRevenue: string;  // Formatted currency
  seedQuantity: string;     // Per hectare specification
  fertilizers: string[];    // Array of fertilizer recommendations
}
```

#### **Mock Lookup Tables**
```typescript
// Yield rates (quintals per hectare)
yieldPerHectare: Record<string, number> = {
  'Wheat': 50,
  'Rice': 60,
  'Cotton': 20,
  ...
}

// Market prices (₹ per quintal)
marketPrices: Record<string, number> = {
  'Wheat': 2500,
  'Rice': 2400,
  ...
}
```
- **Type**: Hash tables for O(1) lookup complexity
- **Purpose**: Enable instant price and yield calculations without database queries

### Business Logic

#### **Content Translation Feature**
- Falls back to mock translations if Gemini API unavailable
- Language-specific placeholder pattern: `[Language Translation]`
- Supports 6 languages with language-specific formatting

#### **Error Handling & Fallback Strategy**
- Primary: Gemini AI API
- Secondary: Mock recommendation engine
- Tertiary: Default crop suggestions
- Returns at least 3-4 recommendations every time (no empty results)

### Optimization Techniques

1. **Lazy API Loading**: Only calls Gemini API if key is configured
2. **Mock Data Caching**: Pre-computed recommendations avoid real-time calculations
3. **String Truncation**: News translations limited to 100 characters + ellipsis for performance
4. **Closure-based State**: `getMockSoilRecommendations()` encapsulates recommendation logic

---

## 3. `/src/services/apiService.ts` - API Service with Recommendations

### Algorithms

#### **Cost-Profit Calculation Algorithm**
**Function**: `calculateCostProfit()`

**Formula**:
```
totalInputCost = ∑(seedCost + fertilizerCost + pesticideCost + 
                    laborCost + irrigationCost + transportationCost + 
                    miscCost + otherCost)

expectedYield = yieldPerHectare[cropType] × farmArea

expectedRevenue = expectedYield × marketPrice[cropType]

totalProfit = expectedRevenue - totalInputCost

profitMargin% = (totalProfit / expectedRevenue) × 100

profitPerHectare = totalProfit / farmArea

ROI% = (totalProfit / totalInputCost) × 100
```

**Complexity**: O(1) - Single pass through 8 cost components

#### **Crop Recommendation Algorithm**
**Function**: `getRecommendedCrops()`

**Conditional Logic Tree**:
```
IF season == 'kharif':
  IF rainfall > 500mm:
    Add Rice (compatibility: 95%)
  Add Maize (compatibility: 85%)
  Add Cotton (compatibility: 75%)

IF season == 'rabi':
  Add Wheat (compatibility: 90%)
  Add Gram (compatibility: 80%)
  Add Mustard (compatibility: 85%)

IF temperature > 25 AND rainfall > 300:
  Add Sugarcane (compatibility: 88%)

IF soil includes 'black' OR 'loamy':
  Add Soybean (compatibility: 82%)
```

**Compatibility Scoring**: Hardcoded percentage (0-100) based on agronomic research

### Data Structures

#### **CostProfitParams**
```typescript
interface CostProfitParams {
  crop: string;
  area: number;
  seedCost: number;
  fertilizerCost: number;
  pesticideCost: number;
  laborCost: number;
  irrigationCost: number;
  transportationCost: number;
  miscCost: number;
  otherCost: number;
}
```
- **Type**: Input parameter object for cost calculation
- **Purpose**: Encapsulates all cost factors for modular calculation

#### **CostProfitResult**
```typescript
interface CostProfitResult {
  crop: string;
  area: number;
  totalInputCost: number;
  expectedYield: number;
  marketPrice: number;
  expectedRevenue: number;
  totalProfit: number;
  profitMargin: number;
  profitPerHectare: number;
  roi: number;
}
```
- **Type**: Output results object with 10 aggregated metrics
- **Purpose**: Provides farmers 360-degree view of profitability

#### **CropRecommendation**
```typescript
interface CropRecommendation {
  name: string;
  compatibility: number; // 0-100
  reasoning: string;
  expectedYield: string;
  season: string;
  waterNeeded: string;
  soilType: string;
}
```
- **Type**: Recommendation object with reasoning
- **Purpose**: Detailed recommendation breakdown for farmer decision-making

#### **Feedback Entity**
```typescript
interface Feedback {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  cropName: string;
  message: string;
  rating: number;
  timestamp: number;
  reply?: string;
}
```
- **Type**: In-memory feedback store (currently uses mockFeedbacks array)
- **Scalability Note**: Would require database migration for production

### Business Logic

#### **Feedback Management System**
- **Create**: `addFeedback()` generates UUID and timestamps
- **Read**: `getFeedbacks()` returns sorted array (newest first)
- **Update**: Reply via `reply` optional field
- **Data Structure**: Mock array simulation (pre-populated with 2 sample entries)

#### **Market Price Simulation**
- Uses predefined lookup tables for 8 major crops
- Supports ROI calculation for farmer investment analysis

### Optimization Techniques

1. **Lookup Table Caching**: O(1) yield and price lookups via hash maps
2. **Simulated API Delays**: setTimeout() to simulate network latency (300-800ms)
3. **Array Immutability**: Uses spread operator for feedback updates
4. **Default Values**: Fallback prices (2000) for unknown crops

---

## 4. `/src/services/translations.ts` - Multi-Language Support

### Data Structures

#### **Language Type Definition**
```typescript
export type Language = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr';
```
- **Type**: Union type for 6 languages
  - en: English
  - hi: Hindi
  - ta: Tamil
  - te: Telugu
  - bn: Bengali
  - mr: Marathi

#### **Translations Object**
```typescript
export const translations: Record<Language, any> = {
  en: { /* 200+ key-value pairs */ },
  hi: { /* 200+ key-value pairs */ },
  ta: { /* 200+ key-value pairs */ },
  te: { /* Partial/stub entries */ },
  bn: { /* Partial/stub entries */ },
  mr: { /* Partial/stub entries */ },
}
```
- **Type**: Nested dictionary with language-specific strings
- **Pattern**: Flat key structure (no nested objects)
- **Size**: ~200+ translation keys per language
- **Coverage**: English and Hindi fully translated; others partially complete

### Algorithms

#### **Key-Based String Lookup**
```
getTranslation(key: string, language: Language): string
  1. Access translations[language]
  2. Retrieve value at translations[language][key]
  3. Return default (key name) if undefined
  Complexity: O(1) dictionary lookup
```

### Business Logic

#### **UI Text Management**
- Centralized translation object enables:
  - Runtime language switching without page reload
  - Consistent terminology across app
  - Easy addition of new languages
  
#### **Agricultural Domain Terminology**
- Crop names with season indicators (e.g., "Kharif", "Rabi", "Zaid")
- Region-specific terminology (e.g., "किसान" in Hindi)
- Financial terms (e.g., "Profit Margin", "लाभ मार्जिन")

### Optimization Techniques

1. **Flat Structure**: No nested lookups; each key is top-level
2. **Lazy Loading**: Load only active language into React component state
3. **Copy-Paste Friendly**: AI translation workflow optimized for human-in-the-loop verification

---

## 5. `/src/components/LocationMap.tsx` - Interactive Mapping Component

### Algorithms

#### **Nearest Neighbor Search Algorithm**
**Function**: `findRegionByCoordinates(lat: number, lng: number): Region | null`

**Algorithm**:
```
Euclidean Distance Calculation:
  distance = √[(lat_user - lat_region)² + (lng_user - lng_region)²]
  
Nearest Neighbor Search:
  FOR EACH region IN INDIAN_REGIONS:
    Calculate distance from user location
    IF distance < currentMinDistance:
      UPDATE: nearest = region, minDistance = distance
  
Distance Threshold Filtering:
  IF minDistance < 5 degrees:
    RETURN nearest region
  ELSE:
    RETURN null (user too far from any defined region)
```

**Complexity**: O(n) linear search through INDIAN_REGIONS array (n ≈ 4 regions)

**Mathematical Basis**:
- Uses approximate Euclidean distance (not geodetic; good enough for India's continental scale)
- Threshold of 5 degrees (~555 km at equator) prevents false positives

#### **Geolocation API Integration**
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    latitude, longitude = position.coords
    RETURN coordinates to handleMapClick()
  },
  enableHighAccuracy: true
)
```
- **Async Pattern**: Callback-based geolocation with error handling
- **High Accuracy Mode**: Sacrifices battery for precision (needed for region detection)

#### **Interactive Map Event Handling**
```
User Click on Map → onMapClick(lat, lng)
  ├─ Call findRegionByCoordinates()
  ├─ IF region found:
  │   └─ Trigger onRegionSelect(region)
  └─ ELSE:
      └─ Do nothing (user click outside defined regions)

User Click on Marker → Click event handler
  └─ Trigger onRegionSelect(region)

User Click Location Button → requestLocation()
  ├─ Request geolocation permission
  ├─ Get coordinates
  ├─ Update userLocation state
  ├─ Animate map to user position
  └─ Attempt region detection
```

### Data Structures

#### **React Component Props**
```typescript
interface LocationMapProps {
  onRegionSelect: (region: Region) => void;
  language: string;
  t: any; // Translation object
}
```
- **Type**: React props interface
- **Pattern**: Callback injection for parent communication

#### **Internal State**
```typescript
const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
const [isLocating, setIsLocating] = useState<boolean>(false);
```
- **Type**: React hooks for component state
- **Purpose**: Track user's current location and loading status

#### **Map Configuration**
```typescript
center={[20.5937, 78.9629]}  // Geographic center of India
zoom={4}                      // Continental view level
```

### Business Logic

#### **Custom Marker System**
- **Green Markers**: Predefined region points
- **Blue Markers**: User's current location
- **Popup Content**: Region metadata (temperature, rainfall, soil, season)

#### **Three Map Interaction Modes**
1. **Direct Click**: Click anywhere on map → find nearest region
2. **Marker Click**: Click on green region marker → jump to that region
3. **Geolocation**: Click location button → auto-detect and select region

#### **Multi-Language Support**
- Region names fetched via: `getRegionName(region, language)`
- Map labels translated for 6 languages (en, hi, ta, te, bn, mr)
- Popup content includes: "My Location" label in user's language

### Optimization Techniques

1. **Lazy Marker Rendering**: Only render 4 region markers (hardcoded sample regions)
2. **Event Debouncing**: Map clicks handled via React-Leaflet's event system (native)
3. **Icon Optimization**: L.Icon objects created once and reused (not recreated on render)
4. **Conditional Rendering**: User location marker only renders if `userLocation !== null`

---

## 6. `/src/data/indianRegions.ts` - Regional Data Management

### Data Structures

#### **Region Interface**
```typescript
interface Region {
  id: string;                    // Unique identifier
  name: { [key: string]: string };  // Multi-language names
  lat: number;                   // Latitude coordinate
  lng: number;                   // Longitude coordinate
  temp: number;                  // Average temperature (°C)
  rainfall: number;              // Annual rainfall (mm)
  soil: string;                  // Dominant soil type
  seasons: string[];             // Array of suitable seasons
  climate: string;               // Climate classification
}
```
- **Type**: Typed object with localized metadata
- **Multi-Lingual Mapping**: name field supports 6 languages with fallback to 'en'
- **Agronomic Metadata**: Temperature, rainfall, and soil for crop recommendations

#### **INDIAN_REGIONS Array**
```typescript
export const INDIAN_REGIONS: Region[] = [
  {
    id: 'punjab',
    name: { en: 'Punjab', hi: 'पंजाब', ta: 'பஞ்சாப்', ... },
    lat: 31.1471,
    lng: 75.3412,
    temp: 22,
    rainfall: 650,
    soil: 'alluvial',
    seasons: ['rabi', 'kharif'],
    climate: 'Semi-arid'
  },
  // 3 additional regions (Haryana, Vidarbha-Maharashtra, Konkan-Goa)
]
```
- **Size**: 4 region entries (sample data; full India has 28+ states)
- **Purpose**: Seed data for geospatial queries and region-specific recommendations
- **Extensibility**: Can be extended to full 28 states with additional coordinates

### Algorithms

#### **Nearest Neighbor Search (Imported from LocationMap)**
```typescript
export const findRegionByCoordinates = (lat: number, lng: number): Region | null => {
  let nearest: Region | null = null;
  let minDistance = Infinity;

  INDIAN_REGIONS.forEach(region => {
    const distance = Math.sqrt(
      Math.pow(region.lat - lat, 2) + 
      Math.pow(region.lng - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = region;
    }
  });

  return minDistance < 5 ? nearest : null;
};
```

#### **Language-Based Name Resolution**
```typescript
export const getRegionName = (region: Region, lang: string): string => {
  return region.name[lang] || region.name['en'];  // Fallback to English
};
```
- **Complexity**: O(1) dictionary lookup with fallback logic
- **Robustness**: Returns English if language not supported
- **Use Case**: Map popups, region selection displays

### Data Structures

#### **Season Classification**
- Stored as string array: `['rabi', 'kharif']`
- Enables multi-season region support
- Cross-referenced in crop recommendation algorithms

#### **Climate Classification Enum** (Implicit)
- Values: "Semi-arid", "Tropical", "Tropical Wet"
- Affects disease risk assessment and irrigation planning

### Business Logic

#### **Geographic Scope**
- **Sample Data**: 4 strategic regions covering North, Central, West, and Coastal India
- **Punjab**: Wheat-Rice belt (green revolution region)
- **Vidarbha, Maharashtra**: Cotton-Sugarcane region (tropical)
- **Konkan Coast, Goa**: High-rainfall Western Ghats (3000mm+)
- **Haryana**: Delhi Border region (commercial agriculture)

#### **Multi-Language Region Names**
```typescript
// Example for Punjab region:
name: {
  en: 'Punjab',
  hi: 'पंजाब',
  ta: 'பஞ்சாப்',
  te: 'పంజాబ్',
  bn: 'পাঞ্জাব',
  mr: 'पंजाब'
}
```
- **Pattern**: Direct string mapping (not transliteration)
- **Completeness**: All 6 supported languages included for every region

### Optimization Techniques

1. **Hardcoded Region Coordinates**: Avoids geocoding API calls
2. **Array-Based Storage**: O(n) linear search (acceptable for small n=4)
3. **ID-Based Unique Identification**: Enables caching in parent components
4. **Stateless Functions**: `findRegionByCoordinates()` and `getRegionName()` are pure functions

---

## Summary of Key Patterns

### Algorithmic Patterns
1. **Threshold-Based Classification**: Used in crop recommendation (rainfall > 600mm, etc.)
2. **Lookup Table Optimization**: Hash maps for price/yield data (O(1) access)
3. **Nearest Neighbor Search**: Euclidean distance for geolocation
4. **Conditional Aggregation**: Cost-profit calculation via summation formulas
5. **Multi-Factor Scoring**: Crop compatibility based on 5+ environmental factors

### Data Structure Patterns
1. **Typed Interfaces**: Strong typing throughout (TypeScript)
2. **Nested Dictionaries**: Translations with language keys
3. **Array of Objects**: Crops, states, regions, feedback
4. **Union Types**: Language selection, risk levels, weather types
5. **Optional Fields**: Fallback support (e.g., reply? in Feedback)

### Business Logic Patterns
1. **Role-Based Access**: Farmer vs. Customer workflows
2. **Multi-Language Support**: 6 languages with English fallback
3. **Graceful Degradation**: Fallback to mock data if API unavailable
4. **Real-Time Messaging**: Socket.io for farmer-customer communication
5. **Geospatial Awareness**: Location-based recommendations

### Optimization Patterns
1. **Memoization**: React hooks (useCallback) for expensive operations
2. **Lazy Loading**: Conditional API calls based on configuration
3. **Data Localization**: Pre-computed CROP_DATABASE to minimize requests
4. **Event Throttling**: Map event handlers (native leaflet optimization)
5. **Simulated Delays**: API simulation for testing without backend

---

## Performance Considerations

| Component | Operation | Complexity | Optimization |
|-----------|-----------|-----------|--------------|
| Crop Recommendation | Filter + Score | O(n) | Predefined database |
| Cost-Profit Calc | Sum costs | O(1) | Direct formula |
| Region Detection | Nearest neighbor | O(n) | Small n=4 |
| Translation Lookup | Get by key | O(1) | Hash map |
| Feedback Management | CRUD | O(n) | In-memory array |
| Map Rendering | Marker display | O(n markers) | Lazy loading |

---

## Scalability Notes

### Current Limitations
1. **Crop Database**: 22 hardcoded crops (should be 200+)
2. **Regions**: 4 sample regions (should be 28+ states)
3. **Feedback Storage**: In-memory array (needs database)
4. **API Simulation**: Mock data (needs real Gemini API integration)

### Recommended Improvements
1. Migrate CROP_DATABASE to indexed database (search by soil type, season)
2. Implement Redis caching for translation lookups
3. Use PostGIS for geographic queries instead of Euclidean distance
4. Add pagination for feedback lists (currently unbounded)
5. Implement real Gemini API calls with rate limiting

---

**Document Generated**: March 2026  
**Last Updated**: Analysis of production-ready codebase
