// Deterministic waste + quote math. Locked 2026-07-11 with Bryan:
// quote = [15%, 30%] x first-12-months savings, floored at S$500,
// silent sanity check vs build_hours x S$80/hr (dossier-only, never client-facing).
// All four knobs are consultant-configurable via env — this is a tool for HIS business.

import type { WorkflowModel } from "./types";

export const QUOTE_CONFIG = {
  fractionLow: Number(process.env.NEXT_PUBLIC_QUOTE_FRACTION_LOW ?? 0.15),
  fractionHigh: Number(process.env.NEXT_PUBLIC_QUOTE_FRACTION_HIGH ?? 0.3),
  floor: Number(process.env.NEXT_PUBLIC_QUOTE_FLOOR ?? 500),
  internalRatePerHour: Number(process.env.INTERNAL_RATE_PER_HOUR ?? 80), // server-side only
  horizonMonths: 12,
};

export interface WasteSummary {
  hoursPerMonth: number;
  costPerMonth: number;
  costPerYear: number;
  quoteLow: number;
  quoteHigh: number;
  netSavingsLow: number; // year-one savings after paying the HIGH end of the quote
  netSavingsHigh: number; // after paying the LOW end
}

export function computeWaste(model: WorkflowModel): WasteSummary {
  const hoursPerMonth = model.steps.reduce(
    (sum, s) => sum + (s.minutes_per_occurrence * s.frequency_per_month) / 60,
    0
  );
  const hourly = model.hourly_value_sgd || 0;
  const costPerMonth = hoursPerMonth * hourly;
  const costPerYear = costPerMonth * QUOTE_CONFIG.horizonMonths;

  const rawLow = QUOTE_CONFIG.fractionLow * costPerYear;
  const rawHigh = QUOTE_CONFIG.fractionHigh * costPerYear;
  const quoteLow = costPerYear > 0 ? Math.max(QUOTE_CONFIG.floor, rawLow) : 0;
  const quoteHigh = costPerYear > 0 ? Math.max(quoteLow, rawHigh) : 0;

  return {
    hoursPerMonth,
    costPerMonth,
    costPerYear,
    quoteLow,
    quoteHigh,
    netSavingsLow: costPerYear - quoteHigh,
    netSavingsHigh: costPerYear - quoteLow,
  };
}

// Consultant-side only: flags engagements where even the top of the quote range
// would not cover the build cost. Never shown to the client.
export function belowMinimumEngagement(quoteHigh: number, buildHoursEstimate: number): boolean {
  return quoteHigh > 0 && quoteHigh < buildHoursEstimate * QUOTE_CONFIG.internalRatePerHour;
}

export const fmtSGD = (n: number) => "S$" + Math.round(n).toLocaleString("en-SG");
