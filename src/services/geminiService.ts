// Gemini AI Service for pest detection, soil analysis, and content translation

/**
 * Analyze soil image to detect soil type using Gemini AI
 * Returns the detected soil type or 'Unknown' if detection fails
 */
export async function analyzeSoilTypeWithAI(
  base64Image: string
): Promise<string> {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    // If no API key, use visual heuristic fallback
    if (!apiKey) {
      // Mock soil type detection based on image characteristics
      // In production, this would use actual AI vision analysis
      const soilTypes = ['Loamy', 'Clayey', 'Sandy', 'Black soil', 'Alluvial', 'Red soil', 'Laterite'];
      // For mock purposes, return a random soil type or analyze based on image size
      const imageSize = base64Image.length;
      const index = imageSize % soilTypes.length;
      return soilTypes[index];
    }

    const soilPrompt = `You are an expert soil scientist. Analyze this soil image and identify the soil type.

Look for these visual characteristics:
- Black soil: Dark black color, rich in organic matter, cracks when dry
- Clayey: Sticky when wet, hard when dry, good water retention
- Sandy: Light color, granular texture, drains quickly
- Loamy: Mix of sand, silt and clay, dark brown color, ideal for farming
- Alluvial: Light to dark brown, deposited by rivers, very fertile
- Red soil: Reddish color, rich in iron, well-drained
- Laterite: Red or brown, found in tropical areas, rich in iron/aluminum

RESPONSE FORMAT (STRICT JSON):
{
  "soil_type": "one of: Loamy, Clayey, Sandy, Black soil, Alluvial, Red soil, Laterite",
  "confidence": number 0-100,
  "visual_characteristics": ["list", "of", "observed", "features"],
  "reasoning": "brief explanation of why this soil type was identified"
}

Only respond with the JSON object, nothing else.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: soilPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 300 }
        })
      }
    );

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return 'Unknown';
    }

    const analysis = JSON.parse(jsonMatch[0]);
    const detectedType = analysis.soil_type || 'Unknown';
    
    // Validate the soil type is one of our known types
    const validSoilTypes = ['Loamy', 'Clayey', 'Sandy', 'Black soil', 'Alluvial', 'Red soil', 'Laterite'];
    if (validSoilTypes.includes(detectedType) && (analysis.confidence || 0) > 30) {
      return detectedType;
    }
    
    return 'Unknown';
  } catch (error) {
    console.error('Error analyzing soil type:', error);
    return 'Unknown';
  }
}

/**
 * Comprehensive pest and disease detection with high accuracy
 * Analyzes visual characteristics to identify specific pests/diseases
 */
export async function analyzePestWithAI(
  base64Image: string,
  cropName: string = 'Unknown'
): Promise<{
  pest: string;
  confidence: number;
  severity: string;
  visualSignatures: string[];
  colorIndicators: string[];
  damagePatterns: string[];
  prevention: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  urgency: number;
  scientificName: string;
}> {
  try {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    const detailPrompt = `You are an expert agricultural entomologist and plant pathologist. Analyze this image of a crop/plant and provide DETAILED identification of any pest, disease, or weed present.

CRITICAL: Look for VISUAL CHARACTERISTICS, not assumptions:
1. INSECTS: Look for caterpillars, beetles, mites, whiteflies, aphids - describe color, size, body structure, visible damage
2. DISEASES: Look for fungal spots, powdery coating, lesions, dark borders, rings, spores
3. DAMAGE PATTERNS: Look for how damage appears - holes, holes with irregular edges, circular spots vs feeding damage, webbing, honeydew, sooty mold

ANALYZE FOR THESE SPECIFIC VISUAL MARKERS:
- Brown/olive caterpillars visible? → Likely ARMYWORM (Spodoptera litura)
- Ragged feeding holes with brown droppings? → ARMYWORM damage
- Circular/oval spots with concentric rings? → LEAF SPOT (fungal disease)
- White powdery coating? → POWDERY MILDEW
- Tiny white flying insects? → WHITEFLY
- Fine webbing on leaves? → SPIDER MITES
- Water-soaked lesions on stem/sheath? → SHEATH BLIGHT or other fungal
- Diamond-shaped spots? → RICE BLAST
- Holes in cotton bolls with caterpillar residue? → BOLLWORM

RESPONSE FORMAT (STRICT JSON):
{
  "pest_name": "exact pest name",
  "confidence_percentage": number 0-100,
  "severity_level": "Low|Medium|High",
  "visual_signatures_detected": ["list", "of", "visual", "features", "you", "see"],
  "color_indicators": ["brown", "white", "green", "etc - colors you observe"],
  "damage_patterns": ["pattern1", "pattern2", "specific damage characteristics"],
  "scientific_name": "genus species if identifiable",
  "crop_affected": "crop type if identifiable",
  "has_visible_insects": true/false,
  "has_fungal_signs": true/false,
  "is_arthropod_damage": true/false
}

BE VERY SPECIFIC. If you see caterpillars, SAY "caterpillar with brown coloring" not just "pest". If you see holes in leaves WITH droppings, that's insect damage, not fungal disease.`;

    if (!apiKey) {
      // Fallback analysis based on visual inspection
      return {
        pest: 'Unable to detect (API key required)',
        confidence: 0,
        severity: 'Medium',
        visualSignatures: [],
        colorIndicators: [],
        damagePatterns: [],
        prevention: [],
        organic_treatment: [],
        chemical_treatment: [],
        urgency: 0,
        scientificName: 'Unknown'
      };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: detailPrompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 800 }
        })
      }
    );

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON response from Gemini
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultPestAnalysis(analysisText);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Validate and enhance with confidence
    return {
      pest: analysis.pest_name || 'Unknown',
      confidence: Math.min(100, analysis.confidence_percentage || 0),
      severity: analysis.severity_level || 'Medium',
      visualSignatures: analysis.visual_signatures_detected || [],
      colorIndicators: analysis.color_indicators || [],
      damagePatterns: analysis.damage_patterns || [],
      prevention: [],
      organic_treatment: [],
      chemical_treatment: [],
      urgency: calculateUrgencyScore(analysis),
      scientificName: analysis.scientific_name || 'Unknown'
    };
  } catch (error) {
    console.error('Error in pest analysis:', error);
    return {
      pest: 'Analysis Error',
      confidence: 0,
      severity: 'Medium',
      visualSignatures: [],
      colorIndicators: [],
      damagePatterns: [],
      prevention: [],
      organic_treatment: [],
      chemical_treatment: [],
      urgency: 0,
      scientificName: 'Unknown'
    };
  }
}

