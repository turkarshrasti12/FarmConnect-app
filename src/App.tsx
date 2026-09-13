import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sprout, 
  ShoppingCart, 
  MessageSquare, 
  User, 
  Globe, 
  Search, 
  Camera, 
  Thermometer, 
  CloudRain, 
  Calendar, 
  MapPin, 
  ArrowRight,
  Send,
  X,
  AlertTriangle,
  TrendingUp,
  Droplets,
  Wind,
  Phone,
  Newspaper,
  Book,
  Calculator,
  Plus,
  PhoneCall,
  LayoutDashboard,
  LogOut,
  Info,
  Download,
  Star,
  Mail,
  ArrowLeft,
  Home,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Activity,
  Zap,
  Users,
  BookOpen,
  Layers,
  Clock,
  Maximize,
  Leaf,
  FlaskConical,
  TrendingDown,
  BarChart3,
  Settings,
  ArrowUpDown,
  Languages,
  Paperclip,
  Moon,
  Sun,
  MoreHorizontal
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io, Socket } from 'socket.io-client';
import { analyzeSoilAndRecommendCrop, translateNewsContent, analyzePestWithAI, analyzeSoilTypeWithAI } from './services/geminiService';
import { translations, Language } from './services/translations';
import { apiService, Feedback, CostProfitParams, CostProfitResult, CropRecommendation } from './services/apiService';
import { INDIAN_REGIONS, Region, getRegionName } from './data/indianRegions';
import { PEST_DATABASE, matchPestByCharacteristics } from './data/pestDatabase';
import LocationMap from './components/LocationMap';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  farmer: string;
  location: string;
  image: string;
}

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

interface DiseaseInfo {
  name: string;
  symptoms: string;
  prevention: string;
}

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

const CROP_DATABASE: CropInfo[] = [
  { name: 'Wheat', season: 'Rabi', duration: '120-150 days', soil: 'Loamy', water: 'Moderate', description: 'Major staple crop in North India. Requires cool weather during growing season.', demand: 9, profit: 7, cost: 5, type: 'Crop' },
  { name: 'Rice', season: 'Kharif', duration: '100-150 days', soil: 'Clayey', water: 'High', description: 'Grown in high rainfall areas. Needs standing water for growth.', demand: 10, profit: 8, cost: 6, type: 'Crop' },
  { name: 'Cotton', season: 'Kharif', duration: '160-180 days', soil: 'Black soil', water: 'Moderate', description: 'Important cash crop. Thrives in deep black soil with good drainage.', demand: 8, profit: 9, cost: 7, type: 'Crop' },
  { name: 'Sugarcane', season: 'Annual', duration: '10-12 months', soil: 'Alluvial', water: 'High', description: 'Major source of sugar. Requires hot and humid climate.', demand: 9, profit: 8, cost: 8, type: 'Crop' },
  { name: 'Mustard', season: 'Rabi', duration: '110-140 days', soil: 'Sandy loam', water: 'Low', description: 'Oilseed crop. Grown in dry and cool climate.', demand: 7, profit: 7, cost: 4, type: 'Crop' },
  { name: 'Maize', season: 'Kharif', duration: '90-110 days', soil: 'Alluvial', water: 'Moderate', description: 'Used as both food and fodder. Grows well in old alluvial soil.', demand: 8, profit: 6, cost: 5, type: 'Crop' },
  { name: 'Gram', season: 'Rabi', duration: '90-120 days', soil: 'Sandy loam', water: 'Low', description: 'Important pulse crop. Needs cool climate and low rainfall.', demand: 7, profit: 8, cost: 4, type: 'Crop' },
  { name: 'Soybean', season: 'Kharif', duration: '100-120 days', soil: 'Black/Loamy', water: 'Moderate', description: 'High protein crop. Grows well in well-drained soils.', demand: 8, profit: 7, cost: 5, type: 'Crop' },
  { name: 'Mango', season: 'Annual', duration: '3-4 months (Fruit)', soil: 'Alluvial/Laterite', water: 'Moderate', description: 'The king of fruits. Thrives in tropical and subtropical climates.', demand: 9, profit: 10, cost: 6, type: 'Fruit' },
  { name: 'Apple', season: 'Annual', duration: '4-5 months (Fruit)', soil: 'Loamy', water: 'Moderate', description: 'Grown in temperate regions like Himachal and Kashmir.', demand: 9, profit: 10, cost: 8, type: 'Fruit' },
  { name: 'Tomato', season: 'Annual', duration: '60-80 days', soil: 'Sandy loam', water: 'Moderate', description: 'Versatile vegetable grown year-round in various regions.', demand: 10, profit: 7, cost: 4, type: 'Vegetable' },
  { name: 'Potato', season: 'Rabi', duration: '90-120 days', soil: 'Sandy loam', water: 'Moderate', description: 'Staple vegetable. Requires cool weather and well-drained soil.', demand: 10, profit: 6, cost: 5, type: 'Vegetable' },
  { name: 'Onion', season: 'Rabi/Kharif', duration: '120-150 days', soil: 'Sandy loam', water: 'Moderate', description: 'Essential kitchen ingredient. Grown in various states.', demand: 10, profit: 8, cost: 5, type: 'Vegetable' },
  { name: 'Chilli', season: 'Kharif', duration: '150-180 days', soil: 'Black/Loamy', water: 'Moderate', description: 'Spicy addition to food. Thrives in warm and humid climate.', demand: 8, profit: 9, cost: 4, type: 'Vegetable' },
  { name: 'Turmeric', season: 'Annual', duration: '7-9 months', soil: 'Sandy loam', water: 'High', description: 'Important spice and medicinal plant. Requires hot and humid climate.', demand: 9, profit: 9, cost: 6, type: 'Crop' },
  { name: 'Coffee', season: 'Annual', duration: '3-4 years (Initial)', soil: 'Laterite', water: 'High', description: 'Beverage crop grown in hilly regions of South India.', demand: 9, profit: 10, cost: 9, type: 'Crop' },
  { name: 'Tea', season: 'Annual', duration: '3-4 years (Initial)', soil: 'Loamy', water: 'High', description: 'Major export crop. Requires high rainfall and cool climate.', demand: 10, profit: 9, cost: 9, type: 'Crop' },
  { name: 'Banana', season: 'Annual', duration: '12-15 months', soil: 'Alluvial/Volcanic', water: 'High', description: 'Grown in tropical regions. Requires high humidity.', demand: 9, profit: 8, cost: 5, type: 'Fruit' },
  { name: 'Grapes', season: 'Annual', duration: '3-4 months (Fruit)', soil: 'Sandy loam', water: 'Moderate', description: 'Grown in regions like Maharashtra and Karnataka.', demand: 8, profit: 10, cost: 7, type: 'Fruit' },
  { name: 'Cauliflower', season: 'Rabi', duration: '90-120 days', soil: 'Loamy', water: 'Moderate', description: 'Winter vegetable. Requires cool and moist climate.', demand: 8, profit: 7, cost: 4, type: 'Vegetable' },
  { name: 'Hybrid Paddy Seeds', season: 'Kharif', duration: 'N/A', soil: 'N/A', water: 'N/A', description: 'High-yielding hybrid seeds for better productivity.', demand: 9, profit: 8, cost: 7, type: 'Seed' },
  { name: 'Bt Cotton Seeds', season: 'Kharif', duration: 'N/A', soil: 'N/A', water: 'N/A', description: 'Genetically modified seeds resistant to bollworms.', demand: 9, profit: 9, cost: 8, type: 'Seed' },
];

const KISAN_NEWS = [
  { 
    id: 1, 
    title: 'New MSP announced for Rabi crops', 
    date: '2026-03-18', 
    summary: 'The government has increased the Minimum Support Price for wheat and mustard.',
    content: 'The Cabinet Committee on Economic Affairs (CCEA) has approved the increase in the Minimum Support Prices (MSP) for all mandated Rabi crops for Marketing Season 2026-27. The highest increase has been announced for mustard and wheat. This move aims to ensure remunerative prices to the growers for their produce and encourage crop diversification.'
  },
  { 
    id: 2, 
    title: 'Monsoon forecast: Normal rainfall expected', 
    date: '2026-03-15', 
    summary: 'IMD predicts a healthy monsoon season for the upcoming Kharif crops.',
    content: 'The India Meteorological Department (IMD) has released its first long-range forecast for the 2026 Southwest Monsoon. According to the report, India is likely to receive normal rainfall this year, which is a positive sign for the agricultural sector, especially for Kharif crops like rice, pulses, and oilseeds.'
  },
  { 
    id: 3, 
    title: 'Organic farming subsidies increased', 
    date: '2026-03-12', 
    summary: 'Farmers can now claim up to 50% subsidy on organic fertilizers.',
    content: 'To promote sustainable agriculture, the Ministry of Agriculture has announced an increase in subsidies for organic farming inputs. Farmers adopting organic practices can now avail up to 50% subsidy on the purchase of bio-fertilizers, vermicompost, and other organic inputs through the Paramparagat Krishi Vikas Yojana (PKVY).'
  },
];

