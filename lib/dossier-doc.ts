// Renders the consultant dossier as a self-contained, full-page "EYES ONLY" HTML
// report that opens in its own browser tab. Built deterministically from the
// structured analysis data (no LLM call) so it is reliable and fully controlled.
// Inline CSS only, system fonts — renders offline from a blob: URL.

import type { AnalyzeResponse, WorkflowModel } from "./types";
import type { computeWaste } from "./quote";

type Waste = ReturnType<typeof computeWaste>;

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

const sgd = (n: number) => "S$" + Math.round(n).toLocaleString("en-SG");

const feasClass = (f: string) =>
  f === "easy" ? "ok" : f === "moderate" ? "mid" : "hard";

export function renderDossierDoc(
  model: WorkflowModel,
  waste: Waste,
  analysis: AnalyzeResponse & { below_minimum_engagement: boolean },
): string {
  const d = analysis.consultant_dossier;
  const p = analysis.solution_proposal;
  const stamp = new Date().toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" });

  const feasibility = d.feasibility
    .map(
      (f) => `<tr>
        <td class="mono soft">${esc(f.step_id)}</td>
        <td><span class="badge ${feasClass(f.feasibility)}">${esc(f.feasibility)}</span></td>
        <td>${esc(f.method)}</td>
      </tr>`,
    )
    .join("");

  const integration = d.integration_surface.map((s) => `<span class="chip">${esc(s)}</span>`).join("");
  const risks = d.risk_flags.map((r) => `<li>${esc(r)}</li>`).join("");
  const questions = d.open_questions_for_call
    .map((q, i) => `<li><span class="num">${String(i + 1).padStart(2, "0")}</span>${esc(q)}</li>`)
    .join("");

  const approaches = p.approaches
    .map(
      (a) => `<div class="approach">
        <p class="aname">${esc(a.name)}</p>
        <p class="adesc">${esc(a.description)}</p>
        <p class="atrade"><span class="soft mono">tradeoff</span> ${esc(a.tradeoffs)}</p>
      </div>`,
    )
    .join("");

  const belowMin = analysis.below_minimum_engagement
    ? `<div class="warn">⚠ BELOW MINIMUM ENGAGEMENT — top of quote range does not cover estimated build cost. Requote or rescope.</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Consultant Dossier — Recce</title>
<style>
  :root{--paper:#edeae0;--raised:#f5f2ea;--ink:#21201b;--soft:#6b6759;--line:#c9c4b4;--signal:#e8590c;--ok:#4a7c42;--mid:#c2410c;--hard:#b3261e}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.5}
  .mono{font-family:ui-monospace,"SF Mono",Menlo,monospace}
  .soft{color:var(--soft)}
  .wrap{max-width:860px;margin:0 auto;padding:40px 28px 80px}
  .stamp{font-family:ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--soft)}
  header{border:2px solid var(--ink);background:var(--raised);padding:20px 22px;position:relative;box-shadow:6px 6px 0 0 var(--line)}
  header::before,header::after{content:"";position:absolute;width:10px;height:10px;border:2px solid var(--signal)}
  header::before{top:-2px;left:-2px;border-right:0;border-bottom:0}
  header::after{bottom:-2px;right:-2px;border-left:0;border-top:0}
  .eyes{color:var(--signal);font-weight:700}
  h1{font-size:24px;letter-spacing:-.01em;margin:6px 0 2px;text-transform:uppercase}
  .ctx{font-size:14px;color:var(--soft)}
  .strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:18px 0}
  .metric{border:1px solid var(--line);background:var(--raised);padding:12px 14px}
  .metric .v{font-family:ui-monospace,Menlo,monospace;font-size:22px;font-weight:600;color:var(--ink)}
  .metric .v.sig{color:var(--signal)}
  .metric .l{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin-top:3px}
  section{margin-top:26px}
  .h{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .h .rule{height:1px;flex:1;background:var(--line)}
  .h .stamp{color:var(--soft)}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{border-top:1px solid var(--line);padding:9px 8px;vertical-align:top}
  tr:first-child td{border-top:0}
  td.mono{white-space:nowrap;width:1%;padding-right:16px}
  .badge{font-family:ui-monospace,Menlo,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;border:1px solid;padding:2px 7px;white-space:nowrap}
  .badge.ok{color:var(--ok);border-color:var(--ok)}
  .badge.mid{color:var(--mid);border-color:var(--mid)}
  .badge.hard{color:var(--hard);border-color:var(--hard)}
  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .chip{font-family:ui-monospace,Menlo,monospace;font-size:12px;border:1px solid var(--line);background:var(--raised);padding:5px 10px;color:var(--ink)}
  ul{list-style:none}
  .risks li{position:relative;padding:5px 0 5px 20px;font-size:14px;border-bottom:1px solid var(--line)}
  .risks li:last-child{border-bottom:0}
  .risks li::before{content:"▲";position:absolute;left:0;color:var(--signal);font-size:11px;top:7px}
  .qs li{display:flex;gap:10px;padding:5px 0;font-size:14px}
  .qs .num{font-family:ui-monospace,Menlo,monospace;color:var(--soft);flex:0 0 auto}
  .approach{border:1px solid var(--line);background:var(--raised);padding:12px 14px;margin-bottom:10px}
  .aname{font-weight:600;font-size:15px}
  .adesc{font-size:14px;color:var(--ink);margin-top:2px}
  .atrade{font-size:13px;color:var(--soft);margin-top:6px}
  .atrade .soft{margin-right:6px}
  .rec{border:2px solid var(--signal);background:rgba(232,89,12,.08);padding:12px 14px;margin-top:14px;font-size:15px;color:var(--ink)}
  .rec .stamp{color:var(--signal);display:block;margin-bottom:4px}
  .warn{border:2px solid var(--signal);background:rgba(232,89,12,.1);color:var(--ink);padding:12px 14px;margin:16px 0;font-size:14px;font-weight:500}
  footer{margin-top:34px;padding-top:14px;border-top:1px solid var(--line);font-size:11px;color:var(--soft);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
</style></head>
<body><div class="wrap">
  <header>
    <p class="stamp"><span class="eyes">■ EYES ONLY</span> · consultant copy · same conversation, rebuilt as a build spec</p>
    <h1>Consultant Dossier</h1>
    <p class="ctx">${esc(model.business_context || "Workflow engagement")}</p>
  </header>

  ${belowMin}

  <div class="strip">
    <div class="metric"><div class="v sig">${sgd(waste.quoteLow)}–${sgd(waste.quoteHigh)}</div><div class="l">quote range</div></div>
    <div class="metric"><div class="v">${d.build_hours_estimate}h</div><div class="l">est. build</div></div>
    <div class="metric"><div class="v">${waste.hoursPerMonth.toFixed(1)}h</div><div class="l">waste / month</div></div>
    <div class="metric"><div class="v">${model.hourly_value_sgd ? sgd(waste.costPerYear) : "—"}</div><div class="l">cost / year</div></div>
  </div>

  <section>
    <div class="h"><span class="stamp">Feasibility · per step</span><span class="rule"></span></div>
    <table>${feasibility}</table>
  </section>

  <section>
    <div class="h"><span class="stamp">Integration surface</span><span class="rule"></span></div>
    <div class="chips">${integration}</div>
  </section>

  <section>
    <div class="h"><span class="stamp">Risk flags</span><span class="rule"></span></div>
    <ul class="risks">${risks}</ul>
  </section>

  <section>
    <div class="h"><span class="stamp">Resolve on the call</span><span class="rule"></span></div>
    <ul class="qs">${questions}</ul>
  </section>

  <section>
    <div class="h"><span class="stamp">Proposed approaches</span><span class="rule"></span></div>
    ${approaches}
    <div class="rec"><span class="stamp">Recommended first build</span>→ ${esc(p.recommended)}</div>
  </section>

  <footer>
    <span class="mono">RECCE · FIELD DOSSIER</span>
    <span class="mono">generated ${esc(stamp)} · nothing retained server-side</span>
  </footer>
</div></body></html>`;
}