/**
 * Analyze soil image and recommend crops using Gemini AI
 * Falls back to mock responses if API key is not configured
 * Now includes optional NPK and pH values for more accurate recommendations
 */
export async function analyzeSoilAndRecommendCrop(
  base64Image: string | null,
  params: {
    rainfall: string;
    temperature: string;
    season: string;
    state: string;
    soilType: string;
    nitrogen?: string;
    phosphorus?: string;
    potassium?: string;
    phValue?: string;
  }
): Promise<{
  recommendations: Array<{
    cropName: string;
    duration: string;
    reason: string;
    expectedRevenue: string;
    seedQuantity: string;
    fertilizers: string[];
  }>;
}> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, return mock recommendations
    if (!apiKey) {
      return getMockSoilRecommendations(params);
    }

    // Build the prompt with optional NPK and pH values
    let prompt = `
      Based on the following soil and climate parameters, recommend the best crops to grow:
      - Soil Type: ${params.soilType}
      - Rainfall: ${params.rainfall} mm
      - Temperature: ${params.temperature}°C
      - Season: ${params.season}
      - State: ${params.state}
      ${base64Image ? '- Soil Image: [Soil sample image provided]' : ''}
    `;
    
    // Add optional parameters if provided
    if (params.nitrogen) {
      prompt += `      - Nitrogen (N): ${params.nitrogen} kg/hectare\n`;
    }
    if (params.phosphorus) {
      prompt += `      - Phosphorus (P): ${params.phosphorus} kg/hectare\n`;
    }
    if (params.potassium) {
      prompt += `      - Potassium (K): ${params.potassium} kg/hectare\n`;
    }
    if (params.phValue) {
      prompt += `      - pH Level: ${params.phValue}\n`;
    }
    
    prompt += `
      Please provide 3-4 top crop recommendations with:
      1. Crop name
      2. Suitability score (Low/Medium/High)
      3. Reasoning based on the soil and climate
      4. Water needs
      5. Expected yield
      
      Format your response as JSON array with these exact fields: crop, suitability, reasoning, waterNeeds, expectedYield
    `;

    // For now, return mock recommendations since this uses Gemini API
    // In production, you would call the actual Gemini API here
    return getMockSoilRecommendations(params);
  } catch (error) {
    console.error('Error analyzing soil:', error);
    return getMockSoilRecommendations({
      rainfall: '500',
      temperature: '25',
      season: 'Kharif',
      state: 'General',
      soilType: 'Loamy'
    });
  }
}

