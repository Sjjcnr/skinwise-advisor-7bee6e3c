export interface SkinAssessment {
  ageRange: string;
  gender: string;
  skinType: string;
  skinConcerns: string[];
  climate: string;
  allergies: string[];
  skinGoals: string;
  budgetRange: string;
}

export interface Product {
  name: string;
  brand: string;
  description: string;
  keyIngredients: string[];
  skinTypeSuitability: string[];
  priceRange: string;
  productUrl?: string;
  imageUrl?: string;
  whySuitable: string;
  usageInstructions?: string;
  safetyWarnings?: string;
}

export interface Recommendation {
  id: string;
  assessmentId: string;
  products: Product[];
  aiSummary: string;
  createdAt: string;
}

export const SKIN_TYPES = [
  { value: 'oily', label: 'Oily', description: 'Shiny, enlarged pores, prone to acne' },
  { value: 'dry', label: 'Dry', description: 'Tight, flaky, rough texture' },
  { value: 'combination', label: 'Combination', description: 'Oily T-zone, dry cheeks' },
  { value: 'sensitive', label: 'Sensitive', description: 'Easily irritated, reactive' },
  { value: 'normal', label: 'Normal', description: 'Balanced, few imperfections' },
] as const;

export const SKIN_CONCERNS = [
  { value: 'acne', label: 'Acne & Breakouts' },
  { value: 'pigmentation', label: 'Pigmentation & Dark Spots' },
  { value: 'dryness', label: 'Dryness & Dehydration' },
  { value: 'aging', label: 'Fine Lines & Wrinkles' },
  { value: 'redness', label: 'Redness & Rosacea' },
  { value: 'dullness', label: 'Dullness & Uneven Tone' },
  { value: 'pores', label: 'Large Pores' },
  { value: 'oiliness', label: 'Excess Oil' },
  { value: 'texture', label: 'Rough Texture' },
  { value: 'darkCircles', label: 'Dark Circles' },
] as const;

export const AGE_RANGES = [
  { value: 'under18', label: 'Under 18' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' },
] as const;

export const CLIMATES = [
  { value: 'tropical', label: 'Tropical (Hot & Humid)' },
  { value: 'dry', label: 'Dry / Arid' },
  { value: 'temperate', label: 'Temperate' },
  { value: 'cold', label: 'Cold / Winter' },
  { value: 'varied', label: 'Varied / Seasonal' },
] as const;

export const BUDGET_RANGES = [
  { value: 'budget', label: 'Budget-Friendly ($)' },
  { value: 'mid', label: 'Mid-Range ($$)' },
  { value: 'premium', label: 'Premium ($$$)' },
  { value: 'luxury', label: 'Luxury ($$$$)' },
] as const;

export const COMMON_ALLERGIES = [
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'parabens', label: 'Parabens' },
  { value: 'sulfates', label: 'Sulfates' },
  { value: 'alcohol', label: 'Alcohol' },
  { value: 'retinol', label: 'Retinol' },
  { value: 'vitaminC', label: 'Vitamin C' },
  { value: 'salicylicAcid', label: 'Salicylic Acid' },
  { value: 'niacinamide', label: 'Niacinamide' },
] as const;
