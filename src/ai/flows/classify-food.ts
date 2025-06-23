'use server';

/**
 * @fileOverview An AI agent that classifies food items from an image and suggests alternative interpretations if the classification fails or has low confidence.
 *
 * - classifyFood - A function that handles the food classification process.
 * - ClassifyFoodInput - The input type for the classifyFood function.
 * - ClassifyFoodOutput - The return type for the classifyFood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyFoodInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ClassifyFoodInput = z.infer<typeof ClassifyFoodInputSchema>;

const ClassifyFoodOutputSchema = z.object({
  classification: z.string().describe('The identified food item.'),
  confidence: z.number().describe('The confidence level of the classification (0-1).'),
  alternativeSuggestions: z.array(z.string()).describe('Alternative food item suggestions if the classification is uncertain.'),
});
export type ClassifyFoodOutput = z.infer<typeof ClassifyFoodOutputSchema>;

export async function classifyFood(input: ClassifyFoodInput): Promise<ClassifyFoodOutput> {
  return classifyFoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyFoodPrompt',
  input: {schema: ClassifyFoodInputSchema},
  output: {schema: ClassifyFoodOutputSchema},
  prompt: `You are an expert food classifier. You will identify the food item in the image and provide a confidence level (0-1) for your classification.

  If the confidence level is below 0.7, suggest up to three alternative food item interpretations.

  Photo: {{media url=photoDataUri}}
  `,
});

const classifyFoodFlow = ai.defineFlow(
  {
    name: 'classifyFoodFlow',
    inputSchema: ClassifyFoodInputSchema,
    outputSchema: ClassifyFoodOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