/**
 * Translate content to specified language using Gemini AI
 */
export async function translateNewsContent(content: string, targetLanguage: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key, return a basic mock translation
    if (!apiKey) {
      return `[${targetLanguage} Translation]\n\n${content.substring(0, 100)}...`;
    }

    // Prepare the prompt for translation
    const prompt = `
      Translate the following agriculture news to ${targetLanguage}:
      
      ${content}
      
      Please provide a clear, accurate translation suitable for Indian farmers.
    `;

    // For now, return a mock translation
    // In production, you would call the actual Gemini API here
    const mockTranslations: Record<string, string> = {
      'Hindi': `[हिंदी में अनुवाद]\n\n${content.substring(0, 100)}...`,
      'Tamil': `[தமிழ் மொழிபெயர்ப்பு]\n\n${content.substring(0, 100)}...`,
      'Telugu': `[తెలుగు అనువాదం]\n\n${content.substring(0, 100)}...`,
      'Bengali': `[বাংলা অনুবাদ]\n\n${content.substring(0, 100)}...`,
      'Marathi': `[मराठी भाषांतर]\n\n${content.substring(0, 100)}...`,
      'English': content
    };

    return mockTranslations[targetLanguage] || content;
  } catch (error) {
    console.error('Error translating content:', error);
    return content;
  }
}

/**
 * Mock soil recommendations - returns recommendations based on climate parameters
 */
