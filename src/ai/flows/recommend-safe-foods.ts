'use server';

/**
 * @fileOverview This file defines a Genkit flow for recommending safe foods based on a user's allergy profile and dietary preferences.
 *
 * - recommendSafeFoods - A function that recommends safe foods for a user.
 * - RecommendSafeFoodsInput - The input type for the recommendSafeFoods function.
 * - RecommendSafeFoodsOutput - The return type for the recommendSafeFoods function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendSafeFoodsInputSchema = z.object({
  allergyProfile: z.object({
    allergens: z.array(z.string()).describe('List of allergens the user is allergic to.'),
    dietaryPreferences: z.string().optional().describe('Dietary preferences of the user (e.g., vegetarian, vegan).'),
  }).describe('The user allergy profile and dietary preferences.'),
  nutritionGoals: z.string().optional().describe('The nutritional goals of the user.'),
  foodDatabase: z.array(z.object({
    name: z.string().describe('Name of the food.'),
    ingredients: z.array(z.string()).describe('List of ingredients in the food.'),
    nutritionalData: z.string().optional().describe('Nutritional information of the food.'),
    region: z.string().optional().describe('Region of origin of the food.'),
  })).describe('A database of food items with their ingredients and nutritional information.'),
});

export type RecommendSafeFoodsInput = z.infer<typeof RecommendSafeFoodsInputSchema>;

const RecommendSafeFoodsOutputSchema = z.object({
  safeFoods: z.array(z.string()).describe('List of recommended safe foods based on the user profile.'),
  reasoning: z.string().describe('Explanation of why these foods are recommended.'),
});

export type RecommendSafeFoodsOutput = z.infer<typeof RecommendSafeFoodsOutputSchema>;

export async function recommendSafeFoods(input: RecommendSafeFoodsInput): Promise<RecommendSafeFoodsOutput> {
  return recommendSafeFoodsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendSafeFoodsPrompt',
  input: {schema: RecommendSafeFoodsInputSchema},
  output: {schema: RecommendSafeFoodsOutputSchema},
  prompt: `You are an AI food recommendation expert. Given a user's allergy profile, dietary preferences, nutrition goals, and a database of foods, you will recommend a list of safe foods for the user and explain your reasoning.

User Allergy Profile:
Allergens: {{allergyProfile.allergens}}
Dietary Preferences: {{allergyProfile.dietaryPreferences}}
Nutrition Goals: {{nutritionGoals}}

Food Database:
{{#each foodDatabase}}
- Name: {{this.name}}
  Ingredients: {{this.ingredients}}
  Nutritional Data: {{this.nutritionalData}}
  Region: {{this.region}}
{{/each}}

Based on this information, recommend safe foods for the user, and explain your reasoning.
Consider dietary preferences and nutrition goals when making your recommendation.

Output in the following format:
{
  "safeFoods": ["Food1", "Food2"],
  "reasoning": "Explanation of why these foods are recommended."
}
`,
});

const recommendSafeFoodsFlow = ai.defineFlow(
  {
    name: 'recommendSafeFoodsFlow',
    inputSchema: RecommendSafeFoodsInputSchema,
    outputSchema: RecommendSafeFoodsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
