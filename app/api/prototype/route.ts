import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { PROTOTYPE_SYSTEM } from "@/lib/prompts";
import type { SolutionProposal, WorkflowModel } from "@/lib/types";

// Sonnet 5 streams a first-cut prototype script for ANY described workflow —
// the generic taster beat, complementing the real worksheet hero run.
// Response is plain streamed text; the UI renders it as it arrives.

export const maxDuration = 120;

const MOCK_CODE = `\`\`\`javascript
// AI-GENERATED PRE-PROTOTYPE — first cut from your Recce conversation.
// The consultant will refine exactly what you need.

// ── config the consultant fills in with you ─────────────────
const TEMPLATE_FILE_ID = "PASTE_TEMPLATE_ID";   // your worksheet template
const STUDENT_SHEET_ID = "PASTE_SHEET_ID";      // list of student names + emails
const MASTER_DOC_ID    = "PASTE_DOC_ID";        // where the links collect

// runs entirely inside your Google account — no new tools to learn
function runWeeklyWorksheetRound() {
  const students = SpreadsheetApp.openById(STUDENT_SHEET_ID)
    .getSheets()[0].getDataRange().getValues().slice(1);

  const links = [];
  for (const [name, email] of students) {
    // makes one copy of the worksheet for every student on the list
    const copy = DriveApp.getFileById(TEMPLATE_FILE_ID)
      .makeCopy(name + " — worksheet");
    // shares it so the student can open it in Kami
    copy.addEditor(email);
    // builds the Kami link automatically — no more clicking Open-with
    links.push(name + ": https://web.kamihq.com/web/viewer.html?state=" +
      encodeURIComponent(JSON.stringify({ ids: [copy.getId()], action: "open" })));
  }

  // writes every link into your master doc in one go
  DocumentApp.openById(MASTER_DOC_ID).getBody()
    .appendParagraph("Worksheet round — " + new Date().toDateString())
    .appendParagraph(links.join("\\n"));
}
\`\`\`

What this does: your whole weekly copying/sharing/link-collecting round becomes one button. It deliberately leaves out reminders and marking — those are for the consultant call, where we decide the final shape together.`;

export async function POST(req: NextRequest) {
  const { model, proposal }: { model: WorkflowModel; proposal?: SolutionProposal } =
    await req.json();

  // Mock mode: stream the canned sample with a typewriter cadence.
  if (!process.env.ANTHROPIC_API_KEY) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of MOCK_CODE.match(/[\s\S]{1,24}/g) ?? []) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
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
