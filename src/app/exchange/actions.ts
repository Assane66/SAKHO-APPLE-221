'use server';

import { estimateTradeInValue, EstimateTradeInValueInput, EstimateTradeInValueOutput } from '@/ai/flows/estimate-trade-in-value';

interface ActionResult {
    success: boolean;
    data?: EstimateTradeInValueOutput;
    error?: string;
}

export async function getTradeInEstimate(input: EstimateTradeInValueInput): Promise<ActionResult> {
  try {
    const result = await estimateTradeInValue(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting trade-in estimate:', error);
    // In a real app, you might want to log this error to a monitoring service.
    return { success: false, error: 'An unexpected error occurred while estimating the trade-in value.' };
  }
}
