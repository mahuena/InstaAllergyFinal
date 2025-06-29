export const COMMON_ALLERGENS = [
  "Peanuts",
  "Tree Nuts",
  "Milk (Dairy)",
  "Eggs",
  "Wheat (Gluten)",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
  "Corn",
  "Snails",
  "Agushi (Melon Seeds)",
];

export type FoodItem = {
  name: string;
  ingredients: string[];
  nutritionalData?: string;
  region?: string;
  history?: string;
  image: string;
  dataAiHint: string;
};

// Mock database of foods
export const FOOD_DATABASE: FoodItem[] = [
  {
    name: "Banku",
    ingredients: ["Corn dough", "Cassava dough", "Salt", "Water"],
    nutritionalData: "Rich in carbohydrates. Contains some fiber.",
    region: "Ghanaian",
    history: "A staple fermented meal from Ghana, popular among Ewe, Fante and Ga-Adangbe people.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "ghanaian food",
  },
  {
    name: "Caesar Salad",
    ingredients: ["Romaine lettuce", "Croutons (contains wheat)", "Parmesan cheese (contains milk)", "Lemon juice", "Olive oil", "Eggs", "Garlic", "Black pepper", "Worcestershire sauce (contains fish)"],
    nutritionalData: "Good source of vitamins A and K. Can be high in fat and sodium depending on dressing.",
    region: "International",
    history: "Invented in Tijuana, Mexico, by restaurateur Caesar Cardini in the 1920s.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "caesar salad",
  },
  {
    name: "Fufu",
    ingredients: ["Cassava", "Plantain", "Water"],
    nutritionalData: "High in carbohydrates, low in protein and fat.",
    region: "Ghanaian",
    history: "A staple food throughout West and Central Africa. The preparation varies by region.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "fufu soup",
  },
  {
    name: "Margherita Pizza",
    ingredients: ["Pizza dough (Wheat flour)", "Tomato sauce", "Mozzarella cheese (Milk)", "Fresh basil", "Olive oil"],
    nutritionalData: "Contains carbohydrates, protein, and fat. Source of calcium from cheese.",
    region: "Italian",
    history: "Famously created in Naples in honor of Queen Margherita of Savoy in 1889.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "margherita pizza",
  },
  {
    name: "Pad Thai",
    ingredients: ["Rice noodles", "Shrimp (shellfish)", "Tofu (soy)", "Bean sprouts", "Peanuts", "Scrambled egg", "Fish sauce", "Tamarind paste", "Chili pepper", "Lime"],
    nutritionalData: "Balanced meal with carbs, protein, and fats. Can be high in sodium.",
    region: "Thai",
    history: "Became popular in Thailand during World War II as a part of a campaign to promote Thai nationalism.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "pad thai",
  },
  {
    name: "Jollof Rice",
    ingredients: ["Rice", "Tomatoes", "Onions", "Peppers", "Vegetable oil", "Spices (thyme, curry powder)", "Chicken or Beef stock"],
    nutritionalData: "Rich in carbohydrates. Can contain vitamins from vegetables.",
    region: "West African",
    history: "A popular one-pot dish in many West African countries, with origins traced to the Senegambian region.",
    image: "https://placehold.co/600x400.png",
    dataAiHint: "jollof rice",
  },
];

export const getFoodByName = (name: string): FoodItem | undefined => {
    return FOOD_DATABASE.find(food => food.name.toLowerCase() === name.toLowerCase());
}
