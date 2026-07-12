"use client";

import { useRef, useState } from "react";
import type {
  AnalyzeResponse,
  ChatMessage,
  ElicitResponse,
  WorkflowModel,
} from "@/lib/types";
import { computeWaste, fmtSGD } from "@/lib/quote";

type Analysis = AnalyzeResponse & { below_minimum_engagement: boolean };

const emptyModel: WorkflowModel = {
  business_context: "",
  steps: [],
  open_questions: [],
  capture_notes: {
    tools_systems: [],
    data_shape: "",
    data_sensitivity: "",
    access_reality: "",
    volume_scale: "",
    adoption_constraints: "",
  },
  hourly_value_sgd: 0,
  done: false,
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [model, setModel] = useState<WorkflowModel>(emptyModel);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [view, setView] = useState<"client" | "consultant">("client");
  const [mock, setMock] = useState(false);
  const [protoBusy, setProtoBusy] = useState(false);
  const [protoResults, setProtoResults] = useState<
    { student: string; kamiLink: string; driveLink: string }[] | null
  >(null);
  const [protoError, setProtoError] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const waste = computeWaste(model);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/elicit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data: ElicitResponse & { mock?: boolean; error?: string } = await res.json();
      if (data.error) {
        setMessages([...next, { role: "assistant", content: data.error }]);
      } else {
        if (data.mock) setMock(true);
        setModel(data.model);
        setMessages([...next, { role: "assistant", content: data.message }]);
      }
    } catch {
      setMessages([...next, { role: "assistant", content: "Connection hiccup — try that again?" }]);
    } finally {
      setBusy(false);
      setTimeout(() => chatEnd.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  async function generateBrief() {
    setBusy(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, waste }),
      });
      const data = await res.json();
      if (!data.error) setAnalysis(data);
    } finally {
      setBusy(false);
    }
  }

  async function runPrototype() {
    setProtoBusy(true);
    setProtoError(null);
    try {
      const res = await fetch("/api/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // demo defaults: staged template + master doc + 3 students
      });
      const data = await res.json();
      if (data.ok) setProtoResults(data.results);
      else setProtoError(data.error || "automation failed");
    } catch {
      setProtoError("connection failed");
    } finally {
      setProtoBusy(false);
    }
  }

  function patchStep(id: string, field: "minutes_per_occurrence" | "frequency_per_month", value: number) {
    setModel({
      ...model,
      steps: model.steps.map((s) => (s.id === id ? { ...s, [field]: value, is_estimate: false } : s)),
    });
  }

  const consultantView = analysis && view === "consultant";

  return (
    <main className="min-h-screen text-ink">
      {/* ── masthead ─────────────────────────────────────────── */}
      <header className="border-b-2 border-ink bg-paper-raised px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <h1
              className="text-3xl font-bold uppercase leading-none tracking-tight text-ink"
              style={{ fontFamily: "var(--font-saira)" }}
            >
              Recce
              <span className="ml-2 inline-block h-2.5 w-2.5 bg-signal" aria-hidden />
            </h1>
            <div className="hidden sm:block">
              <p className="stamp text-ink-soft">Forward deployed agent · workflow reconnaissance</p>
              <p className="stamp text-ink-soft/70">
                Session live — every number on this page is yours to correct
                {mock && <span className="ml-2 border border-signal px-1 text-signal">SIM MODE</span>}
              </p>
            </div>
          </div>
          {analysis && (
            <div className="flex border-2 border-ink">
              <button
                onClick={() => setView("client")}
                className={`stamp px-3 py-1.5 transition-colors ${
                  view === "client" ? "bg-ink text-paper" : "bg-transparent text-ink hover:bg-line/40"
                }`}
              >
                Field report
              </button>
              <button
                onClick={() => setView("consultant")}
                className={`stamp px-3 py-1.5 transition-colors ${
                  view === "consultant" ? "bg-signal text-paper" : "bg-transparent text-ink hover:bg-line/40"
                }`}
              >
                Eyes only
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        {/* ── LEFT: the debrief (chat) ─────────────────────────── */}
        <section className="reticle flex h-[82vh] flex-col border-2 border-ink bg-paper-raised text-ink shadow-[6px_6px_0_0_var(--line)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <span className="stamp text-ink-soft">Debrief transcript</span>
            <span className="stamp text-ink-soft/60">REC ●</span>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="border border-dashed border-line p-4">
                <p className="stamp mb-1 text-signal">Begin debrief</p>
                <p className="text-sm text-ink-soft">
                  Describe, in your own words, a piece of work you do over and over. Ramble away —
                  that&apos;s exactly what I&apos;m for.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`field-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[88%]">
                  <p className={`stamp mb-0.5 ${m.role === "user" ? "text-right text-ink-soft/60" : "text-signal"}`}>
                    {m.role === "user" ? "You" : "Recce"}
                  </p>
                  <div
                    className={`whitespace-pre-wrap px-4 py-2.5 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "border border-line bg-paper text-ink"
                        : "border-l-2 border-signal bg-signal-soft/25 text-ink"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-1.5 pl-1">
                <span className="sweep-dot h-1.5 w-1.5 rounded-full bg-signal" />
                <span className="sweep-dot h-1.5 w-1.5 rounded-full bg-signal" />
                <span className="sweep-dot h-1.5 w-1.5 rounded-full bg-signal" />
                <span className="stamp ml-2 text-ink-soft/60">scanning</span>
              </div>
            )}
            <div ref={chatEnd} />
          </div>
          <div className="flex gap-2 border-t-2 border-ink p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={2}
              placeholder="Describe your workflow…"
              className="flex-1 resize-none border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-signal focus:outline-none"
            />
            <button
              onClick={send}
              disabled={busy}
              className="stamp border-2 border-ink bg-ink px-4 text-paper transition-transform hover:translate-y-[-1px] disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </section>

        {/* ── RIGHT: the intel (map / brief / dossier) ─────────── */}
        <section
          className={`reticle h-[82vh] overflow-y-auto border-2 p-5 transition-colors duration-500 ${
            consultantView
              ? "ops-atmosphere border-ops-line text-phosphor shadow-[6px_6px_0_0_var(--ops-line)]"
              : "border-ink bg-paper-raised text-ink shadow-[6px_6px_0_0_var(--line)]"
          }`}
        >
          {!analysis && (
            <div className="space-y-5">
              <WasteMeter waste={waste} hourly={model.hourly_value_sgd} />
              <div>
                <p className="stamp mb-2 flex items-center gap-2 text-ink-soft">
                  <span className="inline-block h-px w-6 bg-ink-soft" />
                  Workflow map — as reported
                </p>
                {model.steps.length === 0 && (
                  <p className="border border-dashed border-line p-4 text-sm text-ink-soft">
                    Steps appear here as you describe them.
                  </p>
                )}
                <div className="space-y-2.5">
                  {model.steps.map((s, i) => (
                    <div key={s.id} className="field-in border border-line bg-paper p-3" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">
                          <span className="stamp mr-2 text-signal">{String(i + 1).padStart(2, "0")}</span>
                          {s.name}
                        </span>
                        <span className="stamp text-ink-soft">{s.tool}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <label className="flex items-center gap-1.5 font-mono">
                          <input
                            type="number"
                            value={s.minutes_per_occurrence}
                            onChange={(e) => patchStep(s.id, "minutes_per_occurrence", Number(e.target.value))}
                            className="tabular w-16 border border-line bg-paper-raised px-1.5 py-0.5 focus:border-signal focus:outline-none"
                          />
                          <span className="stamp text-ink-soft">min ea.</span>
                        </label>
                        <label className="flex items-center gap-1.5 font-mono">
                          <input
                            type="number"
                            value={s.frequency_per_month}
                            onChange={(e) => patchStep(s.id, "frequency_per_month", Number(e.target.value))}
                            className="tabular w-16 border border-line bg-paper-raised px-1.5 py-0.5 focus:border-signal focus:outline-none"
                          />
                          <span className="stamp text-ink-soft">× / mo</span>
                        </label>
                        {s.is_estimate && <span className="stamp text-signal">est. — correct me</span>}
                        {s.fit_note && <span className="text-xs text-good">▲ {s.fit_note}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {model.done && (
                <button
                  onClick={generateBrief}
                  disabled={busy}
                  className="stamp w-full border-2 border-ink bg-signal py-3.5 text-sm text-white transition-transform hover:translate-y-[-1px] disabled:opacity-40"
                >
                  {busy ? "Compiling…" : "Generate my value brief →"}
                </button>
              )}
            </div>
          )}

          {analysis && view === "client" && (
            <div className="field-in space-y-5">
              <p className="stamp text-ink-soft">Field report · prepared for you</p>
              <WasteMeter waste={waste} hourly={model.hourly_value_sgd} />
              <h2 className="text-2xl font-bold leading-snug" style={{ fontFamily: "var(--font-saira)" }}>
                {analysis.client_brief.headline}
              </h2>
              <p className="text-sm leading-relaxed text-ink-soft">{analysis.client_brief.summary}</p>

              <div className="border-2 border-ink bg-paper p-4">
                <p className="stamp mb-1 text-ink-soft">The deal, plainly</p>
                <p className="font-mono text-lg font-semibold text-ink tabular">
                  {fmtSGD(waste.quoteLow)} – {fmtSGD(waste.quoteHigh)}
                </p>
                <p className="stamp text-ink-soft">refined when we talk</p>
                <p className="mt-2 border-t border-line pt-2 text-sm text-good">
                  You keep <span className="font-mono font-semibold tabular">{fmtSGD(waste.netSavingsLow)} – {fmtSGD(waste.netSavingsHigh)}</span> in year one.
                </p>
              </div>

              <ul className="space-y-1.5">
                {analysis.client_brief.fit_points.map((f) => (
                  <li key={f.step_id} className="flex gap-2 text-sm">
                    <span className="text-signal">▲</span> {f.opportunity}
                  </li>
                ))}
              </ul>

              <div className="border border-line bg-paper p-4">
                <p className="stamp mb-2 text-signal">Your pre-prototype</p>
                <p className="text-sm leading-relaxed text-ink-soft">{analysis.client_brief.prototype_pitch}</p>
                {!protoResults && (
                  <button
                    onClick={runPrototype}
                    disabled={protoBusy}
                    className="stamp mt-3 w-full border-2 border-ink bg-ink py-3 text-paper transition-transform hover:translate-y-[-1px] disabled:opacity-40"
                  >
                    {protoBusy ? "Running your automation…" : "▶ Run the pre-prototype — for real"}
                  </button>
                )}
                {protoError && <p className="mt-2 text-sm text-signal">{protoError}</p>}
                {protoResults && (
                  <div className="field-in mt-3 border border-good/50 bg-good/5 p-3">
                    <p className="stamp mb-2 text-good">✓ Live run complete — real files, created just now</p>
                    <div className="space-y-1">
                      {protoResults.map((r) => (
                        <div key={r.student} className="flex items-center gap-3 text-sm">
                          <span className="w-20 font-mono font-medium">{r.student}</span>
                          <a href={r.kamiLink} target="_blank" className="text-signal underline underline-offset-2">
                            open in Kami
                          </a>
                          <a href={r.driveLink} target="_blank" className="text-ink-soft underline underline-offset-2">
                            Drive
                          </a>
                        </div>
                      ))}
                    </div>
                    <p className="stamp mt-2 text-ink-soft/70">…and the master doc just updated itself.</p>
                  </div>
                )}
                <p className="stamp mt-3 text-ink-soft/60">
                  AI-generated pre-prototype from this conversation — we&apos;ll iron out exactly what you need together.
                </p>
              </div>
            </div>
          )}

          {analysis && consultantView && (
            <div className="field-in space-y-5">
              <div className="flex items-center justify-between">
                <p className="stamp text-signal">Eyes only — consultant copy</p>
                <p className="stamp text-phosphor-soft">same conversation · rebuilt as a build spec</p>
              </div>

              {analysis.below_minimum_engagement && (
                <div className="border-2 border-signal bg-signal/10 p-3">
                  <p className="stamp text-signal">⚠ Below minimum engagement</p>
                  <p className="mt-1 text-sm text-phosphor">
                    Top of quote range doesn&apos;t cover estimated build cost.
                  </p>
                </div>
              )}

              <div>
                <p className="stamp mb-2 flex items-center gap-2 text-phosphor-soft">
                  <span className="inline-block h-px w-6 bg-phosphor-soft" />
                  Feasibility, per step
                </p>
                <div className="space-y-1.5">
                  {analysis.consultant_dossier.feasibility.map((f) => (
                    <div key={f.step_id} className="flex items-start gap-2 border border-ops-line bg-ops-raised p-2.5 text-sm">
                      <span
                        className={`stamp mt-0.5 border px-1.5 py-0.5 ${
                          f.feasibility === "easy"
                            ? "border-good text-good"
                            : f.feasibility === "moderate"
                              ? "border-signal text-signal"
                              : "border-red-400 text-red-400"
                        }`}
                      >
                        {f.feasibility}
                      </span>
                      <span className="leading-relaxed">
                        <span className="font-mono text-phosphor-soft">{f.step_id}</span> — {f.method}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-ops-line bg-ops-raised p-3">
                  <p className="stamp text-phosphor-soft">Integration surface</p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {analysis.consultant_dossier.integration_surface.join(" · ")}
                  </p>
                </div>
                <div className="border border-ops-line bg-ops-raised p-3">
                  <p className="stamp text-phosphor-soft">Est. build</p>
                  <p className="tabular mt-1 font-mono text-2xl font-semibold text-signal">
                    {analysis.consultant_dossier.build_hours_estimate}
                    <span className="text-sm text-phosphor-soft"> hrs</span>
                  </p>
                </div>
              </div>

              <div>
                <p className="stamp mb-1 text-phosphor-soft">Risk flags</p>
                <ul className="space-y-1 text-sm">
                  {analysis.consultant_dossier.risk_flags.map((r, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-signal">▲</span> {r}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="stamp mb-1 text-phosphor-soft">Resolve on the call</p>
                <ul className="space-y-1 text-sm">
                  {analysis.consultant_dossier.open_questions_for_call.map((q, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-mono text-phosphor-soft">{String(i + 1).padStart(2, "0")}</span> {q}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-2 border-ops-line p-4">
                <p className="stamp mb-2 text-phosphor-soft">Proposed approaches</p>
                <div className="space-y-2">
                  {analysis.solution_proposal.approaches.map((a) => (
                    <div key={a.name} className="text-sm leading-relaxed">
                      <span className="font-semibold text-phosphor">{a.name}</span> — {a.description}{" "}
                      <span className="text-phosphor-soft">({a.tradeoffs})</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-ops-line pt-2 text-sm font-medium text-signal">
                  → {analysis.solution_proposal.recommended}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function WasteMeter({
  waste,
  hourly,
}: {
  waste: ReturnType<typeof computeWaste>;
  hourly: number;
}) {
  return (
    <div className="reticle border-2 border-ink bg-olive-deep p-4 text-paper">
      <p className="stamp mb-3 flex items-center justify-between text-phosphor-soft">
        <span>Signal — cost of the current workflow</span>
        <span className="text-signal">live</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="tabular font-mono text-3xl font-semibold leading-none text-paper">
            {waste.hoursPerMonth.toFixed(1)}
            <span className="text-base text-phosphor-soft">h</span>
          </p>
          <p className="stamp mt-1 text-phosphor-soft">lost / month</p>
        </div>
        <div>
          <p className="tabular font-mono text-3xl font-semibold leading-none text-paper">
            {hourly ? fmtSGD(waste.costPerMonth) : "——"}
          </p>
          <p className="stamp mt-1 text-phosphor-soft">cost / month</p>
        </div>
        <div>
          <p className="tabular font-mono text-3xl font-semibold leading-none text-signal">
            {hourly ? fmtSGD(waste.costPerYear) : "——"}
          </p>
          <p className="stamp mt-1 text-phosphor-soft">cost / year</p>
        </div>
      </div>
      <p className="stamp mt-3 border-t border-ops-line pt-2 text-phosphor-soft/70">
        minutes × times-per-month × your hourly value — edit any number, everything recalculates
      </p>
    </div>
  );
}
