import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { PROTOTYPE_SYSTEM } from "@/lib/prompts";
import type { SolutionProposal, WorkflowModel } from "@/lib/types";

// Sonnet 5 streams a first-cut prototype script for ANY described workflow —
// the generic taster beat, complementing the real worksheet hero run.
// Response is plain streamed text; the UI renders it as it arrives.

export const maxDuration = 120;

const MOCK_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;font-family:-apple-system,Segoe UI,sans-serif}
body{background:#f4f5f2;color:#25281f}
.banner{background:#fff7ed;border-bottom:1px solid #fdba74;padding:8px 16px;font-size:12px;color:#9a3412}
.wrap{display:flex;min-height:420px}
.side{width:220px;background:#eceee7;border-right:1px solid #d8dbd0;padding:16px}
.side h1{font-size:15px;margin-bottom:14px}
.step{padding:9px 10px;border-radius:6px;font-size:13px;color:#6b7062;margin-bottom:4px}
.step.on{background:#fff;color:#25281f;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.main{flex:1;padding:28px}
.main h2{font-size:18px;margin-bottom:6px}.main p{font-size:13px;color:#6b7062;margin-bottom:16px}
.card{background:#fff;border:1px solid #d8dbd0;border-radius:8px;padding:14px;margin-bottom:10px;font-size:13px}
button{background:#c2410c;color:#fff;border:0;border-radius:6px;padding:10px 18px;font-size:13px;cursor:pointer;margin-top:8px}
.ok{color:#15803d}.mono{font-family:monospace;font-size:12px}
</style></head><body>
<div class="banner">AI-generated pre-prototype from your Recce conversation — click through; we refine the real thing together.</div>
<div class="wrap"><div class="side"><h1>Worksheet Runner</h1>
<div class="step on" id="s1">1 · Pick this week's worksheet</div>
<div class="step" id="s2">2 · Check your students</div>
<div class="step" id="s3">3 · Run the round</div>
<div class="step" id="s4">4 · Links ready</div></div>
<div class="main">
<div id="p1"><h2>Pick this week's worksheet</h2><p>Choose the template — copies are made automatically for every student.</p>
<div class="card">📄 SAC3 MAF Chapter 3.pdf <span style="float:right;color:#6b7062">last used template</span></div>
<button onclick="go(2)">Use this worksheet →</button></div>
<div id="p2" hidden><h2>Check your students</h2><p>Pulled from your student list — edit anytime.</p>
<div class="card">✓ 100 students · 1-2 worksheets each · weekly</div>
<button onclick="go(3)">Looks right →</button></div>
<div id="p3" hidden><h2>Run the round</h2><p>Copies, shares and builds every Kami link — the whole Sunday job.</p>
<button onclick="go(4)">▶ Run it</button></div>
<div id="p4" hidden><h2 class="ok">✓ Done — in 14 seconds</h2><p>What used to take your Sunday afternoon:</p>
<div class="card mono">Aisha — worksheet.pdf → kami link ✓<br>Marcus — worksheet.pdf → kami link ✓<br>Wei Lin — worksheet.pdf → kami link ✓<br>…97 more ✓</div>
<div class="card">📋 Master doc updated with all 100 links</div></div>
</div></div>
<script>function go(n){for(let i=1;i<=4;i++){document.getElementById('p'+i).hidden=i!==n;document.getElementById('s'+i).className='step'+(i===n?' on':'')}}</script>
</body></html>`;

export async function POST(req: NextRequest) {
  const { model, proposal }: { model: WorkflowModel; proposal?: SolutionProposal } =
    await req.json();

  // Mock mode: stream the canned sample with a typewriter cadence.
  if (!process.env.ANTHROPIC_API_KEY) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of MOCK_HTML.match(/[\s\S]{1,48}/g) ?? []) {
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