const INDIAN_STATES: StateData[] = [
  { 
    name: 'Andhra Pradesh', 
    temp: 31, 
    humidity: 75, 
    rainfall: 40, 
    wind: 12, 
    moisture: 70, 
    risk: 'Low', 
    crops: ['Rice', 'Cotton', 'Chilli'], 
    prices: [{ crop: 'Chilli', price: '₹18,000/q', trend: 'up' }], 
    gradient: 'from-orange-400 to-red-500',
    weather: 'sunny',
    diseases: [
      { name: 'Blast of Rice', symptoms: 'Spindle-shaped spots with gray centers on leaves.', prevention: 'Use resistant varieties and balanced nitrogen application.' },
      { name: 'Chilli Leaf Curl', symptoms: 'Leaves curl upwards and become stunted.', prevention: 'Control whiteflies using yellow sticky traps and neem oil.' }
    ]
  },
  { 
    name: 'Arunachal Pradesh', 
    temp: 22, 
    humidity: 80, 
    rainfall: 150, 
    wind: 8, 
    moisture: 85, 
    risk: 'Medium', 
    crops: ['Rice', 'Maize', 'Millet'], 
    prices: [{ crop: 'Rice', price: '₹2,200/q', trend: 'up' }], 
    gradient: 'from-emerald-400 to-teal-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Maize Turcicum Leaf Blight', symptoms: 'Long, elliptical, grayish-green or tan lesions on leaves.', prevention: 'Crop rotation and application of mancozeb.' }
    ]
  },
  { 
    name: 'Assam', 
    temp: 28, 
    humidity: 85, 
    rainfall: 180, 
    wind: 10, 
    moisture: 90, 
    risk: 'Medium', 
    crops: ['Tea', 'Rice', 'Jute'], 
    prices: [{ crop: 'Tea', price: '₹250/kg', trend: 'up' }], 
    gradient: 'from-green-500 to-emerald-600',
    weather: 'rainy',
    diseases: [
      { name: 'Tea Red Rust', symptoms: 'Orange-red circular spots on leaves.', prevention: 'Improve drainage and apply copper-based fungicides.' },
      { name: 'Rice Sheath Blight', symptoms: 'Large, oval, greenish-gray spots on leaf sheaths.', prevention: 'Avoid excessive nitrogen and use validamycin.' }
    ]
  },
  { 
    name: 'Bihar', 
    temp: 30, 
    humidity: 70, 
    rainfall: 60, 
    wind: 12, 
    moisture: 75, 
    risk: 'Low', 
    crops: ['Rice', 'Wheat', 'Maize'], 
    prices: [{ crop: 'Wheat', price: '₹2,125/q', trend: 'up' }], 
    gradient: 'from-yellow-500 to-amber-600',
    weather: 'sunny',
    diseases: [
      { name: 'Wheat Rust', symptoms: 'Orange or brown pustules on leaves and stems.', prevention: 'Grow resistant varieties like HD 2967.' }
    ]
  },
  { 
    name: 'Chhattisgarh', 
    temp: 32, 
    humidity: 60, 
    rainfall: 80, 
    wind: 10, 
    moisture: 70, 
    risk: 'Low', 
    crops: ['Rice', 'Maize', 'Soybean'], 
    prices: [{ crop: 'Rice', price: '₹2,040/q', trend: 'up' }], 
    gradient: 'from-amber-500 to-orange-600',
    weather: 'sunny',
    diseases: [
      { name: 'Soybean Rust', symptoms: 'Small, tan to dark brown spots on the underside of leaves.', prevention: 'Early planting and use of fungicides.' }
    ]
  },
  { 
    name: 'Goa', 
    temp: 30, 
    humidity: 80, 
    rainfall: 200, 
    wind: 15, 
    moisture: 85, 
    risk: 'Low', 
    crops: ['Rice', 'Cashew', 'Coconut'], 
    prices: [{ crop: 'Cashew', price: '₹120/kg', trend: 'up' }], 
    gradient: 'from-blue-400 to-indigo-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Coconut Bud Rot', symptoms: 'Yellowing of the youngest leaf and rotting of the bud.', prevention: 'Remove affected parts and apply Bordeaux paste.' }
    ]
  },
  { 
    name: 'Gujarat', 
    temp: 34, 
    humidity: 40, 
    rainfall: 5, 
    wind: 18, 
    moisture: 40, 
    risk: 'High', 
    crops: ['Cotton', 'Groundnut', 'Cumin'], 
    prices: [{ crop: 'Cumin', price: '₹35,000/q', trend: 'up' }], 
    gradient: 'from-yellow-500 to-amber-600',
    weather: 'sunny',
    diseases: [
      { name: 'Cotton Wilt', symptoms: 'Yellowing and drooping of leaves, leading to plant death.', prevention: 'Seed treatment with Trichoderma viride.' },
      { name: 'Cumin Blight', symptoms: 'Dark brown spots on leaves and stems.', prevention: 'Spray with Mancozeb or Carbendazim.' }
    ]
  },
  { 
    name: 'Haryana', 
    temp: 29, 
    humidity: 50, 
    rainfall: 15, 
    wind: 12, 
    moisture: 55, 
    risk: 'Low', 
    crops: ['Wheat', 'Rice', 'Mustard'], 
    prices: [{ crop: 'Wheat', price: '₹2,125/q', trend: 'up' }], 
    gradient: 'from-amber-400 to-yellow-500',
    weather: 'sunny',
    diseases: [
      { name: 'Mustard White Rust', symptoms: 'White, creamy pustules on the underside of leaves.', prevention: 'Seed treatment and crop rotation.' }
    ]
  },
  { 
    name: 'Himachal Pradesh', 
    temp: 18, 
    humidity: 60, 
    rainfall: 40, 
    wind: 10, 
    moisture: 65, 
    risk: 'Low', 
    crops: ['Apple', 'Maize', 'Wheat'], 
    prices: [{ crop: 'Apple', price: '₹80/kg', trend: 'up' }], 
    gradient: 'from-red-400 to-rose-500',
    weather: 'sunny',
    diseases: [
      { name: 'Apple Scab', symptoms: 'Velvety brown or olive-green spots on leaves and fruit.', prevention: 'Pruning and application of fungicides like Captan.' }
    ]
  },
  { 
    name: 'Jharkhand', 
    temp: 31, 
    humidity: 65, 
    rainfall: 70, 
    wind: 10, 
    moisture: 70, 
    risk: 'Low', 
    crops: ['Rice', 'Maize', 'Pulses'], 
    prices: [{ crop: 'Rice', price: '₹2,040/q', trend: 'up' }], 
    gradient: 'from-stone-500 to-stone-700',
    weather: 'cloudy',
    diseases: [
      { name: 'Rice Brown Spot', symptoms: 'Small, circular to oval, dark brown spots on leaves.', prevention: 'Balanced fertilization and seed treatment.' }
    ]
  },
  { 
    name: 'Karnataka', 
    temp: 28, 
    humidity: 70, 
    rainfall: 50, 
    wind: 14, 
    moisture: 75, 
    risk: 'Low', 
    crops: ['Coffee', 'Rice', 'Sugarcane'], 
    prices: [{ crop: 'Coffee', price: '₹300/kg', trend: 'up' }], 
    gradient: 'from-blue-500 to-cyan-600',
    weather: 'sunny',
    diseases: [
      { name: 'Coffee Leaf Rust', symptoms: 'Yellow-orange powdery spots on the underside of leaves.', prevention: 'Planting resistant varieties and copper sprays.' }
    ]
  },
  { 
    name: 'Kerala', 
    temp: 29, 
    humidity: 85, 
    rainfall: 250, 
    wind: 12, 
    moisture: 90, 
    risk: 'Medium', 
    crops: ['Rubber', 'Coconut', 'Spices'], 
    prices: [{ crop: 'Pepper', price: '₹500/kg', trend: 'up' }], 
    gradient: 'from-emerald-600 to-green-700',
    weather: 'rainy',
    diseases: [
      { name: 'Rubber Abnormal Leaf Fall', symptoms: 'Premature falling of leaves during monsoon.', prevention: 'Prophylactic spraying with Bordeaux mixture.' }
    ]
  },
  { 
    name: 'Madhya Pradesh', 
    temp: 33, 
    humidity: 45, 
    rainfall: 20, 
    wind: 12, 
    moisture: 50, 
    risk: 'Medium', 
    crops: ['Soybean', 'Wheat', 'Gram'], 
    prices: [{ crop: 'Soybean', price: '₹4,500/q', trend: 'up' }], 
    gradient: 'from-orange-500 to-amber-600',
    weather: 'sunny',
    diseases: [
      { name: 'Gram Wilt', symptoms: 'Sudden drooping and yellowing of leaves.', prevention: 'Seed treatment with Carbendazim and crop rotation.' }
    ]
  },
  { 
    name: 'Maharashtra', 
    temp: 32, 
    humidity: 65, 
    rainfall: 45, 
    wind: 15, 
    moisture: 75, 
    risk: 'Medium', 
    crops: ['Sugarcane', 'Cotton', 'Soybean'], 
    prices: [{ crop: 'Cotton', price: '₹7,500/q', trend: 'down' }], 
    gradient: 'from-orange-500 to-red-600',
    weather: 'sunny',
    diseases: [
      { name: 'Sugarcane Red Rot', symptoms: 'Reddening of internal tissues with white cross bands.', prevention: 'Use healthy setts and crop rotation.' }
    ]
  },
  { 
    name: 'Manipur', 
    temp: 24, 
    humidity: 80, 
    rainfall: 120, 
    wind: 8, 
    moisture: 80, 
    risk: 'Low', 
    crops: ['Rice', 'Maize', 'Pulses'], 
    prices: [{ crop: 'Rice', price: '₹2,100/q', trend: 'up' }], 
    gradient: 'from-pink-400 to-rose-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Rice Neck Blast', symptoms: 'Brownish lesions on the neck of the panicle.', prevention: 'Spray with Tricyclazole.' }
    ]
  },
  { 
    name: 'Meghalaya', 
    temp: 22, 
    humidity: 90, 
    rainfall: 300, 
    wind: 10, 
    moisture: 95, 
    risk: 'Medium', 
    crops: ['Rice', 'Maize', 'Potato'], 
    prices: [{ crop: 'Potato', price: '₹1,500/q', trend: 'up' }], 
    gradient: 'from-blue-600 to-indigo-700',
    weather: 'rainy',
    diseases: [
      { name: 'Potato Late Blight', symptoms: 'Water-soaked spots on leaves that turn brown/black.', prevention: 'Spray with Mancozeb or Metalaxyl.' }
    ]
  },
  { 
    name: 'Mizoram', 
    temp: 23, 
    humidity: 85, 
    rainfall: 200, 
    wind: 8, 
    moisture: 90, 
    risk: 'Low', 
    crops: ['Rice', 'Maize', 'Ginger'], 
    prices: [{ crop: 'Ginger', price: '₹8,000/q', trend: 'up' }], 
    gradient: 'from-purple-400 to-violet-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Ginger Soft Rot', symptoms: 'Yellowing of leaves and rotting of rhizomes.', prevention: 'Soil solarization and seed treatment with Mancozeb.' }
    ]
  },
  { 
    name: 'Nagaland', 
    temp: 21, 
    humidity: 80, 
    rainfall: 180, 
    wind: 8, 
    moisture: 85, 
    risk: 'Low', 
    crops: ['Rice', 'Maize', 'Millet'], 
    prices: [{ crop: 'Rice', price: '₹2,200/q', trend: 'up' }], 
    gradient: 'from-indigo-400 to-blue-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Maize Downy Mildew', symptoms: 'Chlorotic streaks on leaves and white downy growth.', prevention: 'Seed treatment with Metalaxyl.' }
    ]
  },
  { 
    name: 'Odisha', 
    temp: 31, 
    humidity: 75, 
    rainfall: 100, 
    wind: 14, 
    moisture: 80, 
    risk: 'Medium', 
    crops: ['Rice', 'Sugarcane', 'Oilseeds'], 
    prices: [{ crop: 'Rice', price: '₹2,040/q', trend: 'up' }], 
    gradient: 'from-teal-400 to-emerald-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Rice Bacterial Leaf Blight', symptoms: 'Yellowish-green wavy streaks on leaf margins.', prevention: 'Balanced nitrogen and use of bleaching powder.' }
    ]
  },
  { 
    name: 'Punjab', 
    temp: 28, 
    humidity: 45, 
    rainfall: 12, 
    wind: 10, 
    moisture: 60, 
    risk: 'Low', 
    crops: ['Wheat', 'Rice', 'Cotton'], 
    prices: [{ crop: 'Wheat', price: '₹2,125/q', trend: 'up' }], 
    gradient: 'from-amber-500 to-orange-600',
    weather: 'sunny',
    diseases: [
      { name: 'Wheat Yellow Rust', symptoms: 'Yellow pustules arranged in linear stripes on leaves.', prevention: 'Grow resistant varieties and spray Propiconazole.' }
    ]
  },
  { 
    name: 'Rajasthan', 
    temp: 38, 
    humidity: 30, 
    rainfall: 2, 
    wind: 20, 
    moisture: 30, 
    risk: 'High', 
    crops: ['Bajra', 'Mustard', 'Wheat'], 
    prices: [{ crop: 'Bajra', price: '₹2,350/q', trend: 'up' }], 
    gradient: 'from-orange-600 to-red-700',
    weather: 'sunny',
    diseases: [
      { name: 'Bajra Ergot', symptoms: 'Pinkish or honey-colored fluid exuding from spikelets.', prevention: 'Seed treatment with brine solution.' }
    ]
  },
  { 
    name: 'Sikkim', 
    temp: 15, 
    humidity: 85, 
    rainfall: 150, 
    wind: 10, 
    moisture: 90, 
    risk: 'Low', 
    crops: ['Cardamom', 'Ginger', 'Rice'], 
    prices: [{ crop: 'Cardamom', price: '₹1,200/kg', trend: 'up' }], 
    gradient: 'from-green-400 to-emerald-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Cardamom Chirke', symptoms: 'Mosaic mottling and streaks on leaves.', prevention: 'Remove and destroy infected plants.' }
    ]
  },
  { 
    name: 'Tamil Nadu', 
    temp: 30, 
    humidity: 70, 
    rainfall: 25, 
    wind: 12, 
    moisture: 80, 
    risk: 'Low', 
    crops: ['Rice', 'Coconut', 'Sugarcane'], 
    prices: [{ crop: 'Rice', price: '₹1,900/q', trend: 'up' }], 
    gradient: 'from-blue-500 to-indigo-600',
    weather: 'sunny',
    diseases: [
      { name: 'Rice Tungro Virus', symptoms: 'Stunting and yellowing/orange discoloration of leaves.', prevention: 'Control leafhoppers using insecticides.' }
    ]
  },
  { 
    name: 'Telangana', 
    temp: 33, 
    humidity: 55, 
    rainfall: 30, 
    wind: 12, 
    moisture: 60, 
    risk: 'Low', 
    crops: ['Rice', 'Cotton', 'Maize'], 
    prices: [{ crop: 'Cotton', price: '₹7,500/q', trend: 'up' }], 
    gradient: 'from-rose-500 to-pink-600',
    weather: 'sunny',
    diseases: [
      { name: 'Cotton Bacterial Blight', symptoms: 'Angular water-soaked spots on leaves.', prevention: 'Seed treatment with Streptocycline.' }
    ]
  },
  { 
    name: 'Tripura', 
    temp: 27, 
    humidity: 80, 
    rainfall: 150, 
    wind: 10, 
    moisture: 85, 
    risk: 'Low', 
    crops: ['Rice', 'Rubber', 'Tea'], 
    prices: [{ crop: 'Rubber', price: '₹160/kg', trend: 'up' }], 
    gradient: 'from-emerald-400 to-green-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Rice False Smut', symptoms: 'Greenish-black velvety balls on grains.', prevention: 'Spray with Copper Oxychloride.' }
    ]
  },
  { 
    name: 'Uttar Pradesh', 
    temp: 31, 
    humidity: 60, 
    rainfall: 40, 
    wind: 12, 
    moisture: 65, 
    risk: 'Low', 
    crops: ['Wheat', 'Sugarcane', 'Rice'], 
    prices: [{ crop: 'Sugarcane', price: '₹350/q', trend: 'up' }], 
    gradient: 'from-amber-600 to-yellow-700',
    weather: 'sunny',
    diseases: [
      { name: 'Sugarcane Smut', symptoms: 'Black whip-like structure from the apex of the stem.', prevention: 'Hot water treatment of setts.' }
    ]
  },
  { 
    name: 'Uttarakhand', 
    temp: 20, 
    humidity: 65, 
    rainfall: 60, 
    wind: 10, 
    moisture: 70, 
    risk: 'Low', 
    crops: ['Rice', 'Wheat', 'Maize'], 
    prices: [{ crop: 'Rice', price: '₹2,040/q', trend: 'up' }], 
    gradient: 'from-sky-400 to-blue-500',
    weather: 'cloudy',
    diseases: [
      { name: 'Maize Banded Leaf and Sheath Blight', symptoms: 'Concentric bands of straw-colored lesions on leaves.', prevention: 'Seed treatment and spray with validamycin.' }
    ]
  },
  { 
    name: 'West Bengal', 
    temp: 29, 
    humidity: 85, 
    rainfall: 120, 
    wind: 8, 
    moisture: 90, 
    risk: 'Medium', 
    crops: ['Rice', 'Jute', 'Tea'], 
    prices: [{ crop: 'Jute', price: '₹4,500/q', trend: 'up' }], 
    gradient: 'from-emerald-500 to-teal-600',
    weather: 'rainy',
    diseases: [
      { name: 'Jute Stem Rot', symptoms: 'Brownish-black lesions on the stem near the soil line.', prevention: 'Seed treatment and balanced potash application.' }
    ]
  },
];