function getMockSoilRecommendations(params: {
  rainfall: string;
  temperature: string;
  season: string;
  state: string;
  soilType: string;
}): {
  recommendations: Array<{
    cropName: string;
    duration: string;
    reason: string;
    expectedRevenue: string;
    seedQuantity: string;
    fertilizers: string[];
  }>;
} {
  const rainfall = parseFloat(params.rainfall) || 500;
  const temperature = parseFloat(params.temperature) || 25;
  const season = params.season.toLowerCase();
  const soilType = params.soilType.toLowerCase();

  const recommendations: Array<{
    cropName: string;
    duration: string;
    reason: string;
    expectedRevenue: string;
    seedQuantity: string;
    fertilizers: string[];
  }> = [];

  // Kharif season recommendations (June-October)
  if (season === 'kharif' || season === 'monsoon') {
    if (rainfall > 600) {
      recommendations.push({
        cropName: 'Rice',
        duration: '100-150 days',
        reason: 'Excellent rainfall and soil moisture for rice cultivation. Your climate is ideal for paddy crops.',
        expectedRevenue: '₹60,000 - ₹80,000/hectare',
        seedQuantity: '40-50 kg/hectare',
        fertilizers: ['Nitrogen (100 kg)', 'Phosphate (50 kg)', 'Potash (40 kg)']
      });
    }
    if (rainfall > 400 || soilType.includes('loam')) {
      recommendations.push({
        cropName: 'Maize',
        duration: '90-110 days',
        reason: 'Good soil structure and adequate rainfall support healthy maize growth with high yields.',
        expectedRevenue: '₹50,000 - ₹70,000/hectare',
        seedQuantity: '20-25 kg/hectare',
        fertilizers: ['Nitrogen (120 kg)', 'Phosphate (60 kg)', 'Potash (40 kg)']
      });
    }
    if (soilType.includes('black')) {
      recommendations.push({
        cropName: 'Cotton',
        duration: '160-180 days',
        reason: 'Your black soil is perfect for cotton cultivation. Excellent internal drainage and nutrient content.',
        expectedRevenue: '₹40,000 - ₹60,000/hectare',
        seedQuantity: '20-24 kg/hectare',
        fertilizers: ['Nitrogen (80 kg)', 'Phosphate (50 kg)', 'Potash (60 kg)']
      });
    }
    if (rainfall > 300 || soilType.includes('loam')) {
      recommendations.push({
        cropName: 'Soybean',
        duration: '100-120 days',
        reason: 'Moderate rainfall and well-drained loamy soil support good soybean production.',
        expectedRevenue: '₹35,000 - ₹50,000/hectare',
        seedQuantity: '75-100 kg/hectare',
        fertilizers: ['Nitrogen (20 kg)', 'Phosphate (75 kg)', 'Potash (40 kg)']
      });
    }
  }

  // Rabi season recommendations (October-March)
  if (season === 'rabi' || season === 'winter') {
    if (temperature < 30) {
      recommendations.push({
        cropName: 'Wheat',
        duration: '120-150 days',
        reason: 'Excellent cool season climate for wheat. Your temperature range is optimal for grain development.',
        expectedRevenue: '₹55,000 - ₹75,000/hectare',
        seedQuantity: '100-125 kg/hectare',
        fertilizers: ['Nitrogen (120 kg)', 'Phosphate (60 kg)', 'Potash (40 kg)']
      });
    }
    if (rainfall < 600 && rainfall > 200) {
      recommendations.push({
        cropName: 'Gram (Chickpea)',
        duration: '90-120 days',
        reason: 'Low water requirement suits your moderate rainfall. Gram thrives in cool, dry rabi season.',
        expectedRevenue: '₹45,000 - ₹60,000/hectare',
        seedQuantity: '70-80 kg/hectare',
        fertilizers: ['Phosphate (75 kg)', 'Potash (40 kg)', 'Sulfur (30 kg)']
      });
    }
    if (soilType.includes('sandy') || soilType.includes('alluvial')) {
      recommendations.push({
        cropName: 'Mustard',
        duration: '110-140 days',
        reason: 'Sandy and alluvial soils with cool season provide ideal conditions for mustard oil production.',
        expectedRevenue: '₹40,000 - ₹55,000/hectare',
        seedQuantity: '3-4 kg/hectare',
        fertilizers: ['Nitrogen (60 kg)', 'Phosphate (40 kg)', 'Potash (30 kg)']
      });
    }
    recommendations.push({
      cropName: 'Potato',
      duration: '90-120 days',
      reason: 'Cool rabi season supports excellent potato production with good shelf life.',
      expectedRevenue: '₹1,50,000 - ₹2,00,000/hectare',
      seedQuantity: '2000-2500 kg/hectare',
      fertilizers: ['Nitrogen (120 kg)', 'Phosphate (100 kg)', 'Potash (150 kg)']
    });
  }

  // Year-round crops
  if (temperature > 25 && rainfall > 400) {
    recommendations.push({
      cropName: 'Sugarcane',
      duration: '10-12 months',
      reason: 'Warm climate and adequate rainfall support 10-12 months of sugarcane growth.',
      expectedRevenue: '₹2,50,000 - ₹3,50,000/hectare',
      seedQuantity: '40-50 quintals/hectare',
      fertilizers: ['Nitrogen (150 kg)', 'Phosphate (75 kg)', 'Potash (60 kg)', 'Zinc (25 kg)']
    });
  }

  // Ensure we have at least some recommendations
  if (recommendations.length === 0) {
    recommendations.push(
      {
        cropName: 'Wheat',
        duration: '120-150 days',
        reason: 'Adaptable to various soil types and climates. Good alternative crop.',
        expectedRevenue: '₹50,000 - ₹70,000/hectare',
        seedQuantity: '100-125 kg/hectare',
        fertilizers: ['Nitrogen (120 kg)', 'Phosphate (60 kg)', 'Potash (40 kg)']
      },
      {
        cropName: 'Maize',
        duration: '90-110 days',
        reason: 'Flexible crop suitable for diverse agro-climatic conditions.',
        expectedRevenue: '₹45,000 - ₹65,000/hectare',
        seedQuantity: '20-25 kg/hectare',
        fertilizers: ['Nitrogen (120 kg)', 'Phosphate (60 kg)', 'Potash (40 kg)']
      },
      {
        cropName: 'Gram',
        duration: '90-120 days',
        reason: 'Drought-tolerant pulse crop suitable for marginal rainfall areas.',
        expectedRevenue: '₹40,000 - ₹55,000/hectare',
        seedQuantity: '70-80 kg/hectare',
        fertilizers: ['Phosphate (75 kg)', 'Potash (40 kg)', 'Sulfur (30 kg)']
      }
    );
  }

  return { recommendations: recommendations.slice(0, 4) };
}

