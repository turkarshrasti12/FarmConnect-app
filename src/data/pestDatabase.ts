/**
 * Comprehensive Pest and Disease Database for Indian Crops
 * Contains visual characteristics, severity indicators, and treatment recommendations
 */

export interface PestCharacteristics {
  visualSignatures: string[];
  colorIndicators: string[];
  damagePatterns: string[];
  affectedCrops: string[];
}

export interface Pest {
  id: string;
  name: string;
  scientificName: string;
  type: 'insect' | 'disease' | 'nematode' | 'weed';
  characteristics: PestCharacteristics;
  severity: 'Low' | 'Medium' | 'High';
  seasonality: string[];
  prevention: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  timing: string;
  yield_loss: string;
  affected_states: string[];
}

export const PEST_DATABASE: Record<string, Pest> = {
  armyworm: {
    id: 'armyworm',
    name: 'Armyworm',
    scientificName: 'Spodoptera litura or Mythimna separata',
    type: 'insect',
    characteristics: {
      visualSignatures: [
        'Brown/olive green caterpillars',
        'Visible caterpillar larvae on leaves',
        'Caterpillars in clusters or groups',
        'Live insects present on plant',
        'Moth-like adults with distinctive markings'
      ],
      colorIndicators: [
        'Brown droppings (frass) on leaf surface',
        'Orange/golden colored droppings',
        'Dark spots from caterpillar defecation',
        'Green leaf with brown speckles'
      ],
      damagePatterns: [
        'Ragged holes in leaves (irregular edges)',
        'Leaves skeletonized with veins remaining',
        'Complete leaf consumption from edges',
        'Feeding damage on both leaf surfaces',
        'Damage starts from leaf edges and moves inward',
        'Multiple feeding holes in same leaf'
      ],
      affectedCrops: ['Cotton', 'Maize', 'Wheat', 'Sugarcane', 'Rice', 'Pulses', 'Vegetables']
    },
    severity: 'High',
    seasonality: ['June-October', 'November-March'],
    prevention: [
      'Use resistant/tolerant varieties',
      'Early sowing to escape peak infestation',
      'Deep ploughing in summer',
      'Remove crop residues',
      'Maintain field hygiene',
      'Avoid monoculture'
    ],
    organic_treatment: [
      'Bacillus thuringiensis (Bt) spray 1% @ 1-2mL/L when infestation starts',
      'NSKE (Neem Seed Kernel Extract) 5% @ 50 mL/L',
      'Spinosad @ 0.008% (2.5 mL/10L water)',
      'Hand picking of affected leaves',
      'Light traps to attract and monitor adults',
      'Install pheromone traps'
    ],
    chemical_treatment: [
      'Flubendiamide 39.35% SC @ 0.5 mL/L',
      'Chlorantraniliprole 18.5% SC @ 0.4 mL/L',
      'Lambda-cyhalothrin 4.9% CS @ 1 mL/L (for early instar)',
      'Spinosad 45% SC @ 0.5 mL/L',
      'Profenofos 50% EC @ 2 mL/L'
    ],
    timing: 'Early morning (6-8 AM) or evening (4-6 PM) spray',
    yield_loss: '20-80% depending on crop stage and infestation level',
    affected_states: ['All states across India']
  },

  leaf_spot: {
    id: 'leaf_spot',
    name: 'Leaf Spot',
    scientificName: 'Alternaria, Cercospora, or Bipolaris sp.',
    type: 'disease',
    characteristics: {
      visualSignatures: [
        'Circular or oval spots on leaves',
        'Concentric rings visible on spots',
        'Spots start as small brown/black areas',
        'Fungal spores visible under magnification',
        'No visible insects or caterpillars'
      ],
      colorIndicators: [
        'Brown to black spots with yellow halos',
        'Spot centers may turn gray/white',
        'Dark brown ring-like patterns',
        'Spots do not have brown droppings'
      ],
      damagePatterns: [
        'Spots are round/oval with defined borders',
        'Spots limited to infected area (no chewing)',
        'Leaves yellow around infected spots',
        'Progression from lower to upper leaves',
        'Spots merge and cause leaf death'
      ],
      affectedCrops: ['Cotton', 'Wheat', 'Rice', 'Maize', 'Vegetables', 'Pulses']
    },
    severity: 'Medium',
    seasonality: ['June-October (monsoon)', 'October-March (post-monsoon)'],
    prevention: [
      'Use disease-resistant varieties',
      'Proper crop spacing for air circulation',
      'Avoid overhead irrigation',
      'Sanitation and removal of infected leaves',
      'Crop rotation (3 years minimum)',
      'Proper field drainage'
    ],
    organic_treatment: [
      'Sulfur powder dust @ 4-6 kg/acre in evening',
      'Bordeaux mixture 1% @ 3.5 kg/500L water',
      'Copper fungicide @ 2.5g/L',
      'Milk spray (1:9 ratio)',
      'Remove infected leaves manually'
    ],
    chemical_treatment: [
      'Mancozeb 75% WP @ 2.5g/L spray every 10-14 days',
      'Propiconazole 25% EC @ 1 mL/L',
      'Azoxystrobin 23% SC @ 0.5 mL/L',
      'Carbendazim 50% WP @ 1g/L',
      'Chlorothalonil 75% WP @ 2g/L'
    ],
    timing: 'Spray in early morning when humidity is high',
    yield_loss: '10-50% depending on crop and severity',
    affected_states: ['All states, especially high rainfall areas']
  },

  powdery_mildew: {
    id: 'powdery_mildew',
    name: 'Powdery Mildew',
    scientificName: 'Erysiphe cichoracearum or Oidium species',
    type: 'disease',
    characteristics: {
      visualSignatures: [
        'White powder-like coating on leaves',
        'Uniform white film covering leaf surface',
        'Easily wiped off white coating',
        'Visible on both leaf surfaces'
      ],
      colorIndicators: [
        'White/grayish powder coating',
        'No yellow or dark spots',
        'Leaves may turn pale/yellow underneath'
      ],
      damagePatterns: [
        'Starts on lower leaves',
        'Spreads upward to cover entire plant',
        'Leaves curl and distort',
        'Affects stems and buds',
        'Powdery appearance is distinctive'
      ],
      affectedCrops: ['Grapes', 'Cucurbits', 'Legumes', 'Vegetables']
    },
    severity: 'Medium',
    seasonality: ['September-February in plains', 'Year-round in hills'],
    prevention: [
      'Good air circulation through proper pruning',
      'Avoid high nitrogen fertilizer',
      'Use resistant varieties',
      'Morning irrigation (avoid foliage)',
      'Reduce humidity'
    ],
    organic_treatment: [
      'Sulfur dust or spray @ 2.5% or 3-4 kg/acre',
      'Potassium bicarbonate 0.5%',
      'Neem oil 3% spray',
      'Remove affected leaves'
    ],
    chemical_treatment: [
      'Propiconazole 25% EC @ 1 mL/L',
      'Sulfur 80% WP @ 2.5g/L',
      'Tridemorph 90% EC @ 2.5 mL/L',
      'Benomyl 50% WP @ 1g/L'
    ],
    timing: 'Early morning or evening spray',
    yield_loss: '20-40% in severe cases',
    affected_states: ['Himachal Pradesh', 'Uttarakhand', 'Karnataka', 'Maharashtra']
  },

  spider_mites: {
    id: 'spider_mites',
    name: 'Spider Mites',
    scientificName: 'Tetranychus urticae',
    type: 'insect',
    characteristics: {
      visualSignatures: [
        'Fine webbing on leaves and stems',
        'Tiny reddish/brown moving dots',
        'Web visible under bright light',
        'Microscopic pests (barely visible to naked eye)'
      ],
      colorIndicators: [
        'Yellowish/pale leaf discoloration',
        'Bronze or rusty appearance to leaves',
        'Leaves become pale then brown',
        'Webbing appears silvery when wet'
      ],
      damagePatterns: [
        'Fine webbing connects leaves',
        'Stippled/speckled leaves',
        'Leaves wilt and drop prematurely',
        'Gradual yellowing of foliage'
      ],
      affectedCrops: ['Cotton', 'Vegetables', 'Fruits', 'Ornamentals']
    },
    severity: 'Medium',
    seasonality: ['Hot and dry months (April-June, September-November)'],
    prevention: [
      'Regular overhead watering to increase humidity',
      'Proper spacing for air circulation',
      'Remove weeds and alternate hosts',
      'Avoid excessive nitrogen'
    ],
    organic_treatment: [
      'Water spray to remove mites',
      'Sulfur dust or spray',
      'Neem oil 3% @ 3-5 mL/L',
      'Insecticidal soap @ 2%'
    ],
    chemical_treatment: [
      'Dicofol 18.5% EC @ 2-2.5 mL/L',
      'Propargite 57% EC @ 2.5 mL/L',
      'Fenpyroximate 5% EC',
      'Spiromesifen 22.9% SC @ 1.5 mL/L'
    ],
    timing: 'Early morning or late evening (affects mite activity)',
    yield_loss: '10-30% if untreated',
    affected_states: ['Gujarat', 'Tamil Nadu', 'Andhra Pradesh', 'Maharashtra']
  },

  sheath_blight: {
    id: 'sheath_blight',
    name: 'Sheath Blight (Rice)',
    scientificName: 'Rhizoctonia solani',
    type: 'disease',
    characteristics: {
      visualSignatures: [
        'Water-soaked lesions on leaf sheath',
        'Gray/white lesions with dark borders',
        'Lesions on lower leaf sheaths initially',
        'No yellow halo around spots'
      ],
      colorIndicators: [
        'Gray-green initial lesions',
        'Center becomes soft and white',
        'Surrounded by red-brown borders',
        'Sclerotia (small black spheres) visible'
      ],
      damagePatterns: [
        'Starts at water line level',
        'Spreads upward as disease progresses',
        'Causes panicle death when reaches flag leaf',
        'Entire panicle becomes covered with fungus'
      ],
      affectedCrops: ['Rice']
    },
    severity: 'High',
    seasonality: ['July-September (peak monsoon)', 'Heading and flowering stage'],
    prevention: [
      'Proper water management (avoid standing water)',
      'Reduce nitrogen fertilizer',
      'Use resistant varieties',
      'Field sanitation - remove sclerotia',
      'Do not overdose on nitrogen'
    ],
    organic_treatment: [
      'Trichoderma viride 2% @ 2.5 kg/400L water',
      'Pseudomonas fluorescens',
      'Bacillus subtilis',
      'Neem oil spray'
    ],
    chemical_treatment: [
      'Hexaconazole 5% SC @ 2.5 mL/L',
      'Propiconazole 25% EC @ 1 mL/L',
      'Tebuconazole 50% + Trifloxystrobin 25% @ 0.75 mL/L',
      'Carbendazim 50% WP @ 1-1.5g/L'
    ],
    timing: 'Critical at boot stage and head emergence',
    yield_loss: '30-60% grain loss in severe infection',
    affected_states: ['Punjab', 'Haryana', 'Uttar Pradesh', 'West Bengal', 'Odisha']
  },

  whitefly: {
    id: 'whitefly',
    name: 'Whitefly',
    scientificName: 'Bemisia tabaci',
    type: 'insect',
    characteristics: {
      visualSignatures: [
        'Tiny white flying insects on leaf undersides',
        'Clouds of white insects when plant is shaken',
        'Eggs laid on leaf undersides',
        'Elongated white insects (2-3 mm size)'
      ],
      colorIndicators: [
        'Bright white coloration on insects',
        'Yellow mottling on leaves',
        'Sooty mold (black fungus) on leaves',
        'Leaf yellowing due to toxins'
      ],
      damagePatterns: [
        'Yellowing and wilting of leaves',
        'Sticky honeydew deposits',
        'Sooty black mold on foliage',
        'Stunted plant growth',
        'Leaf curling and distortion'
      ],
      affectedCrops: ['Cotton', 'Vegetables', 'Tobacco', 'Cucurbits']
    },
    severity: 'High',
    seasonality: ['April-November', 'Peak in summer'],
    prevention: [
      'Use yellow sticky traps',
      'Avoid excessive nitrogen',
      'Proper spacing and light penetration',
      'Remove alternate hosts and weeds',
      'Early sowing'
    ],
    organic_treatment: [
      'Yellow sticky traps (1 per 100 sq m)',
      'Neem oil 3% @ 5-7 mL/L',
      'Insecticidal soap @ 2%',
      'Spinosad @ 0.25 mL/L'
    ],
    chemical_treatment: [
      'Imidacloprid 17.8% SL @ 0.3 mL/L',
      'Acetamiprid 20% SP @ 0.4g/L',
      'Thiamethoxam 25% WG @ 0.3g/L',
      'Pyrethroid-based sprays'
    ],
    timing: 'Early morning spray (insects less active)',
    yield_loss: '20-50% virus transmission and sap sucking',
    affected_states: ['Gujarat', 'Maharashtra', 'Rajasthan', 'Tamil Nadu']
  },

  bollworm: {
    id: 'bollworm',
    name: 'Cotton Bollworm',
    scientificName: 'Helicoverpa armigera',
    type: 'insect',
    characteristics: {
      visualSignatures: [
        'Brown/green caterpillars with spines',
        'Visible caterpillar on flowers/bolls',
        'Bore holes in bolls/buds',
        '10-50 mm long caterpillars'
      ],
      colorIndicators: [
        'Brown, green, or reddish caterpillars',
        'Dark colored damage holes',
        'Pink/damaged buds and flowers'
      ],
      damagePatterns: [
        'Bore holes in flowering buds',
        'Damage to cotton bolls with hole entry',
        'Shedding of flowers and buds',
        'Bolls become unmarketable'
      ],
      affectedCrops: ['Cotton', 'Chickpea', 'Pigeonpea', 'Tomato']
    },
    severity: 'High',
    seasonality: ['September-November (peak in cotton)'],
    prevention: [
      'Early picking of infested buds/bolls',
      'Avoid night irrigation',
      'Host plant destruction post-harvest',
      'Light traps in fields'
    ],
    organic_treatment: [
      'Bacillus thuringiensis (Bt) spray @ 1 mL/L',
      'NSKE 5% @ 50 mL/L',
      'Spinosad @ 0.25 mL/L',
      'Hand picking of infested buds'
    ],
    chemical_treatment: [
      'Flubendiamide 39.35% SC @ 0.5 mL/L',
      'Chlorantraniliprole 18.5% SC @ 0.4 mL/L',
      'Emamectin benzoate 5% SG @ 0.4g/L',
      'Spinosad 45% SC @ 0.5 mL/L'
    ],
    timing: 'Early morning spray (before 8 AM)',
    yield_loss: '20-80% in severe infestation',
    affected_states: ['All major cotton growing states']
  },

  blast: {
    id: 'blast',
    name: 'Rice Blast',
    scientificName: 'Magnaporthe oryzae',
    type: 'disease',
    characteristics: {
      visualSignatures: [
        'Diamond-shaped or spindle-shaped spots',
        'Spots on leaves with dark borders',
        'Gray lesion center with brown/red border',
        'Fungal spores visible in severe cases'
      ],
      colorIndicators: [
        'Gray center with reddish-brown margin',
        'Silvery spore-bearing surface',
        'No yellow halo'
      ],
      damagePatterns: [
        'Spots on leaves, stems, and panicles',
        'Neck blast causes panicle death',
        'Sterile spikelets develop',
        'Entire panicle may become black'
      ],
      affectedCrops: ['Rice']
    },
    severity: 'High',
    seasonality: ['June-August (high humidity)', 'Cool nights + high humidity'],
    prevention: [
      'Use blast-resistant varieties',
      'Avoid excessive nitrogen',
      'Proper spacing for ventilation',
      'Drain stagnant water',
      'Remove volunteer rice plants'
    ],
    organic_treatment: [
      'Tricyclazole 75% WP (preventive only)',
      'Trichoderma harzianum',
      'Remove infected panicles'
    ],
    chemical_treatment: [
      'Tricyclazole 75% WP @ 1g/L (2-3 sprays)',
      'Propiconazole 25% EC @ 1 mL/L',
      'Azoxystrobin 23% SC @ 0.5 mL/L',
      'Hexaconazole 5% SC @ 2.5 mL/L'
    ],
    timing: 'Preventive spray at boot stage and heading',
    yield_loss: '50-100% in severe cases',
    affected_states: ['Bihar', 'Odisha', 'West Bengal', 'Assam', 'Himachal Pradesh']
  }
};

