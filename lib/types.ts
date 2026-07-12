// The workflow model — the single source of truth both views project from.
// Claude fills this via structured outputs; the UI binds to it live.

export type Automatable = "yes" | "partial" | "no" | "unknown";

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  tool: string; // what system/tool this step touches (plain words, e.g. "Google Drive", "WhatsApp", "paper")
  minutes_per_occurrence: number; // best current estimate; 0 = unknown
  frequency_per_month: number; // how many times this step happens per month; 0 = unknown
  is_estimate: boolean; // true if the numbers are the agent's inference, not the client's words
  pain_level: number; // 1-5, how much the client dislikes/struggles with this step
  automatable: Automatable;
  fit_note: string; // one plain-language line on where automation fits, "" if none
}

export interface CaptureNotes {
  tools_systems: string[]; // integration surface
  data_shape: string; // what the data looks like (files, chats, spreadsheets...)
  data_sensitivity: string; // PDPA/privacy-relevant notes
  access_reality: string; // admin rights, API access, subscriptions
  volume_scale: string; // students/customers/documents per week etc.
  adoption_constraints: string; // tech comfort, willingness to change tools
}

export interface WorkflowModel {
  business_context: string; // one-line description of the business + workflow
  steps: WorkflowStep[];
  open_questions: string[]; // what the agent still wants to know
  capture_notes: CaptureNotes;
  hourly_value_sgd: number; // value of one staff hour in SGD; 0 = not yet known
  done: boolean; // agent judges the model complete enough to generate the briefs
}

export interface ElicitResponse {
  message: string; // the agent's next reply/question to the client (one question at a time)
  model: WorkflowModel;
}

export interface FitPoint {
  step_id: string;
  opportunity: string;
}

export interface ClientBrief {
  headline: string;
  summary: string;
  fit_points: FitPoint[];
  prototype_pitch: string; // one paragraph selling the pre-prototype taster
}

export interface FeasibilityItem {
  step_id: string;
  method: string; // proposed technical approach in one line
  feasibility: "easy" | "moderate" | "hard" | "not-automatable";
}

export interface ConsultantDossier {
  feasibility: FeasibilityItem[];
  integration_surface: string[];
  build_hours_estimate: number;
  risk_flags: string[];
  open_questions_for_call: string[];
}

export interface SolutionApproach {
  name: string;
  description: string;
  tradeoffs: string;
}

export interface SolutionProposal {
  approaches: SolutionApproach[];
  recommended: string; // name of the recommended approach + one-line why
}

export interface AnalyzeResponse {
  client_brief: ClientBrief;
  consultant_dossier: ConsultantDossier;
  solution_proposal: SolutionProposal;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