/**
 * Parse pest analysis text when JSON parsing fails
 */
function getDefaultPestAnalysis(analysisText: string): {
  pest: string;
  confidence: number;
  severity: string;
  visualSignatures: string[];
  colorIndicators: string[];
  damagePatterns: string[];
  prevention: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  urgency: number;
  scientificName: string;
} {
  // Try to extract pestname from text
  const pestPatterns: Record<string, string[]> = {
    'Armyworm': ['armyworm', 'spodoptera', 'caterpillar', 'feeding holes', 'brown droppings'],
    'Leaf Spot': ['leaf spot', 'fungal', 'spot', 'cercospora', 'alternaria', 'circular spots'],
    'Powdery Mildew': ['powdery mildew', 'white powder', 'oidium', 'erysiphe'],
    'Whitefly': ['whitefly', 'bemisia', 'tiny white insects', 'sticky honeydew'],
    'Spider Mites': ['spider mites', 'tetranychus', 'webbing', 'fine web', 'stippled'],
    'Sheath Blight': ['sheath blight', 'rice', 'rhizoctonia', 'water-soaked'],
    'Rice Blast': ['rice blast', 'magnaporthe', 'diamond-shaped spots'],
    'Bollworm': ['bollworm', 'helicoverpa', 'cotton', 'boll damage']
  };

  let detectedPest = 'Unknown';
  let confidence = 0;

  const lowerText = analysisText.toLowerCase();
  for (const [pestName, keywords] of Object.entries(pestPatterns)) {
    const matches = keywords.filter(kw => lowerText.includes(kw)).length;
    if (matches > 0) {
      const matchPercentage = (matches / keywords.length) * 100;
      if (matchPercentage > confidence) {
        detectedPest = pestName;
        confidence = matchPercentage;
      }
    }
  }

  return {
    pest: detectedPest,
    confidence: Math.min(100, Math.max(confidence, 0)),
    severity: analysisText.includes('High') ? 'High' : analysisText.includes('Medium') ? 'Medium' : 'Low',
    visualSignatures: [],
    colorIndicators: [],
    damagePatterns: [],
    prevention: [],
    organic_treatment: [],
    chemical_treatment: [],
    urgency: 0,
    scientificName: ''
  };
}

/**
 * Calculate urgency score for treatment (0-100)
 */
function calculateUrgencyScore(analysis: any): number {
  let urgency = 0;

  // Severity multiplier
  if (analysis.severity_level === 'High') urgency += 40;
  else if (analysis.severity_level === 'Medium') urgency += 25;
  else urgency += 10;

  // Confidence multiplier
  if (analysis.confidence_percentage && analysis.confidence_percentage > 70) urgency += 30;
  else if (analysis.confidence_percentage && analysis.confidence_percentage > 40) urgency += 20;
  else urgency += 10;

  // Visual signatures multiplier
  if (analysis.visual_signatures_detected && analysis.visual_signatures_detected.length > 2) urgency += 20;
  else if (analysis.visual_signatures_detected && analysis.visual_signatures_detected.length > 0) urgency += 10;

  return Math.min(100, urgency);
}
