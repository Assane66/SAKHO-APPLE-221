// src/ai/flows/estimate-trade-in-value.ts
'use server';
/**
 * @fileOverview An AI agent for estimating iPhone trade-in values.
 *
 * - estimateTradeInValue - A function that handles the trade-in value estimation process.
 * - EstimateTradeInValueInput - The input type for the estimateTradeInValue function.
 * - EstimateTradeInValueOutput - The return type for the estimateTradeInValue function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EstimateTradeInValueInputSchema = z.object({
  currentModel: z.string().describe('The model of the iPhone to be traded in.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of the iPhone to be traded in, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  desiredModel: z.string().describe('The model of the desired iPhone.'),
  contactPhone: z.string().describe('The contact phone number of the customer.'),
});
export type EstimateTradeInValueInput = z.infer<typeof EstimateTradeInValueInputSchema>;

const EstimateTradeInValueOutputSchema = z.object({
  estimatedValue: z.string().describe('The estimated trade-in value of the iPhone.'),
});
export type EstimateTradeInValueOutput = z.infer<typeof EstimateTradeInValueOutputSchema>;

export async function estimateTradeInValue(input: EstimateTradeInValueInput): Promise<EstimateTradeInValueOutput> {
  return estimateTradeInValueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'estimateTradeInValuePrompt',
  input: {schema: EstimateTradeInValueInputSchema},
  output: {schema: EstimateTradeInValueOutputSchema},
  prompt: `You are an expert in estimating the trade-in value of iPhones.

You will use the information provided to estimate the trade-in value of the customer's current iPhone, taking into account its model, condition (as indicated by the photo), and the desired iPhone model.

Current iPhone Model: {{{currentModel}}}
Photo: {{media url=photoDataUri}}
Desired iPhone Model: {{{desiredModel}}}
Contact Phone: {{{contactPhone}}}

Provide a concise estimate of the trade-in value.
`,
});

const estimateTradeInValueFlow = ai.defineFlow(
  {
    name: 'estimateTradeInValueFlow',
    inputSchema: EstimateTradeInValueInputSchema,
    outputSchema: EstimateTradeInValueOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
