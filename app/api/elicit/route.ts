import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { ELICITATION_SYSTEM } from "@/lib/prompts";
import { elicitResponseSchema } from "@/lib/schemas";
import { mockElicit } from "@/lib/mock";
import type { ChatMessage, ElicitResponse, WorkflowModel } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { messages, model }: { messages: ChatMessage[]; model?: WorkflowModel } =
    await req.json();

  // No key yet → mock mode keeps the whole happy path demoable.
  if (!process.env.ANTHROPIC_API_KEY) {
    const turn = messages.filter((m) => m.role === "user").length - 1;
    return NextResponse.json({ ...mockElicit(Math.max(0, turn)), mock: true });
  }

  try {
    // Inject current model state (with any client edits) into the latest user
    // turn so the agent updates incrementally instead of rebuilding from prose.
    const apiMessages = messages.map((m, i) => {
      const isLast = i === messages.length - 1;
      if (!isLast || m.role !== "user" || !model || model.steps.length === 0) return m;
      return {
        role: "user" as const,
        content:
          `[CURRENT WORKFLOW MODEL — includes the client's own corrections to numbers; ` +
          `UPDATE this model with the new information below, never discard client edits]\n` +
          `${JSON.stringify(model)}\n\n[CLIENT SAYS]\n${m.content}`,
      };
    });

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: ELICITATION_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: apiMessages,
      output_config: {
        format: { type: "json_schema", schema: elicitResponseSchema },
      },
    });

    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") throw new Error("no text block in response");
    const parsed: ElicitResponse = JSON.parse(text.text);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("elicit failed:", err);
    return NextResponse.json(
      { error: "The agent hit a snag — say that again or rephrase?" },
      { status: 502 }
    );
  }
}