/**
 * Match pest based on visual characteristics
 */
export function matchPestByCharacteristics(
  visualSignatures: string[],
  colorIndicators: string[],
  damagePatterns: string[]
): Array<{ pest: Pest; matchScore: number }> {
  const results: Array<{ pest: Pest; matchScore: number }> = [];

  Object.values(PEST_DATABASE).forEach((pest) => {
    let matchScore = 0;

    // Count visual signature matches
    const visualMatches = visualSignatures.filter(sig =>
      pest.characteristics.visualSignatures.some(ps =>
        ps.toLowerCase().includes(sig.toLowerCase()) ||
        sig.toLowerCase().includes(ps.toLowerCase())
      )
    ).length;

    // Count color indicator matches
    const colorMatches = colorIndicators.filter(color =>
      pest.characteristics.colorIndicators.some(pc =>
        pc.toLowerCase().includes(color.toLowerCase()) ||
        color.toLowerCase().includes(pc.toLowerCase())
      )
    ).length;

    // Count damage pattern matches
    const damageMatches = damagePatterns.filter(pattern =>
      pest.characteristics.damagePatterns.some(pd =>
        pd.toLowerCase().includes(pattern.toLowerCase()) ||
        pattern.toLowerCase().includes(pd.toLowerCase())
      )
    ).length;

    // Calculate match score (0-100)
    const totalPossible =
      pest.characteristics.visualSignatures.length +
      pest.characteristics.colorIndicators.length +
      pest.characteristics.damagePatterns.length;

    matchScore = ((visualMatches + colorMatches + damageMatches) / totalPossible) * 100;

    if (matchScore > 20) {
      results.push({ pest, matchScore });
    }
  });

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get pest recommendations based on crop and season
 */
export function getPestRecommendationsBySeason(
  crop: string,
  season: string
): Pest[] {
  return Object.values(PEST_DATABASE).filter(
    (pest) =>
      pest.characteristics.affectedCrops.some(c => c.toLowerCase() === crop.toLowerCase()) &&
      pest.seasonality.some(s => s.toLowerCase().includes(season.toLowerCase()))
  );
}

/**
 * Calculate treatment urgency (0-100)
 */
export function calculateTreatmentUrgency(severity: string, matchScore: number): number {
  const severityMultiplier =
    severity === 'High' ? 1.0 : severity === 'Medium' ? 0.7 : 0.4;
  return Math.min(100, matchScore * severityMultiplier);
}
