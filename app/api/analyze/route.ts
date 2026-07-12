import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ANALYSIS_SYSTEM } from "@/lib/prompts";
import { analyzeResponseSchema } from "@/lib/schemas";
import { mockAnalyze } from "@/lib/mock";
import { belowMinimumEngagement } from "@/lib/quote";
import type { AnalyzeResponse, WorkflowModel } from "@/lib/types";
import type { WasteSummary } from "@/lib/quote";

export const maxDuration = 180;

export async function POST(req: NextRequest) {
  const { model, waste }: { model: WorkflowModel; waste: WasteSummary } = await req.json();

  let analysis: AnalyzeResponse;

  if (!process.env.ANTHROPIC_API_KEY) {
    analysis = mockAnalyze(model);
  } else {
    try {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        system: [{ type: "text", text: ANALYSIS_SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [
          {
            role: "user",
            content:
              `WORKFLOW MODEL (captured from the client conversation):\n${JSON.stringify(model, null, 2)}\n\n` +
              `DETERMINISTIC NUMBERS (computed by the interface — reference, do not restate as your own totals):\n` +
              `hours/month wasted: ${waste.hoursPerMonth.toFixed(1)}, cost/year: S$${Math.round(waste.costPerYear)}, ` +
              `quote range: S$${Math.round(waste.quoteLow)}–S$${Math.round(waste.quoteHigh)}.\n\n` +
              `Produce the client brief, consultant dossier, and solution proposal.`,
          },
        ],
        output_config: {
          format: { type: "json_schema", schema: analyzeResponseSchema },
        },
      });

      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") throw new Error("no text block in response");
      analysis = JSON.parse(text.text);
    } catch (err) {
      console.error("analyze failed:", err);
      return NextResponse.json({ error: "Analysis failed — try again." }, { status: 502 });
    }
  }

  // Silent consultant-side sanity check — never rendered in the client view.
  const belowMinimum = belowMinimumEngagement(
    waste.quoteHigh,
    analysis.consultant_dossier.build_hours_estimate
  );

  return NextResponse.json({ ...analysis, below_minimum_engagement: belowMinimum });
}
