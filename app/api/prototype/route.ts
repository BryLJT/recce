import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { PROTOTYPE_SYSTEM } from "@/lib/prompts";
import { HERO_PROTOTYPE_HTML } from "@/lib/hero-prototype";
import type { SolutionProposal, WorkflowModel } from "@/lib/types";

// Sonnet 5 streams a first-cut interactive prototype for ANY described workflow —
// the generic taster beat that judges can trial on their own work.
// Response is plain streamed text; the UI renders it into a sandboxed iframe as it arrives.
//
// For the SCRIPTED demo (demo:true) — and as the no-key fallback — we serve a
// hand-authored, bulletproof interactive prototype instead of a live generation,
// so the centerpiece beat is reliable on stage rather than a coin-flip.

export const maxDuration = 120;

// Stream a fixed HTML string with a typewriter cadence (so it still reads as "building").
function streamCanned(html: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of html.match(/[\s\S]{1,64}/g) ?? []) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  const { model, proposal, demo }: { model: WorkflowModel; proposal?: SolutionProposal; demo?: boolean } =
    await req.json();

  // Scripted demo, or no API key: serve the hand-authored hero prototype (reliable).
  if (demo || !process.env.ANTHROPIC_API_KEY) {
    return streamCanned(HERO_PROTOTYPE_HTML);
  }

  const client = new Anthropic();
  const claudeStream = client.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 8000,
    system: [{ type: "text", text: PROTOTYPE_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content:
          `WORKFLOW MODEL:\n${JSON.stringify(model, null, 2)}\n\n` +
          (proposal ? `RECOMMENDED APPROACH:\n${JSON.stringify(proposal, null, 2)}\n\n` : "") +
          `Generate the pre-prototype.`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of claudeStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error("prototype stream failed:", err);
        controller.enqueue(encoder.encode("\n\n[generation interrupted — try again]"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