const KISAN_SUVIDHA_DATA = {
  schemes: [
    {
      id: 1,
      name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      description: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.',
      eligibility: 'All landholding farmer families in the country are eligible. Exclusion criteria apply to higher income status individuals, institutional landholders, and professionals.',
      documents: 'Aadhar Card, Land Ownership Documents, Bank Account Details'
    },
    {
      id: 2,
      name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      description: 'Crop insurance scheme to provide financial support to farmers suffering crop loss/damage arising out of natural calamities.',
      eligibility: 'All farmers including sharecroppers and tenant farmers growing the notified crops in the notified areas are eligible.',
      documents: 'Aadhar Card, Land Records (7/12, 8A), Bank Passbook, Sowing Certificate'
    },
    {
      id: 3,
      name: 'Kisan Credit Card (KCC) Scheme',
      description: 'Provides farmers with timely access to credit for their cultivation and other needs at a subsidized interest rate.',
      eligibility: 'All farmers - individuals/joint borrowers who are owner cultivators. Tenant farmers, oral lessees, and sharecroppers. Self-help groups or joint liability groups of farmers.',
      documents: 'Aadhar Card, Land Documents, Passport size photos, Bank Statement'
    },
    {
      id: 4,
      name: 'Pradhan Mantri Krishi Sinchai Yojana (PMKSY)',
      description: 'Aims to expand cultivable area under assured irrigation, improve on-farm water use efficiency, and promote sustainable water conservation practices.',
      eligibility: 'All farmers, including those who have land on lease, are eligible. Priority is given to small and marginal farmers.',
      documents: 'Aadhar Card, Land Documents, Irrigation Plan, Bank Account'
    },
    {
      id: 5,
      name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
      description: 'Promotes organic farming through a cluster-based approach and PGS certification.',
      eligibility: 'Groups of farmers having a minimum of 20 hectares of land in a cluster. Individual farmers within the cluster are eligible for financial assistance.',
      documents: 'Group Registration Certificate, Land Documents, Aadhar Card'
    }
  ],
  loans: [
    {
      id: 1,
      name: 'Agriculture Infrastructure Fund (AIF)',
      description: 'Financing facility for investment in viable projects for post-harvest management infrastructure and community farming assets.',
      eligibility: 'Agri-entrepreneurs, startups, primary agricultural credit societies, farmer producer organizations (FPOs), and self-help groups.',
      documents: 'Project Report, Land Documents, Identity Proof, Address Proof, GST Registration (if applicable)',
      cibilScore: '650+'
    },
    {
      id: 2,
      name: 'Interest Subvention Scheme',
      description: 'Provides short-term credit to farmers at a subsidized interest rate of 7% per annum for loans up to ₹3 lakh.',
      eligibility: 'All small and marginal farmers who avail short-term crop loans from public sector banks, regional rural banks, and cooperative banks.',
      documents: 'KCC Card, Land Records, Aadhar Card, Bank Passbook',
      cibilScore: '600+'
    }
  ]
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userProfile, setUserProfile] = useState({
    name: 'Arsh Rasti',
    location: 'Bhopal, MP',
    phone: '+91 98765 43210',
    email: 'turkarshrasti12@gmail.com'
  });
  const [activeTab, setActiveTab] = useState<'home' | 'marketplace' | 'advisor' | 'chat' | 'profile' | 'tools' | 'news' | 'database' | 'analysis' | 'callcentre' | 'kisan-suvidha' | 'explore-regions' | 'more'>('home');
  const [moreTab, setMoreTab] = useState<'pest-detection' | 'harvest-planner' | 'community' | 'farm-notebook'>('pest-detection');
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: 'room_1', participantName: 'Rajesh Kumar', participantRole: 'farmer', lastMessage: 'The wheat is ready for harvest.', lastTimestamp: Date.now() - 3600000, unreadCount: 2, avatar: 'https://picsum.photos/seed/farmer1/100/100' },
    { id: 'room_2', participantName: 'Suresh Singh', participantRole: 'farmer', lastMessage: 'I can offer a discount on bulk orders.', lastTimestamp: Date.now() - 86400000, unreadCount: 0, avatar: 'https://picsum.photos/seed/farmer2/100/100' },
  ]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const selectedConversationIdRef = useRef<string | null>(null);
  const [convSearchQuery, setConvSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const filteredConversations = conversations.filter(c => 
    c.participantName.toLowerCase().includes(convSearchQuery.toLowerCase())
  );
  const [userType, setUserType] = useState<'farmer' | 'customer'>('customer');
  const [appState, setAppState] = useState<'welcome' | 'auth' | 'dashboard'>('welcome');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    type: 'customer' as 'farmer' | 'customer'
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expandedScheme, setExpandedScheme] = useState<number | null>(null);
  const [expandedLoan, setExpandedLoan] = useState<number | null>(null);
  const [cropSearch, setCropSearch] = useState('');
  const [cropSeasonFilter, setCropSeasonFilter] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState<CropInfo | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [cropSortBy, setCropSortBy] = useState<'name' | 'demand' | 'profit' | 'cost'>('name');
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [translatedNewsContent, setTranslatedNewsContent] = useState<string | null>(null);
  const [isTranslatingNews, setIsTranslatingNews] = useState(false);
  const [isCalling, setIsCalling] = useState<string | null>(null);
  const lastCallerRef = useRef<string | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callHistory, setCallHistory] = useState<{ id: string; name: string; time: string; duration: string }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name');
  const [selectedState, setSelectedState] = useState<StateData | null>(INDIAN_STATES[0]);
  const [city, setCity] = useState('');
  const [isDetectingWeather, setIsDetectingWeather] = useState(false);
  const [chatRoom, setChatRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showChatInfo, setShowChatInfo] = useState(false);
  
  // Advisor State
  const [advisorTab, setAdvisorTab] = useState<'manual' | 'map'>('manual');
  const [soilImage, setSoilImage] = useState<string | null>(null);
  const [soilType, setSoilType] = useState('Loamy');
  const [rainfall, setRainfall] = useState('500');
  const [temp, setTemp] = useState('22');
  const [season, setSeason] = useState('Kharif');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  // NPK and pH values (optional)
  const [npkValues, setNpkValues] = useState({
    nitrogen: '',
    phosphorus: '',
    potassium: ''
  });
  const [phValue, setPhValue] = useState('');
  const [showNutrients, setShowNutrients] = useState(false);

  // Profit Analysis State
  const [analysisParams, setAnalysisParams] = useState<CostProfitParams>({
    crop: 'Wheat',
    area: 1,
    seedCost: 2000,
    fertilizerCost: 5000,
    pesticideCost: 3000,
    laborCost: 10000,
    irrigationCost: 4000,
    transportationCost: 2000,
    miscCost: 1000,
    otherCost: 0
  });
  const [analysisResult, setAnalysisResult] = useState<CostProfitResult | null>(null);

  // Feedback State
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    customerName: '',
    phone: '',
    email: '',
    cropName: '',
    message: '',
    rating: 5
  });

  // Product Listing State
  const [newProduct, setNewProduct] = useState({ name: '', price: '', unit: 'kg', image: '' });
  const [showListingForm, setShowListingForm] = useState(false);

  // New Features State
  const [soilHealthData, setSoilHealthData] = useState({
    phLevel: 6.5,
    nitrogen: 45,
    phosphorus: 38,
    potassium: 42,
    organicMatter: 3.2,
    lastTested: new Date().toISOString()
  });

  const [waterLog, setWaterLog] = useState<Array<{ date: string; amount: number; type: 'rainfall' | 'irrigation' }>>([
    { date: '2026-03-20', amount: 25, type: 'rainfall' },
    { date: '2026-03-18', amount: 50, type: 'irrigation' }
  ]);

  const [farmNotebookEntries, setFarmNotebookEntries] = useState<Array<{ date: string; crop: string; note: string; imageUrl?: string }>>([
    { date: '2026-03-20', crop: 'Wheat', note: 'Applied NPK fertilizer. Plants looking healthy.' },
    { date: '2026-03-18', crop: 'Wheat', note: 'First irrigation completed. Germination rate 95%.' }
  ]);

  const [communityPosts, setCommunityPosts] = useState<Array<{ id: string; author: string; crop: string; title: string; content: string; likes: number; replies: number; timestamp: number }>>([
    {
      id: '1',
      author: 'Rajesh Patel',
      crop: 'Wheat',
      title: 'Best time for second irrigation in spring wheat?',
      content: 'I have spring wheat in its tillering stage. Should I irrigate now?',
      likes: 45,
      replies: 12,
      timestamp: Date.now() - 86400000
    },
    {
      id: '2',
      author: 'Priya Singh',
      crop: 'Rice',
      title: 'Managing stem borer in rice crop',
      content: 'Saw borer symptoms. Using Spinosad 48 SC. Anyone else using this?',
      likes: 67,
      replies: 28,
      timestamp: Date.now() - 172800000
    }
  ]);

  const [harvestPlans, setHarvestPlans] = useState<Array<{ crop: string; plantingDate: string; harvestDate: string; estimatedYield: number; status: 'planning' | 'growing' | 'ready' | 'harvested' }>>([
    { crop: 'Wheat', plantingDate: '2025-10-15', harvestDate: '2026-03-25', estimatedYield: 50, status: 'ready' },
    { crop: 'Rice', plantingDate: '2026-06-01', harvestDate: '2026-10-15', estimatedYield: 60, status: 'planning' }
  ]);

  const [newNotebookEntry, setNewNotebookEntry] = useState({ crop: '', note: '' });
  const [newCommunityPost, setNewCommunityPost] = useState({ crop: '', title: '', content: '' });
  const [newHarvestPlan, setNewHarvestPlan] = useState({ crop: '', plantingDate: '', harvestDate: '', estimatedYield: '' });
  const [pestDetectionImage, setPestDetectionImage] = useState<string | null>(null);

  // Expert Advice & Pest Detection State
  const [showExpertAdviceModal, setShowExpertAdviceModal] = useState(false);
  const [expertAdviceLoading, setExpertAdviceLoading] = useState(false);
  const [expertAdviceContent, setExpertAdviceContent] = useState('');
  const [pestAnalysisLoading, setPestAnalysisLoading] = useState(false);
  const [pestAnalysisResult, setPestAnalysisResult] = useState<string | null>(null);
  const [showPestResultModal, setShowPestResultModal] = useState(false);

  // Forum Interactions State
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedPostForReplies, setSelectedPostForReplies] = useState<string | null>(null);
  const [postReplies, setPostReplies] = useState<Map<string, Array<{ author: string; content: string; timestamp: number }>>>(new Map([
    ['1', [{ author: 'Suresh Sharma', content: 'Wait for tillering complete then irrigate. Avoid waterlogging.', timestamp: Date.now() - 82800000 }, { author: 'Meera Kumari', content: 'Apply irrigation when 50% of tillers visible. Great soil moisture retention.', timestamp: Date.now() - 79200000 }]],
    ['2', [{ author: 'Vikram Singh', content: 'Spinosad is excellent. Also try Beauveria bassiana for better results.', timestamp: Date.now() - 168000000 }]]
  ]));
  const [newReply, setNewReply] = useState({ postId: '', content: '' });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const startChatWithFarmer = (farmerName: string, productName: string) => {
    // 1. Find if a conversation already exists with this farmer
    let existingConv = conversations.find(c => c.participantName === farmerName);
    
    if (!existingConv) {
      // Create a new mock conversation
      const newConvId = `room_${Date.now()}`;
      existingConv = {
        id: newConvId,
        participantName: farmerName,
        participantRole: 'farmer',
        lastMessage: `Interested in ${productName}`,
        lastTimestamp: Date.now(),
        unreadCount: 0,
        avatar: `https://picsum.photos/seed/${farmerName}/100/100`
      };
      setConversations(prev => [existingConv!, ...prev]);
    }
    
    // 2. Select the conversation
    setSelectedConversationId(existingConv.id);
    setChatRoom(existingConv.id);
    if (socket) socket.emit('join_room', existingConv.id);
    
    // 3. Pre-fill the input text
    setInputText(`Hi, I'm interested in your ${productName}. Is it still available?`);
    
    // 4. Switch to chat tab
    setActiveTab('chat');
  };

  // Handler for Get Expert Advice
  const handleGetExpertAdvice = async () => {
    if (!selectedCrop) return;
    
    setExpertAdviceLoading(true);
    setShowExpertAdviceModal(true);
    setExpertAdviceContent('');

    try {
      const prompt = `You are an expert agricultural advisor. Provide detailed expert advice for growing ${selectedCrop.name}. 
      Include:
      1. Optimal planting time and season: ${selectedCrop.season}
      2. Soil requirements: ${selectedCrop.soil}
      3. Water management: ${selectedCrop.water}
      4. Duration: ${selectedCrop.duration}
      5. Key cultivation tips
      6. Common diseases and prevention
      7. Expected yield and profit potential
      8. Market demand for this crop
      
      Be concise but comprehensive. Format with clear sections.`;

      const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        // Mock response when API key is not available
        setExpertAdviceContent(`Expert Advice for ${selectedCrop.name}\n\n1. Best Season: ${selectedCrop.season}\n2. Ideal Soil: ${selectedCrop.soil}\n3. Water Needs: ${selectedCrop.water}\n4. Duration: ${selectedCrop.duration}\n5. Key Tips:\n- Prepare field 2 weeks before planting\n- Use certified seeds for better yield\n- Monitor for diseases regularly\n- Apply balanced NPK fertilizer\n- Practice crop rotation\n\n6. Market Demand: High (${selectedCrop.demand}/10)\nProfit Potential: ${selectedCrop.profit}/10\n\nExpected Yield: 8-12 quintals/hectare`);
      } else {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 500 }
          })
        });
        
        const data = await response.json();
        const advice = data.candidates?.[0]?.content?.parts?.[0]?.text || setExpertAdviceContent(`Expert Advice for ${selectedCrop.name}\n\n1. Best Season: ${selectedCrop.season}\n2. Ideal Soil: ${selectedCrop.soil}\n3. Water Needs: ${selectedCrop.water}\n4. Duration: ${selectedCrop.duration}`);
        setExpertAdviceContent(advice);
      }
    } catch (error) {
      console.error('Error getting expert advice:', error);
      setExpertAdviceContent(`Expert Advice for ${selectedCrop.name}\n\nFailed to fetch AI advice. Here's general guidance:\n\n1. Best Season: ${selectedCrop.season}\n2. Ideal Soil: ${selectedCrop.soil}\n3. Water Needs: ${selectedCrop.water}\n4. Duration: ${selectedCrop.duration}\n\nConsult local agricultural extension centers for personalized advice.`);
    } finally {
      setExpertAdviceLoading(false);
    }
  };

  // Handler for Download Guide
  const handleDownloadGuide = () => {
    if (!selectedCrop) return;

    const guideContent = `
CROP CULTIVATION GUIDE: ${selectedCrop.name}
=============================================

BASIC INFORMATION:
- Crop Name: ${selectedCrop.name}
- Season: ${selectedCrop.season}
- Type: ${selectedCrop.type}
- Duration: ${selectedCrop.duration}
- Ideal Soil: ${selectedCrop.soil}
- Water Requirement: ${selectedCrop.water}

DESCRIPTION:
${selectedCrop.description}

CULTIVATION DETAILS:
1. Soil Preparation:
   - Use ${selectedCrop.soil} soil for best results
   - Prepare field 2-3 weeks before planting
   - Add 10-15 tons of FYM per hectare

2. Planting:
   - Sow seeds at recommended depth
   - Use certified quality seeds
   - Maintain recommended spacing

3. Water Management:
   - Water requirement: ${selectedCrop.water}
   - First irrigation: After germination
   - Subsequent irrigations: As per crop needs

4. Fertilizer Management:
   - Use balanced NPK (Nitrogen:Phosphorus:Potassium)
   - Apply as per soil test report
   - Use organic fertilizers along with inorganic

5. Pest & Disease Management:
   - Monitor field regularly for pests
   - Use integrated pest management
   - Apply fungicides preventively during monsoon

6. Harvesting:
   - Harvest when crop matures (around day 100-${selectedCrop.duration})
   - Use mechanical harvesters if available
   - Harvest early morning for better quality

MARKET INFORMATION:
- Demand Level: ${selectedCrop.demand}/10
- Profit Potential: ${selectedCrop.profit}/10
- Expected Yield: 8-15 quintals/hectare
- Market Trend: Growing

CONTACT SUPPORT:
For more information, contact your local agricultural extension center
or call Kisan Call Centre: 1800-180-1551
Generated: ${new Date().toLocaleString()}
    `.trim();

    // Create and download the file
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(guideContent));
    element.setAttribute('download', `${selectedCrop.name}_Cultivation_Guide.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handler for Pest Detection Analysis - IMPROVED WITH 90% ACCURACY TARGET
  const handleAnalyzePest = async () => {
    if (!pestDetectionImage) return;

    setPestAnalysisLoading(true);
    setShowPestResultModal(true);
    setPestAnalysisResult('');

    try {
      const base64Image = pestDetectionImage.split(',')[1];
      
      // Use new AI pest detection function
      const aiAnalysis = await analyzePestWithAI(base64Image);

      // Get treatment details from pest database if confidence > 50%
      let treatment = '';
      let prevention = '';
      let organic = '';
      let chemical = '';

      if (aiAnalysis.confidence > 50) {
        const pestKey = Object.keys(PEST_DATABASE).find(key => 
          PEST_DATABASE[key].name.toLowerCase() === aiAnalysis.pest.toLowerCase()
        );

        if (pestKey) {
          const pestData = PEST_DATABASE[pestKey];
          prevention = pestData.prevention.slice(0, 3).join('\n- ');
          organic = pestData.organic_treatment.slice(0, 3).join('\n- ');
          chemical = pestData.chemical_treatment.slice(0, 2).join('\n- ');
          
          treatment = `
🎯 PEST DETECTED: ${aiAnalysis.pest}
📊 Confidence: ${aiAnalysis.confidence.toFixed(0)}%
⚠️ Severity: ${aiAnalysis.severity}
🔬 Scientific Name: ${pestData.scientificName}

📸 VISUAL SIGNATURES DETECTED:
${aiAnalysis.visualSignatures.slice(0, 3).map(v => `• ${v}`).join('\n')}

🌾 DAMAGE INDICATORS:
${aiAnalysis.damagePatterns.slice(0, 3).map(d => `• ${d}`).join('\n')}

🛡️ PREVENTION MEASURES:
- ${prevention}

🧪 ORGANIC TREATMENT OPTIONS:
- ${organic}

⚗️ CHEMICAL TREATMENT OPTIONS (if needed):
- ${chemical}

⏰ TIMING: ${pestData.timing}
💰 Potential Yield Loss: ${pestData.yield_loss}

💡 TIP: Early detection and treatment prevent 60-80% of crop loss. Act immediately at first symptoms.

📞 For Emergency Support: Kisan Call Centre - 1800-180-1551`;
        } else {
          treatment = formatAIAnalysisAsText(aiAnalysis);
        }
      } else {
        // Low confidence - show analysis details
        treatment = formatAIAnalysisAsText(aiAnalysis);
      }

      setPestAnalysisResult(treatment);
    } catch (error) {
      console.error('Error analyzing pest:', error);
      setPestAnalysisResult('⚠️ Error in Analysis\n\nCould not analyze the image. Please:\n1. Check image quality\n2. Ensure proper lighting\n3. Try uploading a different angle\n4. Use close-up image of affected leaf/plant\n\nFor urgent help, call: Kisan Call Centre - 1800-180-1551');
    } finally {
      setPestAnalysisLoading(false);
    }
  };

  // Helper function to format AI analysis as readable text
  const formatAIAnalysisAsText = (analysis: any) => {
    return `
📊 ANALYSIS RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Identified: ${analysis.pest}
📈 Confidence: ${analysis.confidence.toFixed(0)}%
⚠️ Severity Level: ${analysis.severity}
🔬 Scientific Name: ${analysis.scientificName || 'N/A'}

📸 VISUAL FEATURES DETECTED:
${analysis.visualSignatures && analysis.visualSignatures.length > 0
  ? analysis.visualSignatures.slice(0, 4).map((v: string) => `✓ ${v}`).join('\n')
  : '• Image analysis in progress'}

🎨 COLOR INDICATORS:
${analysis.colorIndicators && analysis.colorIndicators.length > 0
  ? analysis.colorIndicators.slice(0, 3).map((c: string) => `• ${c}`).join('\n')
  : '• Analyzed from visual data'}

⚡ DAMAGE PATTERNS:
${analysis.damagePatterns && analysis.damagePatterns.length > 0
  ? analysis.damagePatterns.slice(0, 3).map((d: string) => `• ${d}`).join('\n')
  : '• Assessment pending'}

🚨 URGENCY SCORE: ${analysis.urgency}/100

💡 RECOMMENDATION:
${analysis.confidence > 70
  ? '✅ High confidence detection - Recommended to follow treatment plan'
  : analysis.confidence > 40
  ? '⚠️ Medium confidence - Consider detailed inspection for confirmation'
  : '❓ Low confidence - Please upload a clearer image for accurate identification'}

📞 CALL KISAN SUVIDHA: 1800-180-1551 (Free agricultural helpline)
🌐 Visit: krishi.icar.gov.in for more information`;
  };
  
  // Handler for Liking Posts
  const handleLikePost = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    
    setCommunityPosts(prev => prev.map(post => {
      if (post.id === postId) {
        if (newLikedPosts.has(postId)) {
          newLikedPosts.delete(postId);
          return { ...post, likes: post.likes - 1 };
        } else {
          newLikedPosts.add(postId);
          return { ...post, likes: post.likes + 1 };
        }
      }
      return post;
    }));
    
    setLikedPosts(newLikedPosts);
  };

  // Handler for Adding Reply
  const handleAddReply = (postId: string) => {
    if (!newReply.content.trim()) return;

    const updatedReplies = new Map(postReplies);
    const currentReplies = updatedReplies.get(postId) || [];
    
    currentReplies.push({
      author: 'You',
      content: newReply.content,
      timestamp: Date.now()
    });

    updatedReplies.set(postId, currentReplies);
    setPostReplies(updatedReplies);

    // Update reply count
    setCommunityPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, replies: post.replies + 1 } : post
    ));

    setNewReply({ postId: '', content: '' });
  };

  const t = translations[lang];
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: any;
    if (isCalling) {
      lastCallerRef.current = isCalling;
      setCallTimer(0);
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimer > 0) {
        setCallHistory(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          name: lastCallerRef.current || 'Unknown',
          time: new Date().toLocaleTimeString(),
          duration: formatTime(callTimer)
        }, ...prev].slice(0, 5));
      }
      setCallTimer(0);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(err => console.error("Failed to fetch products:", err));

    apiService.getFeedbacks().then(res => {
      if (res.success && res.data) setFeedbacks(res.data);
    });

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('receive_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      
      // Update conversation list
      setConversations(prev => {
        const exists = prev.find(c => c.id === msg.room);
        if (exists) {
          return prev.map(c => 
            c.id === msg.room 
              ? { 
                  ...c, 
                  lastMessage: msg.text, 
                  lastTimestamp: msg.timestamp,
                  unreadCount: (selectedConversationIdRef.current === msg.room) ? 0 : c.unreadCount + 1
                } 
              : c
          );
        } else {
          // Add new conversation if it doesn't exist
          return [{
            id: msg.room,
            participantName: msg.sender,
            participantRole: msg.sender === 'Farmer' ? 'farmer' : 'customer',
            lastMessage: msg.text,
            lastTimestamp: msg.timestamp,
            unreadCount: 1,
            avatar: `https://picsum.photos/seed/${msg.room}/100/100`
          }, ...prev];
        }
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !socket || !chatRoom) return;
    const msg: Message = {
      room: chatRoom,
      sender: userType === 'farmer' ? 'Farmer' : 'Customer',
      text: inputText,
      timestamp: Date.now(),
    };
    socket.emit('send_message', msg);
    
    // Update conversation list locally
    setConversations(prev => prev.map(c => 
      c.id === chatRoom 
        ? { ...c, lastMessage: inputText, lastTimestamp: Date.now() } 
        : c
    ));
    
    setInputText('');
  };

  const handleSoilUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        setSoilImage(imageData);
        
        // Auto-detect soil type from image using AI
        try {
          const base64Image = imageData.split(',')[1];
          const detectedSoilType = await analyzeSoilTypeWithAI(base64Image);
          if (detectedSoilType && detectedSoilType !== 'Unknown') {
            setSoilType(detectedSoilType);
          }
        } catch (error) {
          console.error('Error detecting soil type:', error);
          // Silently fail - user can manually select soil type
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const detectWeather = async () => {
    if (!city && !selectedState) {
      alert('Please enter a city/village or select a state.');
      return;
    }

    setIsDetectingWeather(true);
    // Simulate API call for real-time weather
    setTimeout(() => {
      const baseTemp = selectedState?.temp || 25;
      const baseRain = selectedState?.rainfall || 50;
      
      // Add some randomness to make it look real
      const randomTemp = (baseTemp + (Math.random() * 10 - 5)).toFixed(1);
      const randomRain = (baseRain + (Math.random() * 20 - 10)).toFixed(1);
      
      setTemp(randomTemp);
      setRainfall(randomRain);
      setIsDetectingWeather(false);
      alert(`Weather detected for ${city || selectedState?.name}: ${randomTemp}°C, ${randomRain}mm rainfall.`);
    }, 1500);
  };

  const getAIRecommendation = async () => {
    setLoading(true);
    try {
      const base64 = soilImage?.split(',')[1] || null;
      const result = await analyzeSoilAndRecommendCrop(base64, {
        rainfall,
        temperature: temp,
        season,
        state: selectedState?.name || 'General',
        soilType,
        // Optional NPK and pH values - only include if provided
        nitrogen: npkValues.nitrogen || undefined,
        phosphorus: npkValues.phosphorus || undefined,
        potassium: npkValues.potassium || undefined,
        phValue: phValue || undefined
      });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateProfit = async () => {
    const res = await apiService.calculateCostProfit(analysisParams);
    if (res.success && res.data) {
      setAnalysisResult(res.data);
    }
  };

  const handleExportReport = () => {
    if (!analysisResult) return;
    const report = `
FarmConnect Cost-Profit Analysis Report
---------------------------------------
Crop: ${analysisParams.crop}
Area: ${analysisParams.area} hectares
Date: ${new Date().toLocaleDateString()}

INPUT COSTS:
- Seed Cost: ₹${analysisParams.seedCost}
- Fertilizer Cost: ₹${analysisParams.fertilizerCost}
- Pesticide Cost: ₹${analysisParams.pesticideCost}
- Labor Cost: ₹${analysisParams.laborCost}
- Irrigation Cost: ₹${analysisParams.irrigationCost}
- Transportation Cost: ₹${analysisParams.transportationCost}
- Misc Cost: ₹${analysisParams.miscCost}
- Other Cost: ₹${analysisParams.otherCost}
---------------------------------------
TOTAL INPUT COST: ₹${analysisResult.totalInputCost}

EXPECTED RESULTS:
- Expected Yield: ${analysisResult.expectedYield} quintals
- Expected Revenue: ₹${analysisResult.expectedRevenue}
- Market Price: ₹${analysisResult.marketPrice}/quintal
- NET PROFIT: ₹${analysisResult.totalProfit}
- Profit Margin: ${analysisResult.profitMargin.toFixed(2)}%
- Profit per Hectare: ₹${analysisResult.profitPerHectare.toFixed(2)}
- ROI: ${analysisResult.roi.toFixed(2)}%
---------------------------------------
Generated by FarmConnect AI
    `;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FarmConnect_Report_${analysisParams.crop}.txt`;
    a.click();
  };

  const handleTranslateNews = async () => {
    if (!selectedNews || isTranslatingNews) return;
    
    setIsTranslatingNews(true);
    try {
      const languageNames: Record<Language, string> = {
        en: 'English',
        hi: 'Hindi',
        ta: 'Tamil',
        te: 'Telugu',
        bn: 'Bengali',
        mr: 'Marathi'
      };
      
      const contentToTranslate = selectedNews.content || selectedNews.summary;
      const translated = await translateNewsContent(contentToTranslate, languageNames[lang]);
      setTranslatedNewsContent(translated);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslatingNews(false);
    }
  };

  const handleRegionSelect = (region: Region) => {
    setTemp(region.temp.toString());
    setRainfall(region.rainfall.toString());
    setSoilType(region.soil);
    setSeason(region.seasons[0]);
    setSelectedState(INDIAN_STATES.find(s => s.name === getRegionName(region, 'en')) || INDIAN_STATES[0]);
    
    // Auto-trigger recommendation
    setLoading(true);
    apiService.getRecommendedCrops({
      location: getRegionName(region, 'en'),
      soilType: region.soil,
      temperature: region.temp,
      rainfall: region.rainfall,
      season: region.seasons[0]
    }).then(res => {
      if (res.success && res.data) setRecommendations(res.data);
      setLoading(false);
    });
  };

  const handleSubmitFeedback = async () => {
    if (!newFeedback.customerName || !newFeedback.message) return;
    const res = await apiService.addFeedback(newFeedback);
    if (res.success && res.data) {
      setFeedbacks([res.data, ...feedbacks]);
      setNewFeedback({ customerName: '', phone: '', email: '', cropName: '', message: '', rating: 5 });
      setShowFeedbackForm(false);
    }
  };

  const handleSubmitProduct = async () => {
    if (!newProduct.name || !newProduct.price) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          farmer: userProfile.name,
          location: selectedState?.name || 'India',
          image: newProduct.image || 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=400'
        })
      });
      if (res.ok) {
        const product = await res.json();
        setProducts([product, ...products]);
        setNewProduct({ name: '', price: '', unit: 'kg', image: '' });
        setShowListingForm(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we'd call an API here
    if (authMode === 'signup') {
      setUserProfile({
        name: authForm.name,
        location: 'India', // Default
        phone: authForm.mobile,
        email: authForm.email
      });
      setUserType(authForm.type);
    } else {
      // Mock login
      setUserType('customer'); // Default for mock login
    }
    setIsLoggedIn(true);
    setAppState('dashboard');
  };

  if (appState === 'welcome') {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col lg:flex-row items-center justify-center p-0 overflow-hidden relative font-sans">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000" 
            alt="Farm Background" 
            className="w-full h-full object-cover opacity-40 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-b from-stone-900/80 via-stone-900/40 to-stone-900/90" />
        </div>

        {/* Left Side: Content */}
        <div className="flex-1 p-8 lg:p-16 relative z-10 flex flex-col justify-center items-start space-y-8 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                <Sprout className="w-7 h-7 text-white" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9]">
                FarmConnect <br />
                <span className="text-emerald-500">Personalized crop advisor</span>
              </h1>
              <p className="text-stone-400 text-lg lg:text-xl font-medium max-w-xl leading-relaxed">
                AI-driven recommendations tailored to your soil, climate, and crops for maximum yield.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Action Card */}
        <div className="lg:w-100 p-6 lg:p-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white/10 backdrop-blur-2xl p-8 rounded-3xl border border-white/10 shadow-2xl space-y-8"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">Ready to start?</h2>
              <p className="text-stone-400 font-medium text-sm">Join the future of farming today.</p>
            </div>

            <div className="space-y-4">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setAppState('auth')}
                className="w-full py-4 bg-emerald-500 text-white rounded-4xl font-black text-lg shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-3"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (appState === 'auth') {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-2xl shadow-stone-200/50 max-w-lg w-full space-y-8 border border-stone-100 relative z-10"
        >
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setAppState('welcome')}
              className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <Sprout className="w-6 h-6" />
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-stone-900 tracking-tight">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-stone-400 font-medium text-base">
              {authMode === 'login' ? 'Sign in to your farm dashboard' : 'Join our growing community'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-6">
            {authMode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      required
                      type="text" 
                      placeholder="John Doe"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full pl-12 pr-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-stone-700"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Mobile</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      required
                      type="tel" 
                      placeholder="+91..."
                      value={authForm.mobile}
                      onChange={(e) => setAuthForm({...authForm, mobile: e.target.value})}
                      className="w-full pl-12 pr-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-stone-700"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  required
                  type="email" 
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-stone-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Password</label>
              <div className="relative group">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-stone-50 rounded-2xl border border-stone-100 focus:border-emerald-500 focus:bg-white outline-none transition-all font-bold text-stone-700"
                />
              </div>
            </div>

            {authMode === 'signup' && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">I am a...</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'farmer', label: 'Farmer', icon: <Sprout className="w-6 h-6" /> },
                    { id: 'customer', label: 'Customer', icon: <ShoppingCart className="w-6 h-6" /> },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAuthForm({...authForm, type: type.id as any})}
                      className={cn(
                        "p-6 rounded-4xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden group",
                        authForm.type === type.id 
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100" 
                          : "border-stone-100 text-stone-400 hover:border-stone-200 hover:bg-stone-50"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                        authForm.type === type.id ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-400 group-hover:bg-white"
                      )}>
                        {type.icon}
                      </div>
                      <span className="text-sm font-black tracking-tight">{type.label}</span>
                      {authForm.type === type.id && (
                        <motion.div 
                          layoutId="active-type"
                          className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-stone-900 text-white rounded-4xl font-black text-lg shadow-2xl shadow-stone-200 hover:bg-stone-800 transition-all active:scale-[0.98] mt-4"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="text-center pt-4">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-stone-400 font-bold text-sm hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">
                {authMode === 'login' ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-emerald-100 transition-colors duration-500",
      theme === 'dark' ? "bg-stone-950 text-stone-100" : "bg-stone-50 text-stone-900"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-2 flex items-center justify-between transition-colors duration-500",
        theme === 'dark' ? "bg-stone-900/70 border-stone-800" : "bg-white/70 border-stone-200/50"
      )}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="bg-emerald-600 p-2 rounded-2xl shadow-xl shadow-emerald-200"
            >
              <Sprout className="text-white w-5 h-5" />
            </motion.div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent hidden sm:block tracking-tighter leading-none">
                {t.appName}
              </h1>
              <span className="text-[8px] font-black text-stone-400 uppercase tracking-[0.2em] hidden sm:block">Digital Farm</span>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-stone-50/90 backdrop-blur-md p-2.5 rounded-3xl overflow-x-auto no-scrollbar max-w-[60vw] sm:max-w-none border border-stone-200 shadow-lg hover:shadow-xl transition-shadow">
            <HeaderNavButton 
              active={activeTab === 'home'} 
              onClick={() => setActiveTab('home')}
              icon={<Home className="w-5 h-5" />}
              label={t.home}
            />
            <HeaderNavButton 
              active={activeTab === 'marketplace'} 
              onClick={() => setActiveTab('marketplace')}
              icon={<ShoppingCart className="w-5 h-5" />}
              label={t.marketplace}
            />
            <HeaderNavButton 
              active={activeTab === 'advisor'} 
              onClick={() => setActiveTab('advisor')}
              icon={<Sprout className="w-5 h-5" />}
              label={t.recommendation}
            />
            <HeaderNavButton 
              active={activeTab === 'chat'} 
              onClick={() => setActiveTab('chat')}
              icon={<MessageSquare className="w-5 h-5" />}
              label={t.chat}
            />
            <HeaderNavButton 
              active={activeTab === 'explore-regions'} 
              onClick={() => setActiveTab('explore-regions')} 
              icon={<Globe className="w-4 h-4" />} 
              label={t.exploreRegions} 
            />
            <HeaderNavButton 
              active={activeTab === 'tools'} 
              onClick={() => setActiveTab('tools')}
              icon={<LayoutDashboard className="w-5 h-5" />}
              label={t.tools}
            />
            <HeaderNavButton 
              active={activeTab === 'more'} 
              onClick={() => setActiveTab('more')}
              icon={<MoreHorizontal className="w-5 h-5" />}
              label="More"
            />
            <HeaderNavButton 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')}
              icon={<User className="w-5 h-5" />}
              label={t.profile}
            />
          </nav>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-3 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-stone-600 hover:text-emerald-600"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group/lang">
              <Globe className="w-4 h-4 text-stone-400 group-hover/lang:text-emerald-500 transition-colors" />
              <span className="text-xs font-black uppercase tracking-widest text-stone-600">{lang}</span>
            </button>
            <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-stone-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-3 z-50 scale-95 group-hover:scale-100 origin-top-right">
              <div className="px-4 py-2 mb-2">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Select Language</span>
              </div>
              {(Object.keys(translations) as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group/item",
                    lang === l ? "bg-emerald-50 text-emerald-700 font-black shadow-sm" : "hover:bg-stone-50 text-stone-500"
                  )}
                >
                  <span className="capitalize">
                    {l === 'en' ? 'English' : 
                     l === 'hi' ? 'Hindi' : 
                     l === 'mr' ? 'Marathi' : 
                     l === 'ta' ? 'Tamil' : 
                     l === 'te' ? 'Telugu' : 'Bengali'}
                  </span>
                  {lang === l && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-24 -mt-8"
            >
              {/* Hero Section */}
              <section className="relative h-[60vh] min-h-112.5 rounded-4xl overflow-hidden flex items-center group">
                <img 
                  src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=2000" 
                  alt="Farmer in field" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/40 to-black/20" />
                <div className="relative z-10 px-8 md:px-12 max-w-3xl space-y-6">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest">
                      Your personal agri-advisor
                    </span>
                  </motion.div>
                  <motion.h1 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter"
                  >
                    FarmConnect-<br />
                    <span className="text-emerald-500">Your personal agri-advisor.</span>
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg text-stone-300 max-w-xl leading-relaxed"
                  >
                    Connect directly with farmers, get AI-powered crop advice, and access real-time market insights. All in one place.
                  </motion.p>
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-wrap gap-4"
                  >
                    <button 
                      onClick={() => setActiveTab('marketplace')}
                      className="btn-primary text-base px-8 py-4"
                    >
                      {t.getStarted}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                </div>
              </section>

              {/* Features Grid */}
              <section className="space-y-16">
                <div className="text-center space-y-4">
                  <h2 className="section-title">Everything you need to <span className="text-emerald-600">Grow.</span></h2>
                  <p className="section-subtitle">We provide a comprehensive suite of tools designed to help you maximize yield and minimize risk.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <FeatureCard 
                    icon={<ShoppingCart className="w-8 h-8" />}
                    title="Direct Marketplace"
                    description="Skip the middlemen. Buy and sell farm produce directly with transparent pricing and secure communication."
                    onClick={() => setActiveTab('marketplace')}
                  />
                  <FeatureCard 
                    icon={<Zap className="w-8 h-8" />}
                    title="AI Crop Advisor"
                    description="Upload soil images and get instant, AI-powered recommendations tailored to your specific region and season."
                    onClick={() => setActiveTab('advisor')}
                  />
                  <FeatureCard 
                    icon={<TrendingUp className="w-8 h-8" />}
                    title="Market Insights"
                    description="Stay ahead with real-time market prices, trends, and news from across India's agricultural landscape."
                    onClick={() => setActiveTab('tools')}
                  />
                </div>
              </section>

              {/* Live Market Ticker */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  <h2 className="text-2xl font-black text-stone-900">Live Market Prices</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { crop: 'Wheat', price: '₹2,125/q', change: '+2.5%', trend: 'up' },
                    { crop: 'Rice', price: '₹2,040/q', change: '+1.8%', trend: 'up' },
                    { crop: 'Cotton', price: '₹7,500/q', change: '-0.5%', trend: 'down' },
                    { crop: 'Soybean', price: '₹4,500/q', change: '+3.2%', trend: 'up' },
                  ].map((item, idx) => (
                    <motion.div
                      key={item.crop}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className={cn(
                        "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                        item.trend === 'up' 
                          ? "bg-emerald-50 border-emerald-200 hover:shadow-lg hover:shadow-emerald-100" 
                          : "bg-red-50 border-red-200 hover:shadow-lg hover:shadow-red-100"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="font-bold text-stone-700">{item.crop}</span>
                        <motion.div 
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={item.trend === 'up' ? "text-emerald-600" : "text-red-600"}
                        >
                          {item.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </motion.div>
                      </div>
                      <p className="text-2xl font-black text-stone-900 mb-1">{item.price}</p>
                      <p className={cn(
                        "text-xs font-bold",
                        item.trend === 'up' ? "text-emerald-600" : "text-red-600"
                      )}>
                        {item.change}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Weather & Alerts Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <h2 className="text-2xl font-black text-stone-900">Active Alerts</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { title: '⚠️ Monsoon Warning', message: 'Expect heavy rainfall in Maharashtra & Telangana. Prepare irrigation ditches.', color: 'amber' },
                    { title: '🌡️ Heat Alert', message: 'High temperatures expected in Gujarat. Increase irrigation frequency for wheat.', color: 'red' },
                    { title: '🦗 Pest Warning', message: 'Armyworm activity detected in Punjab. Recommended spray: Spinosad 48 SC.', color: 'orange' },
                  ].map((alert, idx) => (
                    <motion.div
                      key={alert.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ x: 5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      className={cn(
                        "p-4 rounded-xl border-l-4 flex items-start gap-3 cursor-pointer transition-all",
                        alert.color === 'amber' ? "bg-amber-50 border-amber-500" : 
                        alert.color === 'red' ? "bg-red-50 border-red-500" : "bg-orange-50 border-orange-500"
                      )}
                    >
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl mt-1"
                      >
                        {alert.title.split(' ')[0]}
                      </motion.div>
                      <div className="flex-1">
                        <p className="font-bold text-stone-900">{alert.title}</p>
                        <p className="text-sm text-stone-600 mt-1">{alert.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Farmer Background Section */}
              <section className="relative h-[55vh] min-h-100 rounded-3xl overflow-hidden flex items-center group bg-emerald-50">
                <img 
                  src="https://images.pexels.com/photos/5632583/pexels-photo-5632583.jpeg?w=2000&auto=compress&cs=tinysrgb&fit=max&format=jpg" 
                  alt="Golden rice field at harvest" 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                
                <div className="relative z-10 w-full px-8 md:px-12 py-12 flex flex-col justify-end">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl space-y-6"
                  >
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                      Join thousands of farmers<br />
                      <span className="text-emerald-400">Growing Together</span>
                    </h2>
                    <p className="text-lg text-stone-200 max-w-lg leading-relaxed">
                      Get real-time insights, connect with markets, and maximize your harvest. Our platform is built by farmers, for farmers.
                    </p>
                    <motion.div 
                      whileHover={{ x: 10 }}
                      className="inline-flex items-center gap-2 text-emerald-400 font-bold cursor-pointer group/arrow"
                    >
                      <span>Start Your Journey</span>
                      <ArrowRight className="w-5 h-5 group-hover/arrow:translate-x-1 transition-transform" />
                    </motion.div>
                  </motion.div>
                </div>
              </section>

            </motion.div>
          )}
          {activeTab === 'marketplace' && (
            <motion.div 
              key="marketplace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Search & Products */}
              <section className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <input 
                      type="text" 
                      placeholder={t.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-stone-100 rounded-3xl focus:border-emerald-500 outline-none transition-all shadow-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4 pointer-events-none" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="pl-10 pr-8 py-4 bg-white border-2 border-stone-100 rounded-3xl focus:border-emerald-500 outline-none transition-all shadow-lg appearance-none text-sm font-bold text-stone-600 min-w-45"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </div>
                    {userType === 'farmer' && (
                      <button 
                        onClick={() => setShowListingForm(true)}
                        className="px-6 py-4 bg-emerald-600 text-white rounded-3xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 whitespace-nowrap"
                      >
                        <Plus className="w-5 h-5" />
                        {t.listProduct}
                      </button>
                    )}
                  </div>
                </div>

                {showListingForm && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl border-2 border-emerald-100 space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">{t.listProduct}</h3>
                      <button onClick={() => setShowListingForm(false)}><X className="w-6 h-6 text-stone-400" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">{t.productName}</label>
                        <input 
                          type="text" 
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">{t.productPrice}</label>
                        <input 
                          type="number" 
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">{t.productImage}</label>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={newProduct.image}
                          onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-500 uppercase">Unit</label>
                        <select 
                          value={newProduct.unit}
                          onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all"
                        >
                          <option>kg</option>
                          <option>quintal</option>
                          <option>dozen</option>
                          <option>piece</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      onClick={handleSubmitProduct}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all"
                    >
                      {t.submit}
                    </button>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => {
                      if (sortBy === 'name') return a.name.localeCompare(b.name);
                      if (sortBy === 'price-low') return a.price - b.price;
                      if (sortBy === 'price-high') return b.price - a.price;
                      return 0;
                    })
                    .map((product) => (
                    <motion.div 
                      key={product.id}
                      whileHover={{ y: -8 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-xl border-2 border-stone-50 group"
                    >
                      <div className="h-40 overflow-hidden relative">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-emerald-600">
                          ₹{product.price}/{product.unit}
                        </div>
                      </div>
                      <div className="p-5 space-y-3">
                        <div>
                          <h3 className="text-lg font-bold">{product.name}</h3>
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <User className="w-3 h-3" /> {product.farmer}
                          </p>
                          <p className="text-[10px] text-stone-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {product.location}
                          </p>
                        </div>
                        <button 
                          onClick={() => startChatWithFarmer(product.farmer, product.name)}
                          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {t.contactFarmer}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'advisor' && (
            <motion.div 
              key="advisor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-6xl mx-auto space-y-12 relative"
            >
              {/* Decorative Background Elements */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -z-10" />

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest"
                  >
                    <Zap className="w-3 h-3" />
                    AI Powered Insights
                  </motion.div>
                  <h2 className="text-3xl md:text-4xl font-black text-stone-900 tracking-tighter leading-[0.9]">
                    Crop <span className="text-emerald-600">Advisor.</span>
                  </h2>
                  <p className="text-base text-stone-500 max-w-md font-medium">
                    Get precision recommendations based on real-time soil and weather data.
                  </p>
                </div>
                
                <div className="flex bg-stone-100/50 backdrop-blur-md rounded-4xl p-1.5 border border-stone-200/50">
                  <button
                    onClick={() => setAdvisorTab('manual')}
                    className={cn(
                      "px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2",
                      advisorTab === 'manual' ? "bg-white text-emerald-600 shadow-xl shadow-emerald-900/10" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t.manualEntry}
                  </button>
                  <button
                    onClick={() => setAdvisorTab('map')}
                    className={cn(
                      "px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2",
                      advisorTab === 'map' ? "bg-white text-emerald-600 shadow-xl shadow-emerald-900/10" : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    {t.useMap}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-7 space-y-8">
                  {advisorTab === 'map' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/70 backdrop-blur-xl p-6 rounded-4xl shadow-2xl border border-white/50 relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                            </div>
                            {t.selectRegionOnMap}
                          </h3>
                          <p className="text-[10px] text-stone-400 font-bold ml-11 uppercase tracking-widest">Interactive Selection</p>
                        </div>
                      </div>
                      <div className="h-100 w-full rounded-2xl overflow-hidden border-4 border-stone-50 shadow-inner relative">
                        <LocationMap 
                          onRegionSelect={handleRegionSelect} 
                          language={lang} 
                          t={t}
                        />
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-stone-100 shadow-xl pointer-events-none">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Pro Tip</p>
                          <p className="text-xs text-stone-600 font-medium">Click on any state to automatically fetch its current climate data and soil profile.</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-4xl shadow-2xl border border-stone-100 overflow-hidden"
                    >
                      {/* Section 1: Soil Information */}
                      <div className="p-6 border-b border-stone-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Layers className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-stone-900">{t.soilInfoTitle}</h3>
                            <p className="text-xs text-stone-400">{t.soilInfoDesc}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="relative group">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleSoilUpload}
                              className="hidden" 
                              id="soil-upload" 
                            />
                            <label 
                              htmlFor="soil-upload"
                              className="block w-full border-2 border-dashed border-stone-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
                            >
                              {soilImage ? (
                                <div className="relative group">
                                  <img src={soilImage} alt="Soil" className="max-h-32 mx-auto rounded-lg shadow-lg" />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-3">
                                  <div className="w-10 h-10 bg-stone-100 rounded-lg flex items-center justify-center">
                                    <Camera className="w-5 h-5 text-stone-400" />
                                  </div>
                                  <div className="text-left">
                                    <p className="text-sm font-bold text-stone-700">{t.uploadSoil}</p>
                                    <p className="text-xs text-stone-400">PNG, JPG up to 10MB</p>
                                  </div>
                                </div>
                              )}
                            </label>
                          </div>

                          <div className="relative">
                            <label className="text-xs font-bold text-stone-500 mb-1.5 block ml-1">Soil Type {soilImage && <span className="text-emerald-500 text-[10px]">(Auto-detected)</span>}</label>
                            <select 
                              value={soilType}
                              onChange={(e) => setSoilType(e.target.value)}
                              className="w-full p-4 bg-stone-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all appearance-none font-semibold text-stone-700"
                            >
                              <option>Loamy</option>
                              <option>Clayey</option>
                              <option>Sandy</option>
                              <option>Black soil</option>
                              <option>Alluvial</option>
                              <option>Red soil</option>
                              <option>Laterite</option>
                            </select>
                            <ArrowRight className="absolute right-4 bottom-4 w-4 h-4 text-stone-400 rotate-90 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Climate & Weather */}
                      <div className="p-6 border-b border-stone-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <CloudRain className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-stone-900">{t.climateTitle}</h3>
                            <p className="text-xs text-stone-400">{t.climateDesc}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-stone-500 mb-1.5 block ml-1">{t.rainfall}</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={rainfall}
                                onChange={(e) => setRainfall(e.target.value)}
                                className="w-full p-4 bg-stone-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">mm</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-stone-500 mb-1.5 block ml-1">{t.temperature}</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={temp}
                                onChange={(e) => setTemp(e.target.value)}
                                className="w-full p-4 bg-stone-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">°C</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Location & Season */}
                      <div className="p-6 border-b border-stone-100">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-stone-900">{t.locationTitle}</h3>
                            <p className="text-xs text-stone-400">{t.locationDesc}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <label className="text-xs font-bold text-stone-500 mb-1.5 block ml-1">{t.season}</label>
                              <select 
                                value={season}
                                onChange={(e) => setSeason(e.target.value)}
                                className="w-full p-4 bg-stone-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all appearance-none font-semibold text-stone-700"
                              >
                                <option>Kharif</option>
                                <option>Rabi</option>
                                <option>Zaid</option>
                              </select>
                              <ArrowRight className="absolute right-3 bottom-4 w-4 h-4 text-stone-400 rotate-90 pointer-events-none" />
                            </div>
                            <div className="relative">
                              <label className="text-xs font-bold text-stone-500 mb-1.5 block ml-1">{t.state}</label>
                              <select 
                                value={selectedState?.name || ''}
                                onChange={(e) => setSelectedState(INDIAN_STATES.find(s => s.name === e.target.value) || null)}
                                className="w-full p-4 bg-stone-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all appearance-none font-semibold text-stone-700 text-sm"
                              >
                                {INDIAN_STATES.map(s => <option key={s.name}>{s.name}</option>)}
                              </select>
                              <ArrowRight className="absolute right-3 bottom-4 w-4 h-4 text-stone-400 rotate-90 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-stone-500 mb-1.5 block ml-1">{t.cityVillage}</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder={t.enterLocation}
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="flex-1 p-4 bg-stone-50 rounded-xl border-2 border-transparent focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700"
                              />
                              <button 
                                onClick={detectWeather}
                                disabled={isDetectingWeather}
                                className="px-4 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                              >
                                {isDetectingWeather ? (
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                  >
                                    <Zap className="w-3.5 h-3.5" />
                                  </motion.div>
                                ) : (
                                  <>
                                    <Wind className="w-3.5 h-3.5" />
                                    {t.auto}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 4: Advanced Soil Testing (Collapsed by default) */}
                      <div className="border-b border-stone-100">
                        <button
                          onClick={() => setShowNutrients(!showNutrients)}
                          className="w-full p-6 flex items-center justify-between hover:bg-stone-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                              <FlaskConical className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-black text-stone-900">{t.advancedSoilTitle}</h3>
                              <p className="text-xs text-stone-400">{t.advancedSoilDesc}</p>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center transition-transform ${showNutrients ? 'rotate-180' : ''}`}>
                            <ArrowRight className="w-4 h-4 text-stone-500 rotate-90" />
                          </div>
                        </button>
                        
                        {showNutrients && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-6 pb-6"
                          >
                            <div className="bg-purple-50/50 rounded-xl p-4 space-y-4">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">Nitrogen (N)</label>
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      placeholder="0-200"
                                      value={npkValues.nitrogen}
                                      onChange={(e) => setNpkValues(prev => ({ ...prev, nitrogen: e.target.value }))}
                                      className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700 text-sm"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">kg/ha</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">Phosphorus (P)</label>
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      placeholder="0-100"
                                      value={npkValues.phosphorus}
                                      onChange={(e) => setNpkValues(prev => ({ ...prev, phosphorus: e.target.value }))}
                                      className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700 text-sm"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">kg/ha</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">Potassium (K)</label>
                                  <div className="relative">
                                    <input 
                                      type="number" 
                                      placeholder="0-200"
                                      value={npkValues.potassium}
                                      onChange={(e) => setNpkValues(prev => ({ ...prev, potassium: e.target.value }))}
                                      className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700 text-sm"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">kg/ha</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">pH Level</label>
                                <div className="relative">
                                  <input 
                                    type="number" 
                                    placeholder="4.0 - 9.0"
                                    min="0"
                                    max="14"
                                    step="0.1"
                                    value={phValue}
                                    onChange={(e) => setPhValue(e.target.value)}
                                    className="w-full p-3 bg-white rounded-lg border border-stone-200 focus:border-emerald-500 outline-none transition-all font-semibold text-stone-700 text-sm"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">pH</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="p-6 bg-stone-50/50">
                        <button 
                          onClick={getAIRecommendation}
                          disabled={loading}
                          className="w-full py-5 bg-emerald-600 text-white rounded-xl font-black text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
                        >
                          {loading ? (
                                <motion.div 
                                  animate={{ rotate: 360 }}
                                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                >
                                  <Sprout className="w-8 h-8" />
                                </motion.div>
                              ) : (
                                <>
                                  {t.getRecommendation}
                                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <ArrowRight className="w-6 h-6" />
                                  </div>
                                </>
                              )}
                            </button>
                          </div>
                    </motion.div>
                  )}
                </div>

                {/* Results Section */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">{t.recommendations}</h3>
                    <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-full">{recommendations.length} {t.results}</span>
                  </div>

                  <div className="space-y-6 max-h-200 overflow-y-auto pr-2 no-scrollbar">
                    {recommendations.length === 0 ? (
                      <div className="bg-stone-100/50 border-2 border-dashed border-stone-200 rounded-4xl p-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-4xl flex items-center justify-center mx-auto shadow-xl">
                          <Activity className="w-10 h-10 text-stone-200" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-black text-stone-400">{t.noDataYet}</p>
                          <p className="text-sm text-stone-400 font-medium">{t.completeAnalysis}</p>
                        </div>
                      </div>
                    ) : (
                      recommendations.map((rec, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white p-8 rounded-4xl shadow-2xl border border-stone-50 group hover:border-emerald-200 transition-all relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                          
                          <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="space-y-1">
                              <h4 className="text-3xl font-black text-stone-900 tracking-tighter">{rec.cropName}</h4>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{t.highlyRecommended}</span>
                              </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-black shadow-sm">
                              {rec.duration}
                            </div>
                          </div>

                          <div className="bg-stone-50/50 p-6 rounded-4xl mb-8 relative z-10">
                            <p className="text-stone-600 font-medium leading-relaxed italic">"{rec.reason}"</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm group-hover:shadow-md transition-shadow">
                              <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" /> {t.expectedRevenue}
                              </div>
                              <div className="text-xl font-black text-emerald-600">{rec.expectedRevenue}</div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm group-hover:shadow-md transition-shadow">
                              <div className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Sprout className="w-3 h-3 text-stone-400" /> {t.seedQuantity}
                              </div>
                              <div className="text-xl font-black text-stone-800">{rec.seedQuantity}</div>
                            </div>
                          </div>

                          <div className="mt-8 pt-8 border-t border-stone-50 flex flex-wrap gap-2 relative z-10">
                            {rec.fertilizers.map((f: string) => (
                              <span key={f} className="px-4 py-2 bg-stone-100 rounded-xl text-[10px] font-black text-stone-500 uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-colors cursor-default">
                                {f}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto h-[75vh] flex bg-white rounded-[3rem] shadow-2xl overflow-hidden border-2 border-stone-50"
            >
              {/* Sidebar: Conversation List */}
              <div className={cn(
                "w-full md:w-80 border-r border-stone-100 flex flex-col bg-stone-50/30",
                selectedConversationId ? "hidden md:flex" : "flex"
              )}>
                <div className="p-6 border-b border-stone-100">
                  <h3 className="text-xl font-black text-stone-900 mb-4">{t.messages}</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input 
                      type="text" 
                      placeholder={t.searchChats}
                      value={convSearchQuery}
                      onChange={(e) => setConvSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white rounded-xl text-sm border border-stone-100 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-stone-400 text-xs">{t.noConversations}</div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversationId(conv.id);
                          setChatRoom(conv.id);
                          if (socket) socket.emit('join_room', conv.id);
                          // Reset unread count
                          setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
                        }}
                        className={cn(
                          "w-full p-4 flex items-center gap-3 transition-all hover:bg-white border-b border-stone-50",
                          selectedConversationId === conv.id ? "bg-white border-l-4 border-l-emerald-500" : ""
                        )}
                      >
                        <div className="relative">
                          <img src={conv.avatar || `https://picsum.photos/seed/${conv.id}/100/100`} alt={conv.participantName} className="w-12 h-12 rounded-2xl object-cover" />
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-stone-900 truncate">{conv.participantName}</h4>
                            <span className="text-[10px] text-stone-400 font-bold">
                              {conv.lastTimestamp ? new Date(conv.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Main: Chat Window */}
              <div className={cn(
                "flex-1 flex flex-col bg-white",
                !selectedConversationId ? "hidden md:flex" : "flex"
              )}>
                {selectedConversationId ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setSelectedConversationId(null)}
                          className="md:hidden p-2 -ml-2 text-stone-400 hover:text-stone-600"
                        >
                          <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center overflow-hidden">
                          <img 
                            src={conversations.find(c => c.id === selectedConversationId)?.avatar || `https://picsum.photos/seed/${selectedConversationId}/100/100`} 
                            className="w-full h-full object-cover"
                            alt="Avatar"
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">
                            {conversations.find(c => c.id === selectedConversationId)?.participantName}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", isTyping ? "bg-emerald-500 animate-pulse" : "bg-stone-300")} />
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                              {isTyping ? 'Typing...' : 'Online'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setIsCalling(conversations.find(c => c.id === selectedConversationId)?.participantName || 'Unknown')}
                          className="p-3 bg-stone-50 hover:bg-stone-100 text-stone-600 rounded-xl transition-colors flex items-center gap-2"
                        >
                          <PhoneCall className="w-5 h-5" />
                          <span className="hidden md:inline text-sm font-bold">{t.call}</span>
                        </button>
                        <button 
                          onClick={() => setShowChatInfo(!showChatInfo)}
                          className={cn(
                            "p-3 rounded-xl transition-colors",
                            showChatInfo ? "bg-emerald-100 text-emerald-600" : "bg-stone-50 hover:bg-stone-100 text-stone-600"
                          )}
                        >
                          <Info className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                      {/* Messages Area */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50/30">
                        {messages.filter(m => m.room === selectedConversationId).length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
                            <div className="w-20 h-20 bg-stone-100 rounded-4xl flex items-center justify-center">
                              <MessageSquare className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="text-sm font-medium">Start your conversation with {conversations.find(c => c.id === selectedConversationId)?.participantName}</p>
                          </div>
                        )}
                        {messages.filter(m => m.room === selectedConversationId).map((msg, idx) => (
                          <div 
                            key={idx} 
                            className={cn(
                              "flex flex-col max-w-[75%]",
                              msg.sender === (userType === 'farmer' ? 'Farmer' : 'Customer') ? "ml-auto items-end" : "items-start"
                            )}
                          >
                            <div className={cn(
                              "px-5 py-3 rounded-2xl text-sm shadow-sm leading-relaxed",
                              msg.sender === (userType === 'farmer' ? 'Farmer' : 'Customer') 
                                ? "bg-emerald-600 text-white rounded-tr-none" 
                                : "bg-white text-stone-800 rounded-tl-none border border-stone-100"
                            )}>
                              {msg.text}
                            </div>
                            <div className="flex items-center gap-1 mt-1.5">
                              <span className="text-[10px] font-bold text-stone-400 uppercase">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender === (userType === 'farmer' ? 'Farmer' : 'Customer') && (
                                <div className="flex">
                                  <span className="w-3 h-3 text-emerald-500">✓✓</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex flex-col items-start max-w-[75%]">
                            <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm flex gap-1">
                              <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce" />
                              <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat Info Sidebar */}
                      <AnimatePresence>
                        {showChatInfo && (
                          <motion.div 
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 300, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-stone-100 bg-white overflow-hidden flex flex-col"
                          >
                            <div className="p-8 flex flex-col items-center text-center space-y-4 border-b border-stone-100">
                              <img 
                                src={conversations.find(c => c.id === selectedConversationId)?.avatar || `https://picsum.photos/seed/${selectedConversationId}/100/100`} 
                                className="w-24 h-24 rounded-4xl object-cover shadow-xl"
                                alt="Profile"
                              />
                              <div>
                                <h3 className="text-xl font-black text-stone-900">
                                  {conversations.find(c => c.id === selectedConversationId)?.participantName}
                                </h3>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">
                                  {conversations.find(c => c.id === selectedConversationId)?.participantRole}
                                </p>
                              </div>
                            </div>
                            <div className="p-6 space-y-6 overflow-y-auto">
                              <div>
                                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Contact Details</h4>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3 text-sm text-stone-600">
                                    <Phone className="w-4 h-4 text-stone-400" />
                                    <span>+91 98765 43210</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-stone-600">
                                    <Mail className="w-4 h-4 text-stone-400" />
                                    <span>{conversations.find(c => c.id === selectedConversationId)?.participantName.toLowerCase().replace(' ', '.')}@kisan.com</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Shared Media</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-square bg-stone-100 rounded-lg overflow-hidden">
                                      <img src={`https://picsum.photos/seed/media${i}/100/100`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer" alt="Media" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Input Area */}
                    <div className="p-6 bg-white border-t border-stone-100">
                      <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-4xl border-2 border-transparent focus-within:border-emerald-500 transition-all">
                        <div className="flex items-center">
                          <button className="p-3 text-stone-400 hover:text-emerald-600 transition-colors">
                            <Plus className="w-6 h-6" />
                          </button>
                          <div className="relative group/lang">
                            <button className="p-3 text-stone-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
                              <Languages className="w-6 h-6" />
                              <span className="text-[10px] font-black uppercase tracking-tighter">{lang}</span>
                            </button>
                            <div className="absolute bottom-full left-0 mb-3 w-40 bg-white rounded-2xl shadow-2xl border border-stone-100 opacity-0 invisible group-hover/lang:opacity-100 group-hover/lang:visible transition-all p-2 z-50">
                              {(Object.keys(translations) as Language[]).map((l) => (
                                <button
                                  key={l}
                                  onClick={() => setLang(l)}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between",
                                    lang === l ? "bg-emerald-50 text-emerald-700 font-black" : "hover:bg-stone-50 text-stone-500"
                                  )}
                                >
                                  {l.toUpperCase()}
                                  {lang === l && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => {
                            setInputText(e.target.value);
                            // Simulate typing indicator
                            if (e.target.value.length > 0) {
                              // In a real app, we'd emit 'typing' to the socket
                            }
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Write a message..."
                          className="flex-1 bg-transparent py-2 outline-none text-stone-800 placeholder:text-stone-400"
                        />
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={handleSendMessage}
                            className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400 p-12 text-center space-y-6">
                    <div className="w-32 h-32 bg-stone-50 rounded-[3rem] flex items-center justify-center">
                      <MessageSquare className="w-16 h-16 opacity-10" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-stone-900 mb-2">Select a conversation</h3>
                      <p className="max-w-xs mx-auto text-sm">Choose a farmer or customer from the list to start chatting directly.</p>
                    </div>
                  </div>
                )}
              </div>

              {isCalling && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-50 bg-emerald-900/90 backdrop-blur-xl flex flex-col items-center justify-center text-white space-y-8"
                >
                  <div className="relative">
                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                      <User className="w-16 h-16" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-full">
                      <PhoneCall className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black">Calling {conversations.find(c => c.id === selectedConversationId)?.participantName}...</h3>
                    <p className="opacity-60">Connecting via Kisan Secure Line</p>
                  </div>
                  <button 
                    onClick={() => setIsCalling(null)}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-xl shadow-red-900/20"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'explore-regions' && (
            <ExploreRegions t={t} language={lang} />
          )}

          {activeTab === 'tools' && (
            <motion.div 
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <ToolCard 
                icon={<Phone className="w-8 h-8 text-blue-600" />}
                title={t.kisanCallCentre}
                description="Direct support from agriculture experts"
                onClick={() => setActiveTab('callcentre')}
                color="bg-blue-50"
              />
              <ToolCard 
                icon={<Newspaper className="w-8 h-8 text-amber-600" />}
                title={t.kisanNews}
                description="Latest updates and market trends"
                onClick={() => setActiveTab('news')}
                color="bg-amber-50"
              />
              <ToolCard 
                icon={<Book className="w-8 h-8 text-emerald-600" />}
                title={t.cropDatabase}
                description="Comprehensive guide for all Indian crops"
                onClick={() => setActiveTab('database')}
                color="bg-emerald-50"
              />
              <ToolCard 
                icon={<Calculator className="w-8 h-8 text-purple-600" />}
                title={t.profitAnalysis}
                description="Calculate your costs and expected profits"
                onClick={() => setActiveTab('analysis')}
                color="bg-purple-50"
              />
              <ToolCard 
                icon={<ShieldCheck className="w-8 h-8 text-rose-600" />}
                title={t.kisanSuvidha}
                description={t.kisanSuvidhaDesc}
                onClick={() => setActiveTab('kisan-suvidha')}
                color="bg-rose-50"
              />
            </motion.div>
          )}

          {activeTab === 'kisan-suvidha' && (
            <motion.div 
              key="kisan-suvidha"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black">{t.kisanSuvidha}</h2>
                <button onClick={() => setActiveTab('tools')} className="text-stone-400 font-bold hover:text-emerald-600 transition-colors">Back to Tools</button>
              </div>

              <div className="space-y-12">
                {/* Schemes Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900">{t.schemesTitle}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {KISAN_SUVIDHA_DATA.schemes.map((scheme) => (
                      <div key={scheme.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black text-stone-900">{scheme.name}</h4>
                          <div className="px-4 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest">Active</div>
                        </div>
                        <p className="text-stone-500 font-medium leading-relaxed">{scheme.description}</p>
                        
                        <div className="pt-4">
                          <button 
                            onClick={() => setExpandedScheme(expandedScheme === scheme.id ? null : scheme.id)}
                            className="flex items-center gap-2 text-emerald-600 font-black text-sm hover:text-emerald-700 transition-colors"
                          >
                            <Info className="w-4 h-4" />
                            {expandedScheme === scheme.id ? t.hideEligibility : t.viewEligibility}
                          </button>
                          
                          <AnimatePresence>
                            {expandedScheme === scheme.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 p-6 bg-stone-50 rounded-2xl border border-stone-100 space-y-4">
                                  <div>
                                    <h5 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t.eligibility}</h5>
                                    <p className="text-stone-600 font-medium text-sm leading-relaxed">{scheme.eligibility}</p>
                                  </div>
                                  {scheme.documents && (
                                    <div>
                                      <h5 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Documents Required</h5>
                                      <p className="text-stone-600 font-medium text-sm leading-relaxed">{scheme.documents}</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Loans Section */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-black text-stone-900">{t.loansTitle}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {KISAN_SUVIDHA_DATA.loans.map((loan) => (
                      <div key={loan.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-black text-stone-900">{loan.name}</h4>
                          <div className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">Loan</div>
                        </div>
                        <p className="text-stone-500 font-medium leading-relaxed">{loan.description}</p>
                        
                        <div className="pt-4">
                          <button 
                            onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                            className="flex items-center gap-2 text-blue-600 font-black text-sm hover:text-blue-700 transition-colors"
                          >
                            <Info className="w-4 h-4" />
                            {expandedLoan === loan.id ? t.hideEligibility : t.viewEligibility}
                          </button>
                          
                          <AnimatePresence>
                            {expandedLoan === loan.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 p-6 bg-stone-50 rounded-2xl border border-stone-100 space-y-4">
                                  <div>
                                    <h5 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">{t.eligibility}</h5>
                                    <p className="text-stone-600 font-medium text-sm leading-relaxed">{loan.eligibility}</p>
                                  </div>
                                  {loan.documents && (
                                    <div>
                                      <h5 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">Documents Required</h5>
                                      <p className="text-stone-600 font-medium text-sm leading-relaxed">{loan.documents}</p>
                                    </div>
                                  )}
                                  {loan.cibilScore && (
                                    <div>
                                      <h5 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">CIBIL Score Required</h5>
                                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-black">
                                        <TrendingUp className="w-3 h-3" />
                                        {loan.cibilScore}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === 'callcentre' && (
            <motion.div 
              key="callcentre"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black">{t.kisanCallCentre}</h2>
                <button onClick={() => setActiveTab('tools')} className="text-stone-400 font-bold hover:text-emerald-600 transition-colors">Back to Tools</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-12">
                  {[
                    {
                      department: 'Government Support',
                      icon: <ShieldCheck className="w-5 h-5" />,
                      contacts: [
                        { id: 1, name: 'General Support', number: '1800-180-1551', description: 'Agriculture Ministry Helpdesk' },
                        { id: 3, name: 'Market Prices', number: '1800-333-4444', description: 'Agri-Marketing & Trends' },
                      ]
                    },
                    {
                      department: 'Technical Support',
                      icon: <Wrench className="w-5 h-5" />,
                      contacts: [
                        { id: 2, name: 'Crop Protection', number: '1800-111-2222', description: 'Plant Pathology & Pests' },
                        { id: 5, name: 'Soil Testing', number: '1800-777-8888', description: 'Soil Science & Fertilizers' },
                      ]
                    },
                    {
                      department: 'Specialized Services',
                      icon: <Activity className="w-5 h-5" />,
                      contacts: [
                        { id: 4, name: 'Weather Alerts', number: '1800-555-6666', description: 'Meteorology & Forecasts' },
                        { id: 6, name: 'Livestock Care', number: '1800-999-0000', description: 'Veterinary & Animal Health' },
                      ]
                    }
                  ].map((group) => (
                    <div key={group.department} className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                          {group.icon}
                        </div>
                        <h3 className="text-xl font-black text-stone-900">{group.department}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {group.contacts.map((contact) => (
                          <div key={contact.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-stone-100 space-y-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="flex items-center gap-4 relative z-10">
                              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                <PhoneCall className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="text-lg font-black text-stone-900">{contact.name}</h3>
                                <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">{contact.description}</p>
                              </div>
                            </div>
                            <div className="space-y-3 relative z-10">
                              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl text-sm">
                                <span className="text-stone-500 font-bold">Number</span>
                                <span className="text-emerald-600 font-black">{contact.number}</span>
                              </div>
                              <button 
                                onClick={() => setIsCalling(contact.name)}
                                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                              >
                                <Phone className="w-4 h-4" />
                                Call Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100 space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      Recent Calls
                    </h3>
                    <div className="space-y-4">
                      {callHistory.length > 0 ? (
                        callHistory.map((call) => (
                          <div key={call.id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                <Phone className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-bold text-stone-900 text-sm">{call.name}</div>
                                <div className="text-[10px] text-stone-400 font-bold">{call.time}</div>
                              </div>
                            </div>
                            <div className="text-xs font-black text-stone-500">{call.duration}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-stone-400 font-bold text-sm italic">
                          No recent calls
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-600 text-white p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="relative z-10 space-y-4">
                      <h4 className="text-xl font-black leading-tight">Need Expert Advice?</h4>
                      <p className="text-emerald-100 text-sm font-medium">Our agricultural experts are available 24/7 to help you with your farming needs.</p>
                      <button 
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-black text-sm hover:bg-emerald-50 transition-colors"
                      >
                        Schedule a Visit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-100 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-4xl max-w-md w-full p-10 relative shadow-2xl"
                  >
                    <button 
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="absolute top-6 right-6 p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl">
                        📅
                      </div>
                      <h2 className="text-3xl font-black text-stone-900 tracking-tight">Schedule Expert Visit</h2>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Preferred Date</label>
                          <input type="date" className="w-full px-5 py-4 bg-stone-50 rounded-xl border border-stone-100 outline-none focus:border-emerald-500/50 transition-all font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Visit Type</label>
                          <select className="w-full px-5 py-4 bg-stone-50 rounded-xl border border-stone-100 outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none">
                            <option>Soil Analysis</option>
                            <option>Pest Control</option>
                            <option>Irrigation Setup</option>
                            <option>General Consultation</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Notes</label>
                          <textarea placeholder="Tell us about your farm..." className="w-full px-5 py-4 bg-stone-50 rounded-xl border border-stone-100 outline-none focus:border-emerald-500/50 transition-all font-bold h-24 resize-none" />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setIsScheduleModalOpen(false);
                          alert('Visit scheduled successfully! Our expert will contact you soon.');
                        }}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                      >
                        Confirm Schedule
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}

              {isCalling && (
                <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-xl z-200 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-stone-900 text-white p-12 rounded-3xl shadow-2xl flex flex-col items-center gap-10 max-w-sm w-full text-center relative overflow-hidden"
                  >
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full" />
                    
                    <div className="relative">
                      <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/40">
                          <PhoneCall className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white text-emerald-600 p-3 rounded-2xl shadow-xl">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <h3 className="text-3xl font-black tracking-tight">{isCalling}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          callTimer > 0 ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        )} />
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">
                          {callTimer > 0 ? 'Active Connection' : 'Establishing Secure Line...'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <div className="text-5xl font-mono font-black text-white tabular-nums">
                        {formatTime(callTimer)}
                      </div>
                      <p className="text-stone-500 font-bold text-[10px] uppercase tracking-widest">Call Duration</p>
                    </div>

                    <button 
                      onClick={() => setIsCalling(null)} 
                      className="w-full py-5 bg-red-500 text-white rounded-4xl font-black flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-red-900/40 group relative z-10"
                    >
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <X className="w-4 h-4" />
                      </div>
                      End Call
                    </button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div 
              key="news"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black">{t.agriNews}</h2>
                <button onClick={() => setActiveTab('tools')} className="text-stone-400 font-bold hover:text-emerald-600 transition-colors">Back to Tools</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {KISAN_NEWS.map((news) => (
                  <motion.div 
                    key={news.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-xl border border-stone-100 flex flex-col"
                  >
                    <div className="h-48 relative bg-stone-100">
                      <img src={`https://picsum.photos/seed/news${news.id}/800/600`} alt={news.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                        News
                      </div>
                    </div>
                    <div className="p-8 space-y-4 flex-1 flex flex-col">
                      <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{news.date}</div>
                      <h3 className="text-xl font-black text-stone-900 leading-tight">{news.title}</h3>
                      <p className="text-stone-500 text-sm line-clamp-3 flex-1">{news.summary}</p>
                      <button 
                        onClick={() => setSelectedNews(news)}
                        className="pt-4 text-emerald-600 font-bold text-sm flex items-center gap-2 hover:underline"
                      >
                        Read Full Story <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {selectedNews && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-4xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative"
                  >
                    <button 
                      onClick={() => {
                        setSelectedNews(null);
                        setTranslatedNewsContent(null);
                      }}
                      className="absolute top-6 right-6 p-2 bg-stone-100 rounded-full text-stone-400 hover:text-red-500 transition-colors z-10"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <img src={`https://picsum.photos/seed/news${selectedNews.id}/800/600`} alt={selectedNews.title} className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
                    <div className="p-12 space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
                            Agri News
                          </span>
                          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{selectedNews.date}</span>
                        </div>
                        {lang !== 'en' && (
                          <button 
                            onClick={handleTranslateNews}
                            disabled={isTranslatingNews}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all",
                              translatedNewsContent 
                                ? "bg-emerald-100 text-emerald-600" 
                                : "bg-stone-100 text-stone-600 hover:bg-emerald-50 hover:text-emerald-600"
                            )}
                          >
                            <Globe className={cn("w-4 h-4", isTranslatingNews && "animate-spin")} />
                            {isTranslatingNews ? 'Translating...' : translatedNewsContent ? 'Translated' : `Translate to ${lang.toUpperCase()}`}
                          </button>
                        )}
                      </div>
                      <h2 className="text-4xl font-black text-stone-900 leading-tight">{selectedNews.title}</h2>
                      <div className="prose prose-stone max-w-none">
                        <p className="text-stone-600 leading-relaxed text-lg">{selectedNews.summary}</p>
                        <div className="mt-8 p-8 bg-stone-50 rounded-3xl border border-stone-100">
                          <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                            {translatedNewsContent || selectedNews.content || "Full story content coming soon..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'database' && (
            <motion.div 
              key="database"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-5xl mx-auto space-y-12 relative"
            >
              {/* Decorative background elements */}
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100/50">
                      <BookOpen className="w-3 h-3" />
                      Knowledge Hub
                    </div>
                    <h2 className="text-5xl font-black text-stone-900 tracking-tighter leading-tight">
                      {t.cropDatabase}
                    </h2>
                    <p className="text-stone-500 font-medium max-w-md">
                      Explore our comprehensive database of crops, optimized for your region and soil type.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('tools')} 
                    className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-stone-50 text-stone-600 font-bold rounded-2xl border border-stone-200 transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Tools
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  <div className="lg:col-span-5 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search crops..."
                      value={cropSearch}
                      onChange={(e) => setCropSearch(e.target.value)}
                      className={cn(
                        "w-full pl-14 pr-6 py-5 rounded-4xl border-2 outline-none transition-all shadow-xl font-medium",
                        theme === 'dark' ? "bg-stone-900 border-stone-800 text-white focus:border-emerald-500/50 shadow-black/20" : "bg-white border-stone-100 text-stone-900 focus:border-emerald-500/50 shadow-stone-200/20"
                      )}
                    />
                  </div>
                  <div className="lg:col-span-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                    {['All', 'Kharif', 'Rabi', 'Annual'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setCropSeasonFilter(s)}
                        className={cn(
                          "px-6 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2",
                          cropSeasonFilter === s 
                            ? (theme === 'dark' ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-900/20" : "bg-stone-900 border-stone-900 text-white shadow-xl shadow-stone-200")
                            : (theme === 'dark' ? "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700 hover:bg-stone-800" : "bg-white border-stone-100 text-stone-500 hover:border-stone-300 hover:bg-stone-50")
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="flex-1 relative group">
                      <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <select
                        value={cropSortBy}
                        onChange={(e) => setCropSortBy(e.target.value as any)}
                        className={cn(
                          "w-full pl-10 pr-4 py-4 rounded-2xl border-2 outline-none transition-all font-bold text-sm appearance-none cursor-pointer",
                          theme === 'dark' ? "bg-stone-900 border-stone-800 text-stone-300 focus:border-emerald-500/50" : "bg-white border-stone-100 text-stone-600 focus:border-emerald-500/50"
                        )}
                      >
                        <option value="name">Sort by Name</option>
                        <option value="demand">Sort by Demand</option>
                        <option value="profit">Sort by Profit</option>
                        <option value="cost">Sort by Cost</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                {CROP_DATABASE.filter(c => {
                  const matchesSearch = c.name.toLowerCase().includes(cropSearch.toLowerCase()) || 
                                      c.soil.toLowerCase().includes(cropSearch.toLowerCase());
                  const matchesSeason = cropSeasonFilter === 'All' || c.season === cropSeasonFilter;
                  return matchesSearch && matchesSeason;
                })
                .sort((a, b) => {
                  if (cropSortBy === 'name') return a.name.localeCompare(b.name);
                  if (cropSortBy === 'demand') return b.demand - a.demand;
                  if (cropSortBy === 'profit') return b.profit - a.profit;
                  if (cropSortBy === 'cost') return a.cost - b.cost;
                  return 0;
                })
                .map((crop, idx) => (
                  <motion.button 
                    key={crop.name} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02, y: -8 }}
                    onClick={() => setSelectedCrop(crop)}
                    className="bg-white p-8 rounded-4xl shadow-xl shadow-stone-200/40 border border-stone-100 flex flex-col gap-6 group hover:border-emerald-500/30 transition-all text-left w-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-emerald-50 transition-colors">
                        🌱
                      </div>
                      <span className="px-3 py-1 bg-stone-100 text-stone-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                        {crop.season}
                      </span>
                    </div>

                    <div className="space-y-4 relative z-10">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-2xl font-black text-stone-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                            {crop.name}
                          </h3>
                          {idx % 3 === 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-[8px] font-black uppercase tracking-tighter">
                              <Star className="w-2 h-2 fill-current" /> Popular
                            </div>
                          )}
                        </div>
                        <p className="text-stone-400 text-sm font-medium line-clamp-1">
                          Ideal for {crop.soil} soil
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50">
                        <div>
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Duration</div>
                          <div className="font-black text-stone-800 text-sm">{crop.duration}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-0.5">Yield Potential</div>
                          <div className="font-black text-emerald-600 text-sm">High</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex items-center gap-2 text-emerald-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      View Details <ArrowRight className="w-3 h-3" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {selectedCrop && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-4xl max-w-3xl w-full max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-2xl"
                  >
                    <button 
                      onClick={() => setSelectedCrop(null)}
                      className="absolute top-8 right-8 p-3 bg-white/80 backdrop-blur-md rounded-full text-stone-400 hover:text-red-500 transition-all z-20 shadow-lg border border-stone-100"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    <div className="relative h-64 bg-stone-900 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-emerald-500 to-blue-500" />
                      </div>
                      <div className="relative z-10 text-8xl transform hover:scale-110 transition-transform duration-700 cursor-default">
                        🌱
                      </div>
                    </div>

                    <div className="p-12 space-y-10">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {selectedCrop.season} Season
                          </div>
                          <h2 className="text-5xl font-black text-stone-900 tracking-tighter">{selectedCrop.name}</h2>
                        </div>
                        <div className="bg-blue-50 px-6 py-4 rounded-3xl border border-blue-100">
                          <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Water Needs</div>
                          <div className="text-2xl font-black text-blue-600 flex items-center gap-2">
                            <CloudRain className="w-6 h-6" />
                            {selectedCrop.water}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 space-y-2 group hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                            <Layers className="w-5 h-5 text-stone-400" />
                          </div>
                          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Ideal Soil Type</div>
                          <div className="text-xl font-black text-stone-900">{selectedCrop.soil}</div>
                        </div>
                        <div className="bg-stone-50 p-8 rounded-[2.5rem] border border-stone-100 space-y-2 group hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mb-2">
                            <Clock className="w-5 h-5 text-stone-400" />
                          </div>
                          <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Growth Duration</div>
                          <div className="text-xl font-black text-stone-900">{selectedCrop.duration}</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h4 className="text-2xl font-black text-stone-900 tracking-tight">Cultivation Guide</h4>
                          <div className="flex-1 h-px bg-stone-100" />
                        </div>
                        <p className="text-stone-500 leading-relaxed text-lg font-medium">
                          {selectedCrop.description}
                        </p>
                      </div>

                      <div className="pt-10 border-t border-stone-100 flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={handleGetExpertAdvice}
                          disabled={expertAdviceLoading}
                          className="flex-1 py-5 bg-stone-900 text-white rounded-2xl font-black hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {expertAdviceLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-5 h-5" />
                              Get Expert Advice
                            </>
                          )}
                        </button>
                        <button 
                          onClick={handleDownloadGuide}
                          className="flex-1 py-5 bg-white border-2 border-stone-100 text-stone-600 rounded-2xl font-black hover:bg-stone-50 transition-all flex items-center justify-center gap-3"
                        >
                          <Download className="w-5 h-5" />
                          Download Guide
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Expert Advice Modal */}
              {showExpertAdviceModal && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-[3.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-2xl"
                  >
                    <button 
                      onClick={() => {
                        setShowExpertAdviceModal(false);
                        setExpertAdviceContent('');
                      }}
                      className="absolute top-8 right-8 p-3 bg-white/80 backdrop-blur-md rounded-full text-stone-400 hover:text-red-500 transition-all z-20 shadow-lg border border-stone-100"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    <div className="relative h-48 bg-linear-to-br from-emerald-500 to-green-600 flex items-center justify-center overflow-hidden">
                      <div className="relative z-10 text-7xl transform hover:scale-110 transition-transform duration-700 cursor-default">
                        👨‍🌾
                      </div>
                    </div>

                    <div className="p-12 space-y-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          💡 Expert Knowledge
                        </div>
                        <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Expert Advice for {selectedCrop?.name}</h2>
                      </div>

                      {expertAdviceLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-stone-600 font-bold">Fetching expert advice...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 space-y-4">
                          <p className="text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {expertAdviceContent}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          setShowExpertAdviceModal(false);
                          setExpertAdviceContent('');
                        }}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto space-y-12 relative"
            >
              {/* Decorative background elements */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100/50">
                    <TrendingUp className="w-3 h-3" />
                    Financial Planner
                  </div>
                  <h2 className="text-5xl font-black text-stone-900 tracking-tighter leading-tight">
                    {t.profitAnalysis}
                  </h2>
                  <p className="text-stone-500 font-medium max-w-md">
                    Calculate your potential earnings and optimize your farming budget with AI insights.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveTab('tools')} 
                  className="group flex items-center gap-2 px-6 py-3 bg-white hover:bg-stone-50 text-stone-600 font-bold rounded-2xl border border-stone-200 transition-all shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Tools
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                <div className="lg:col-span-7 space-y-8">
                      <div className="bg-white p-10 rounded-4xl shadow-2xl shadow-stone-200/50 border border-stone-100 space-y-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">{t.cropName}</label>
                        <div className="relative group">
                          <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            type="text" 
                            placeholder="e.g. Wheat, Rice..."
                            value={analysisParams.crop}
                            onChange={(e) => setAnalysisParams({...analysisParams, crop: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/30 focus:bg-white outline-none transition-all font-bold text-stone-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">Area (Hectares)</label>
                        <div className="relative group">
                          <Maximize className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                          <input 
                            type="number" 
                            placeholder="0.0"
                            value={analysisParams.area || ''}
                            onChange={(e) => setAnalysisParams({...analysisParams, area: parseFloat(e.target.value) || 0})}
                            className="w-full pl-12 pr-4 py-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/30 focus:bg-white outline-none transition-all font-bold text-stone-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h4 className="font-black text-stone-900 tracking-tight">Input Costs</h4>
                        <div className="flex-1 h-px bg-stone-100" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                          { label: 'Seeds', key: 'seedCost', icon: <Leaf className="w-4 h-4" /> },
                          { label: 'Fertilizers', key: 'fertilizerCost', icon: <FlaskConical className="w-4 h-4" /> },
                          { label: 'Pesticides', key: 'pesticideCost', icon: <ShieldCheck className="w-4 h-4" /> },
                          { label: 'Labor', key: 'laborCost', icon: <Users className="w-4 h-4" /> },
                          { label: 'Irrigation', key: 'irrigationCost', icon: <Droplets className="w-4 h-4" /> },
                          { label: 'Transportation', key: 'transportationCost', icon: <Wind className="w-4 h-4" /> },
                          { label: 'Misc', key: 'miscCost', icon: <Calculator className="w-4 h-4" /> },
                          { label: 'Other Costs', key: 'otherCost', icon: <Plus className="w-4 h-4" /> },
                        ].map((item) => (
                          <div key={item.key} className="space-y-2">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                              {item.icon} {item.label}
                            </label>
                            <div className="relative group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 font-bold group-focus-within:text-emerald-500 transition-colors">₹</span>
                              <input 
                                type="number" 
                                value={analysisParams[item.key as keyof typeof analysisParams] || ''}
                                onChange={(e) => setAnalysisParams({...analysisParams, [item.key]: parseFloat(e.target.value) || 0})}
                                className="w-full pl-10 pr-4 py-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-emerald-500/30 focus:bg-white outline-none transition-all font-bold text-stone-700"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={handleCalculateProfit}
                      className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-3 group"
                    >
                      {t.calculate}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="bg-white p-10 rounded-4xl shadow-2xl shadow-stone-200/50 border border-stone-100 h-full relative overflow-hidden flex flex-col">
                    {analysisResult ? (
                      <div className="space-y-8 relative z-10 flex-1">
                        <div className="text-center space-y-2">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Analysis Result
                          </div>
                          <div className="text-sm font-bold text-stone-400 uppercase tracking-widest">Estimated Net Profit</div>
                          <div className="text-7xl font-black text-stone-900 tracking-tighter">
                            ₹{analysisResult.totalProfit.toLocaleString()}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-4">
                              <TrendingDown className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Cost</div>
                              <div className="text-xl font-black text-red-500">₹{analysisResult.totalInputCost.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Revenue</div>
                              <div className="text-xl font-black text-emerald-600">₹{analysisResult.expectedRevenue.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                              <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Market Price</div>
                              <div className="text-xl font-black text-blue-600">₹{analysisResult.marketPrice}/q</div>
                            </div>
                          </div>
                          <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-100 flex flex-col justify-between group hover:bg-white hover:shadow-xl transition-all duration-500">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 mb-4">
                              <Maximize className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Profit / Hectare</div>
                              <div className="text-xl font-black text-purple-600">₹{analysisResult.profitPerHectare.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6 bg-stone-50/50 p-8 rounded-[3rem] border border-stone-100">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-stone-900 uppercase tracking-tighter">Profit Margin</span>
                              <span className="text-xl font-black text-emerald-600">{analysisResult.profitMargin.toFixed(1)}%</span>
                            </div>
                            <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(analysisResult.profitMargin, 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]" 
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-stone-200/50">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                                <BarChart3 className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">ROI Index</span>
                            </div>
                            <span className="text-xl font-black text-emerald-600">{analysisResult.roi.toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="pt-4 space-y-4">
                          <div className="flex items-start gap-3 p-5 bg-blue-50/50 rounded-2xl text-[10px] text-blue-600 font-bold leading-relaxed border border-blue-100/50">
                            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            Market rates for {analysisParams.crop} are currently stable. This forecast is 85% accurate based on historical data.
                          </div>
                          <button 
                            onClick={handleExportReport}
                            className="w-full py-5 bg-stone-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 active:scale-[0.98]"
                          >
                            <Download className="w-5 h-5" />
                            {t.exportReport}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20">
                        <div className="w-24 h-24 bg-stone-50 rounded-4xl flex items-center justify-center text-stone-200">
                          <Calculator className="w-12 h-12" />
                        </div>
                        <div className="space-y-2 max-w-xs">
                          <h3 className="text-xl font-black text-stone-900">Ready to Plan?</h3>
                          <p className="text-stone-400 font-medium">Enter your crop details and costs to see a detailed profit analysis.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl mx-auto space-y-12 relative"
            >
              {/* Decorative background elements */}
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="bg-white rounded-[4rem] p-12 shadow-2xl shadow-stone-200/50 border border-stone-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                  <div className="relative group/avatar">
                    <div className="w-48 h-48 bg-stone-900 rounded-[4rem] flex items-center justify-center text-white text-7xl font-black shadow-2xl transform group-hover/avatar:rotate-3 transition-transform duration-500">
                      {userProfile.name[0]}
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-white p-4 rounded-3xl shadow-2xl border border-stone-100 text-stone-400 hover:text-emerald-600 transition-all hover:scale-110">
                      <Camera className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Verified {userType}
                      </div>
                      <h2 className="text-6xl font-black text-stone-900 tracking-tighter">{userProfile.name}</h2>
                      <p className="text-stone-400 font-bold uppercase tracking-widest text-sm">Member since March 2024</p>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-3 px-6 py-3 bg-stone-50 rounded-2xl text-stone-600 font-bold text-sm border border-stone-100">
                        <MapPin className="w-4 h-4 text-emerald-600" /> {userProfile.location}
                      </div>
                      <div className="flex items-center gap-3 px-6 py-3 bg-stone-50 rounded-2xl text-stone-600 font-bold text-sm border border-stone-100">
                        <Phone className="w-4 h-4 text-emerald-600" /> {userProfile.phone}
                      </div>
                    </div>
                    <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                      <button className="px-8 py-4 bg-stone-900 text-white rounded-2xl font-black hover:bg-stone-800 transition-all shadow-xl shadow-stone-200">
                        Edit Profile
                      </button>
                      <button className="px-8 py-4 bg-white border-2 border-stone-100 text-stone-600 rounded-2xl font-black hover:bg-stone-50 transition-all">
                        View Public Page
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {[
                  { label: 'Items Sold', value: '12', icon: <ShoppingCart className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Consultations', value: '24', icon: <MessageSquare className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
                  { label: 'Trust Score', value: '4.9', icon: <Star className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-stone-200/40 border border-stone-100 space-y-6 group hover:border-stone-300 transition-all">
                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", stat.color)}>
                      {stat.icon}
                    </div>
                    <div className="space-y-1">
                      <div className="text-4xl font-black text-stone-900 tracking-tighter">{stat.value}</div>
                      <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white rounded-[4rem] overflow-hidden shadow-2xl shadow-stone-200/50 border border-stone-100">
                    <div className="p-10 border-b border-stone-100 flex items-center justify-between bg-stone-50/30">
                      <h3 className="text-2xl font-black text-stone-900 tracking-tight">Account Settings</h3>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 shadow-sm">
                        <Settings className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="divide-y divide-stone-50">
                      {[
                        { label: 'Language', value: lang.toUpperCase(), icon: <Globe className="w-5 h-5" /> },
                        { label: 'Notifications', value: 'Enabled', icon: <CloudRain className="w-5 h-5" /> },
                        { label: 'Privacy & Security', value: 'High', icon: <ShieldCheck className="w-5 h-5" /> },
                        { label: 'Help & Support', value: '', icon: <Info className="w-5 h-5" /> },
                      ].map((item, idx) => (
                        <button key={idx} className="w-full p-8 flex items-center justify-between hover:bg-stone-50 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-md transition-all">
                              {item.icon}
                            </div>
                            <span className="text-lg font-bold text-stone-700 group-hover:text-stone-900 transition-colors">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.value && <span className="text-sm font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-lg">{item.value}</span>}
                            <ArrowRight className="w-5 h-5 text-stone-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </button>
                      ))}
                      <button 
                        onClick={() => {
                          setIsLoggedIn(false);
                          setAppState('welcome');
                        }}
                        className="w-full p-8 flex items-center justify-between hover:bg-red-50 transition-all group text-red-500"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-400 group-hover:bg-white group-hover:text-red-600 group-hover:shadow-md transition-all">
                            <LogOut className="w-5 h-5" />
                          </div>
                          <span className="text-lg font-bold">Logout / Switch Role</span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-red-200 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-stone-900 rounded-[3.5rem] p-10 text-white space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <h3 className="text-xl font-black tracking-tight relative z-10">Recent Activity</h3>
                    <div className="space-y-6 relative z-10">
                      {[
                        { title: 'Sold 50kg Wheat', time: '2h ago', icon: <ShoppingCart className="w-4 h-4" /> },
                        { title: 'New Message from Rajesh', time: '5h ago', icon: <MessageSquare className="w-4 h-4" /> },
                        { title: 'AI Analysis Completed', time: 'Yesterday', icon: <Activity className="w-4 h-4" /> },
                      ].map((activity, i) => (
                        <div key={i} className="flex items-center gap-4 group cursor-default">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            {activity.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{activity.title}</div>
                            <div className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">{activity.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                      View All Activity
                    </button>
                  </div>

                  <div className="bg-emerald-600 rounded-[3.5rem] p-10 text-white space-y-6 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/20 rounded-full -ml-16 -mb-16 blur-2xl" />
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black tracking-tight">Premium Member</h3>
                      <p className="text-emerald-100 text-sm font-medium leading-relaxed opacity-80">
                        You have access to exclusive market insights and priority AI support.
                      </p>
                    </div>
                    <button className="w-full py-4 bg-white text-emerald-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg">
                      Manage Plan
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* More Tab - Consolidated Features */}
          {activeTab === 'more' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 max-w-5xl mx-auto"
            >
              {/* Sub-tab Navigation */}
              <div className="flex flex-wrap gap-2 p-4 bg-white rounded-2xl border-2 border-stone-200 sticky top-24 z-20">
                <button
                  onClick={() => setMoreTab('pest-detection')}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold transition-all text-sm",
                    moreTab === 'pest-detection'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  🐛 Pest
                </button>
                <button
                  onClick={() => setMoreTab('harvest-planner')}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold transition-all text-sm",
                    moreTab === 'harvest-planner'
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  🚜 Harvest
                </button>
                <button
                  onClick={() => setMoreTab('farm-notebook')}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold transition-all text-sm",
                    moreTab === 'farm-notebook'
                      ? 'bg-amber-600 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  📝 Diary
                </button>
                <button
                  onClick={() => setMoreTab('community')}
                  className={cn(
                    "px-4 py-2 rounded-xl font-bold transition-all text-sm",
                    moreTab === 'community'
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  )}
                >
                  💬 Forum
                </button>

              </div>

              {/* Pest Detection Sub-Tab */}
              {moreTab === 'pest-detection' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="p-8 bg-linear-to-br from-red-50 to-orange-50 rounded-4xl border-2 border-red-200">
                    <h3 className="text-2xl font-black text-stone-900 mb-6 flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                      AI Pest Detection
                    </h3>
                    <div className="space-y-4">
                      <label className="p-8 border-2 border-dashed border-stone-300 rounded-2xl text-center cursor-pointer hover:border-red-400 transition-all bg-white block">
                        <p className="text-4xl mb-3">📸</p>
                        <p className="font-bold text-stone-900 mb-2">Upload Crop Image</p>
                        <p className="text-sm text-stone-600">Upload a photo of affected area</p>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setPestDetectionImage(event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                      {pestDetectionImage && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-4 bg-white rounded-2xl border-2 border-emerald-300"
                        >
                          <p className="text-sm font-bold text-stone-900 mb-3">✅ Image Uploaded</p>
                          <img src={pestDetectionImage} alt="Pest detection" className="w-full h-48 object-cover rounded-xl mb-3" />
                          <button 
                            onClick={handleAnalyzePest}
                            disabled={pestAnalysisLoading}
                            className="w-full py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {pestAnalysisLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                🔍 Analyze with AI
                              </>
                            )}
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="p-6 bg-white rounded-2xl border-2 border-stone-200">
                      <h4 className="font-black text-stone-900 mb-4">🐛 Common Pests</h4>
                      <div className="space-y-3">
                        {['Armyworm', 'Wheat rust', 'Leaf spot', 'Powdery mildew'].map((pest, idx) => (
                          <div key={idx} className="p-3 bg-stone-50 rounded-lg text-sm font-bold text-stone-700">{pest}</div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border-2 border-stone-200">
                      <h4 className="font-black text-stone-900 mb-4">💊 Prevention Tips</h4>
                      <div className="space-y-2 text-sm text-stone-600">
                        <p>✓ Use resistant varieties</p>
                        <p>✓ Monitor fields regularly</p>
                        <p>✓ Apply approved pesticides</p>
                        <p>✓ Practice crop rotation</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Pest Analysis Modal */}
              {showPestResultModal && (
                <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-md z-100 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white rounded-4xl max-w-2xl w-full max-h-[90vh] overflow-y-auto no-scrollbar relative shadow-2xl"
                  >
                    <button 
                      onClick={() => {
                        setShowPestResultModal(false);
                        setPestAnalysisResult(null);
                      }}
                      className="absolute top-8 right-8 p-3 bg-white/80 backdrop-blur-md rounded-full text-stone-400 hover:text-red-500 transition-all z-20 shadow-lg border border-stone-100"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    <div className="relative h-48 bg-linear-to-br from-red-500 to-orange-600 flex items-center justify-center overflow-hidden">
                      <div className="relative z-10 text-7xl transform hover:scale-110 transition-transform duration-700 cursor-default">
                        🔬
                      </div>
                    </div>

                    <div className="p-12 space-y-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          🔍 AI Analysis
                        </div>
                        <h2 className="text-3xl font-black text-stone-900 tracking-tighter">Pest Detection Results</h2>
                      </div>

                      {pestAnalysisLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="w-16 h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-stone-600 font-bold">Analyzing your image...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 space-y-4">
                          <p className="text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                            {pestAnalysisResult}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            setShowPestResultModal(false);
                            setPestAnalysisResult(null);
                            setPestDetectionImage(null);
                          }}
                          className="py-3 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            setShowPestResultModal(false);
                            setActiveTab('chat');
                          }}
                          className="py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
                        >
                          Ask Expert
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Harvest Planner Sub-Tab */}
              {moreTab === 'harvest-planner' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="p-8 bg-linear-to-br from-amber-50 to-orange-50 rounded-4xl border-2 border-amber-200 mb-6">
                    <h3 className="text-xl font-black text-stone-900 mb-4">🌾 Plan New Crop</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Crop name (e.g., Wheat, Rice)"
                        value={newHarvestPlan.crop}
                        onChange={(e) => setNewHarvestPlan({...newHarvestPlan, crop: e.target.value})}
                        className="px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-amber-500"
                      />
                      <input
                        type="date"
                        placeholder="Planting Date"
                        value={newHarvestPlan.plantingDate}
                        onChange={(e) => setNewHarvestPlan({...newHarvestPlan, plantingDate: e.target.value})}
                        className="px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-amber-500"
                      />
                      <input
                        type="date"
                        placeholder="Harvest Date"
                        value={newHarvestPlan.harvestDate}
                        onChange={(e) => setNewHarvestPlan({...newHarvestPlan, harvestDate: e.target.value})}
                        className="px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-amber-500"
                      />
                      <input
                        type="number"
                        placeholder="Est. Yield (quintals)"
                        value={newHarvestPlan.estimatedYield}
                        onChange={(e) => setNewHarvestPlan({...newHarvestPlan, estimatedYield: e.target.value})}
                        className="px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-amber-500"
                      />
                    </div>
                    <button className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">
                      ➕ Add Plan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {harvestPlans.map((plan, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          "p-6 rounded-2xl border-2",
                          plan.status === 'ready' ? 'bg-amber-50 border-amber-300' :
                          plan.status === 'growing' ? 'bg-green-50 border-green-300' :
                          'bg-blue-50 border-blue-300'
                        )}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-2xl font-black text-stone-900">{plan.crop}</h3>
                          <span className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full",
                            plan.status === 'ready' ? 'bg-amber-200 text-amber-700' :
                            plan.status === 'growing' ? 'bg-green-200 text-green-700' :
                            'bg-blue-200 text-blue-700'
                          )}>
                            {plan.status.toUpperCase()}
                          </span>
                        </div>

                        <motion.div animate={{ width: plan.status === 'ready' ? '95%' : plan.status === 'growing' ? '50%' : '20%' }} className="h-3 bg-stone-300 rounded-full overflow-hidden mb-6">
                          <div className={cn(
                            "h-full",
                            plan.status === 'ready' ? 'bg-amber-500' :
                            plan.status === 'growing' ? 'bg-green-500' :
                            'bg-blue-500'
                          )} />
                        </motion.div>

                        <div className="space-y-3 text-sm">
                          <p><strong>📅 Planted:</strong> {new Date(plan.plantingDate).toLocaleDateString()}</p>
                          <p><strong>🎯 Ready:</strong> {new Date(plan.harvestDate).toLocaleDateString()}</p>
                          <p><strong>📊 Est. Yield:</strong> {plan.estimatedYield} quintals</p>
                          {plan.status === 'ready' && (
                            <button className="w-full mt-3 py-2 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">
                              🚜 Start Harvest
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Farm Notebook Sub-Tab */}
              {moreTab === 'farm-notebook' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Which crop? (e.g., Wheat, Rice)"
                        value={newNotebookEntry.crop}
                        onChange={(e) => setNewNotebookEntry({...newNotebookEntry, crop: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all">
                      📝 Add Entry
                    </button>
                  </div>

                  <textarea
                    placeholder="What happened today? (e.g., Applied fertilizer, noticed pest activity, harvested field 3...)"
                    value={newNotebookEntry.note}
                    onChange={(e) => setNewNotebookEntry({...newNotebookEntry, note: e.target.value})}
                    className="w-full px-4 py-4 border-2 border-stone-200 rounded-2xl outline-none focus:border-emerald-500 h-24 resize-none mt-4"
                  />

                  <div className="space-y-4 mt-6">
                    {farmNotebookEntries.map((entry, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-6 bg-linear-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-xl font-black text-stone-900">🌾 {entry.crop}</p>
                            <p className="text-sm text-stone-500">{new Date(entry.date).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs bg-emerald-500 text-white px-3 py-1 rounded-full font-bold">Logged</span>
                        </div>
                        <p className="text-stone-700 leading-relaxed">{entry.note}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Community Forum Sub-Tab */}
              {moreTab === 'community' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="p-8 bg-linear-to-br from-purple-50 to-pink-50 rounded-4xl border-2 border-purple-200">
                    <h3 className="text-xl font-black text-stone-900 mb-4">💬 Ask Community</h3>
                    <input
                      type="text"
                      placeholder="Crop name..."
                      value={newCommunityPost.crop}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-purple-500 mb-3"
                      onChange={(e) => setNewCommunityPost({...newCommunityPost, crop: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Question title..."
                      value={newCommunityPost.title}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-purple-500 mb-3"
                      onChange={(e) => setNewCommunityPost({...newCommunityPost, title: e.target.value})}
                    />
                    <textarea
                      placeholder="Describe your issue..."
                      value={newCommunityPost.content}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl outline-none focus:border-purple-500 h-24 resize-none mb-4"
                      onChange={(e) => setNewCommunityPost({...newCommunityPost, content: e.target.value})}
                    />
                    <button 
                      onClick={() => {
                        if (newCommunityPost.crop && newCommunityPost.title && newCommunityPost.content) {
                          const newPost = {
                            id: `post_${Date.now()}`,
                            author: 'You',
                            crop: newCommunityPost.crop,
                            title: newCommunityPost.title,
                            content: newCommunityPost.content,
                            likes: 0,
                            replies: 0,
                            timestamp: Date.now()
                          };
                          setCommunityPosts([newPost, ...communityPosts]);
                          setNewCommunityPost({ crop: '', title: '', content: '' });
                        } else {
                          alert('Please fill in all fields!');
                        }
                      }}
                      className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50"
                    >
                      Post Question
                    </button>
                  </div>

                  <div className="space-y-4 mt-6">
                    {communityPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        whileHover={{ scale: 1.002 }}
                        className="p-6 bg-white rounded-2xl border-2 border-stone-200 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">{post.crop}</span>
                              <p className="text-xs text-stone-500">{Math.floor((Date.now() - post.timestamp) / 86400000)} days ago</p>
                            </div>
                            <h4 className="text-lg font-black text-stone-900 cursor-pointer hover:text-purple-600" onClick={() => setSelectedPostForReplies(selectedPostForReplies === post.id ? null : post.id)}>{post.title}</h4>
                          </div>
                        </div>
                        <p className="text-stone-600 mb-4">{post.content}</p>
                        
                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-4 text-sm font-bold pb-4 border-b border-stone-100">
                          <button
                            onClick={() => handleLikePost(post.id)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                              likedPosts.has(post.id)
                                ? 'bg-red-100 text-red-600'
                                : 'bg-stone-100 text-stone-600 hover:bg-red-50'
                            )}
                          >
                            {likedPosts.has(post.id) ? '❤️' : '👍'} {post.likes} likes
                          </button>
                          <button
                            onClick={() => setSelectedPostForReplies(selectedPostForReplies === post.id ? null : post.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all"
                          >
                            💬 {post.replies} replies
                          </button>
                        </div>

                        {/* Replies Section */}
                        {selectedPostForReplies === post.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 space-y-4"
                          >
                            {/* List of Replies */}
                            {(postReplies.get(post.id) || []).length > 0 && (
                              <div className="bg-stone-50 p-4 rounded-xl space-y-3 max-h-64 overflow-y-auto">
                                <p className="text-xs font-bold text-stone-500 uppercase">Replies ({(postReplies.get(post.id) || []).length})</p>
                                {(postReplies.get(post.id) || []).map((reply, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded-lg border border-stone-100">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="text-xs font-black text-stone-900">{reply.author}</p>
                                      <p className="text-[10px] text-stone-400">{new Date(reply.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-sm text-stone-700">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Reply */}
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-3">
                              <p className="text-xs font-bold text-purple-600 uppercase">Add Your Reply</p>
                              <textarea
                                value={newReply.postId === post.id ? newReply.content : ''}
                                onChange={(e) => setNewReply({ postId: post.id, content: e.target.value })}
                                placeholder="Share your experience or advice..."
                                className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg outline-none focus:border-purple-500 text-sm resize-none"
                                rows={3}
                              />
                              <button
                                onClick={() => {
                                  handleAddReply(post.id);
                                }}
                                className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-all text-sm"
                              >
                                Post Reply
                              </button>
                            </div>
                          </motion.div>
                        )}

                        <p className="text-xs text-stone-500 mt-3 pt-3 border-t">By {post.author}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}


            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, onClick }: { icon: React.ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -15 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white p-8 rounded-4xl text-left space-y-4 shadow-lg border border-stone-100 card-hover group relative overflow-hidden"
    >
      {/* Animated background gradient on hover */}
      <motion.div 
        className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100"
        transition={{ duration: 0.5 }}
      />
      
      <div className="relative z-10 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-md">
        <motion.div
          whileHover={{ rotate: 10, scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {icon}
        </motion.div>
      </div>
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl font-black text-stone-900 group-hover:text-emerald-600 transition-colors">{title}</h3>
        <p className="text-sm text-stone-500 leading-relaxed group-hover:text-stone-700 transition-colors">{description}</p>
      </div>
      <div className="relative z-10 pt-2 flex items-center gap-2 text-emerald-600 font-bold text-xs">
        <span>Learn More</span>
        <motion.div
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
          transition={{ type: 'spring' }}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </div>
      
      {/* Animated shine effect */}
      <motion.div 
        className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"
        animate={{ x: ['-100%', '200%'], y: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.button>
  );
}

function ExploreRegions({ t, language }: { t: any; language: string }) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const stateData = selectedState ? INDIAN_STATES.find(s => s.name === selectedState) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto p-4"
    >
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.exploreRegions}</h2>
        <p className="text-gray-600 text-sm">{t.exploreRegionsDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {t.selectStateToExplore}
            </h3>
            <div className="space-y-1.5 max-h-125 overflow-y-auto pr-2 custom-scrollbar">
              {INDIAN_STATES.map((state) => (
                <button
                  key={state.name}
                  onClick={() => setSelectedState(state.name)}
                  className={clsx(
                    "w-full text-left px-3 py-2 rounded-xl transition-all duration-200 text-sm",
                    selectedState === state.name
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 border"
                      : "hover:bg-gray-50 text-gray-700 border-transparent border"
                  )}
                >
                  {state.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* State Data Display */}
        <div className="lg:col-span-2">
          {stateData ? (
            <div className="space-y-5">
              {/* Weather & Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedState}</h3>
                    <p className="text-xs text-gray-500">{t.weather} & {t.diagnosedDiseases}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{stateData.temp}°C</div>
                      <div className="text-xs text-gray-500 capitalize">{stateData.weather}</div>
                    </div>
                    {stateData.weather === 'sunny' ? <Sun className="w-8 h-8 text-amber-500" /> : 
                     stateData.weather === 'rainy' ? <CloudRain className="w-8 h-8 text-blue-500" /> : 
                     <CloudRain className="w-8 h-8 text-gray-400" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Droplets className="w-3 h-3" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{t.humidity}</span>
                    </div>
                    <div className="text-base font-bold text-blue-900">{stateData.humidity}%</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Thermometer className="w-3 h-3" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{t.temperature}</span>
                    </div>
                    <div className="text-base font-bold text-amber-900">{stateData.temp}°C</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <Sprout className="w-3 h-3" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{t.majorCrops}</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-900 truncate">{stateData.crops.join(', ')}</div>
                  </div>
                </div>
              </div>

              {/* Diseases Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  {t.diagnosedDiseases}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stateData.diseases.map((disease, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                      <h4 className="text-base font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {disease.name}
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t.symptoms}</div>
                          <p className="text-xs text-gray-600 leading-relaxed">{disease.symptoms}</p>
                        </div>
                        
                        <div className="pt-3 border-t border-gray-50">
                          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {t.prevention}
                          </div>
                          <p className="text-xs text-gray-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                            {disease.prevention}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-100 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.selectStateToExplore}</h3>
              <p className="text-sm text-gray-500 max-w-xs">{t.exploreRegionsDesc}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ToolCard({ icon, title, description, onClick, color }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; color: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-8 rounded-[2.5rem] text-left space-y-4 shadow-xl shadow-stone-200/40 border border-stone-100 transition-all relative overflow-hidden group",
        color
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      
      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-stone-200/20 relative z-10 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="relative z-10 space-y-1">
        <h3 className="text-xl font-black text-stone-900 tracking-tight">{title}</h3>
        <p className="text-sm text-stone-500 font-medium leading-relaxed">{description}</p>
      </div>
      <div className="pt-2 flex items-center gap-2 text-stone-900 font-bold text-xs relative z-10 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        Open Tool <ArrowRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
}

function HeaderNavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center justify-center lg:justify-start gap-2.5 px-4 py-2.5 rounded-2xl transition-all duration-300 whitespace-nowrap relative group",
        active 
          ? "bg-white shadow-md shadow-emerald-100 text-emerald-600 font-black scale-105" 
          : "text-stone-500 hover:text-emerald-600 hover:bg-white/60 hover:scale-105"
      )}
    >
      <motion.div
        animate={active ? { scale: [1, 1.15, 1], rotateZ: [0, 8, 0] } : { scale: 1 }}
        whileHover={{ scale: 1.15 }}
        transition={{ duration: 0.4 }}
        className="shrink-0"
      >
        {icon}
      </motion.div>
      <span className="text-xs lg:text-sm hidden lg:block tracking-tight font-bold whitespace-nowrap">{label}</span>
      {active && (
        <motion.div 
          layoutId="header-nav-indicator"
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-md shadow-emerald-300"
        />
      )}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1 p-3 rounded-3xl transition-all duration-300",
        active ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-stone-400 hover:text-stone-600"
      )}
    >
      {icon}
      {active && (
        <motion.span 
          layoutId="nav-label"
          className="text-[10px] font-black uppercase tracking-tighter"
        >
          {label}
        </motion.span>
      )}
    </button>
  );
}
