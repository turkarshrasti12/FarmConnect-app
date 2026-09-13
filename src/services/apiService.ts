// Type definitions for API service
export interface Feedback {
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

export interface CostProfitParams {
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

export interface CostProfitResult {
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

export interface CropRecommendation {
  name: string;
  compatibility: number; // 0-100
  reasoning: string;
  expectedYield: string;
  season: string;
  waterNeeded: string;
  soilType: string;
}

// Mock database for feedbacks
let mockFeedbacks: Feedback[] = [
  {
    id: '1',
    customerName: 'Ram Kumar',
    phone: '+91 98765 43210',
    email: 'ram@example.com',
    cropName: 'Wheat',
    message: 'Great recommendations! The wheat yield increased by 15% this year.',
    rating: 5,
    timestamp: Date.now() - 86400000,
    reply: 'Thank you! We are glad to help improve your yield.'
  },
  {
    id: '2',
    customerName: 'Priya Singh',
    phone: '+91 87654 32109',
    email: 'priya@example.com',
    cropName: 'Rice',
    message: 'The cost analysis was very helpful. Saved ₹5000 on inputs.',
    rating: 4,
    timestamp: Date.now() - 172800000,
  }
];

// API Service
export const apiService = {
  // Get all feedbacks
  getFeedbacks: async () => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: mockFeedbacks
      };
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      return { success: false, data: null };
    }
  },

  // Add new feedback
  addFeedback: async (feedback: Omit<Feedback, 'id' | 'timestamp'>) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newFeedback: Feedback = {
        ...feedback,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      };
      
      mockFeedbacks = [newFeedback, ...mockFeedbacks];
      
      return {
        success: true,
        data: newFeedback
      };
    } catch (error) {
      console.error('Error adding feedback:', error);
      return { success: false, data: null };
    }
  },

  // Calculate cost and profit
  calculateCostProfit: async (params: CostProfitParams): Promise<{ success: boolean; data: CostProfitResult | null }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const totalInputCost = 
        params.seedCost +
        params.fertilizerCost +
        params.pesticideCost +
        params.laborCost +
        params.irrigationCost +
        params.transportationCost +
        params.miscCost +
        params.otherCost;

      // Simulate yield calculation (varies by crop)
      const yieldPerHectare: Record<string, number> = {
        'Wheat': 50,
        'Rice': 60,
        'Cotton': 20,
        'Sugarcane': 80,
        'Maize': 45,
        'Potato': 200,
        'Tomato': 300,
        'Onion': 400
      };

      const marketPrices: Record<string, number> = {
        'Wheat': 2500,
        'Rice': 2400,
        'Cotton': 5500,
        'Sugarcane': 350,
        'Maize': 1900,
        'Potato': 1200,
        'Tomato': 2000,
        'Onion': 1800
      };

      const yield_per_hectare = yieldPerHectare[params.crop] || 50;
      const market_price = marketPrices[params.crop] || 2000;
      const expectedYield = yield_per_hectare * params.area;
      const expectedRevenue = expectedYield * market_price;
      const totalProfit = expectedRevenue - totalInputCost;
      const profitMargin = (totalProfit / expectedRevenue) * 100;
      const profitPerHectare = totalProfit / params.area;
      const roi = (totalProfit / totalInputCost) * 100;

      return {
        success: true,
        data: {
          crop: params.crop,
          area: params.area,
          totalInputCost,
          expectedYield,
          marketPrice: market_price,
          expectedRevenue,
          totalProfit,
          profitMargin,
          profitPerHectare,
          roi
        }
      };
    } catch (error) {
      console.error('Error calculating cost-profit:', error);
      return { success: false, data: null };
    }
  },

  // Get crop recommendations
  getRecommendedCrops: async (params: {
    location: string;
    soilType: string;
    temperature: number;
    rainfall: number;
    season: string;
  }): Promise<{ success: boolean; data: CropRecommendation[] | null }> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock recommendations based on conditions
      const recommendations: CropRecommendation[] = [];

      // Kharif season (Monsoon)
      if (params.season.toLowerCase() === 'kharif') {
        if (params.rainfall > 500) {
          recommendations.push({
            name: 'Rice',
            compatibility: 95,
            reasoning: 'Excellent rainfall and soil conditions for rice cultivation',
            expectedYield: '60-70 quintals/hectare',
            season: 'Kharif (June-October)',
            waterNeeded: '1200-1500 mm',
            soilType: 'Clay loam'
          });
        }
        recommendations.push({
          name: 'Maize',
          compatibility: 85,
          reasoning: 'Good rainfall distribution suits maize growth',
          expectedYield: '45-50 quintals/hectare',
          season: 'Kharif (June-September)',
          waterNeeded: '500-600 mm',
          soilType: 'Alluvial'
        });
        recommendations.push({
          name: 'Cotton',
          compatibility: 75,
          reasoning: 'Suitable in medium rainfall areas with good drainage',
          expectedYield: '18-22 quintals/hectare',
          season: 'Kharif (June-December)',
          waterNeeded: '600-800 mm',
          soilType: 'Black soil'
        });
      }

      // Rabi season (Winter)
      if (params.season.toLowerCase() === 'rabi') {
        recommendations.push({
          name: 'Wheat',
          compatibility: 90,
          reasoning: 'Perfect temperature and rainfall for wheat cultivation',
          expectedYield: '50-55 quintals/hectare',
          season: 'Rabi (October-March)',
          waterNeeded: '400-600 mm',
          soilType: 'Loamy'
        });
        recommendations.push({
          name: 'Gram',
          compatibility: 80,
          reasoning: 'Low water requirement, suitable for rabi season',
          expectedYield: '20-25 quintals/hectare',
          season: 'Rabi (October-March)',
          waterNeeded: '300-400 mm',
          soilType: 'Sandy loam'
        });
        recommendations.push({
          name: 'Mustard',
          compatibility: 85,
          reasoning: 'Thrives in cool climate with moderate rainfall',
          expectedYield: '18-22 quintals/hectare',
          season: 'Rabi (October-February)',
          waterNeeded: '400-500 mm',
          soilType: 'Sandy loam'
        });
      }

      // Add flexibility for annual crops
      if (params.temperature > 25 && params.rainfall > 300) {
        recommendations.push({
          name: 'Sugarcane',
          compatibility: 88,
          reasoning: 'Warm and humid climate ideal for sugarcane',
          expectedYield: '80-100 quintals/hectare',
          season: 'Annual (Year-round)',
          waterNeeded: '1500-2250 mm',
          soilType: 'Alluvial'
        });
      }

      if (params.soilType.toLowerCase().includes('black') || params.soilType.toLowerCase().includes('loamy')) {
        recommendations.push({
          name: 'Soybean',
          compatibility: 82,
          reasoning: 'Black/loamy soil perfect for soybean cultivation',
          expectedYield: '20-25 quintals/hectare',
          season: 'Kharif (June-October)',
          waterNeeded: '450-600 mm',
          soilType: 'Black/Loamy'
        });
      }

      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      console.error('Error getting crop recommendations:', error);
      return { success: false, data: null };
    }
  }
};
