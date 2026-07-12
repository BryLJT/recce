// JSON Schemas for Claude structured outputs (output_config.format).
// Constraint: every object needs additionalProperties: false + required listing ALL properties.
// No minimum/maximum/minLength — not supported by structured outputs.

const workflowStepSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "short stable slug, e.g. 'copy-worksheets'" },
    name: { type: "string" },
    description: { type: "string" },
    tool: { type: "string" },
    minutes_per_occurrence: { type: "number", description: "0 if unknown" },
    frequency_per_month: { type: "number", description: "0 if unknown" },
    is_estimate: { type: "boolean" },
    pain_level: { type: "integer", description: "1-5" },
    automatable: { type: "string", enum: ["yes", "partial", "no", "unknown"] },
    fit_note: { type: "string", description: "empty string if none" },
  },
  required: [
    "id", "name", "description", "tool", "minutes_per_occurrence",
    "frequency_per_month", "is_estimate", "pain_level", "automatable", "fit_note",
  ],
  additionalProperties: false,
} as const;

const captureNotesSchema = {
  type: "object",
  properties: {
    tools_systems: { type: "array", items: { type: "string" } },
    data_shape: { type: "string" },
    data_sensitivity: { type: "string" },
    access_reality: { type: "string" },
    volume_scale: { type: "string" },
    adoption_constraints: { type: "string" },
  },
  required: ["tools_systems", "data_shape", "data_sensitivity", "access_reality", "volume_scale", "adoption_constraints"],
  additionalProperties: false,
} as const;

export const workflowModelSchema = {
  type: "object",
  properties: {
    business_context: { type: "string" },
    steps: { type: "array", items: workflowStepSchema },
    open_questions: { type: "array", items: { type: "string" } },
    capture_notes: captureNotesSchema,
    hourly_value_sgd: { type: "number", description: "0 if not yet known" },
    done: { type: "boolean" },
  },
  required: ["business_context", "steps", "open_questions", "capture_notes", "hourly_value_sgd", "done"],
  additionalProperties: false,
} as const;

export const elicitResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string", description: "the agent's next reply to the client — exactly one question at a time" },
    model: workflowModelSchema,
  },
  required: ["message", "model"],
  additionalProperties: false,
} as const;

export const analyzeResponseSchema = {
  type: "object",
  properties: {
    client_brief: {
      type: "object",
      properties: {
        headline: { type: "string" },
        summary: { type: "string" },
        fit_points: {
          type: "array",
          items: {
            type: "object",
            properties: { step_id: { type: "string" }, opportunity: { type: "string" } },
            required: ["step_id", "opportunity"],
            additionalProperties: false,
          },
        },
        prototype_pitch: { type: "string" },
      },
      required: ["headline", "summary", "fit_points", "prototype_pitch"],
      additionalProperties: false,
    },
    consultant_dossier: {
      type: "object",
      properties: {
        feasibility: {
          type: "array",
          items: {
            type: "object",
            properties: {
              step_id: { type: "string" },
              method: { type: "string" },
              feasibility: { type: "string", enum: ["easy", "moderate", "hard", "not-automatable"] },
            },
            required: ["step_id", "method", "feasibility"],
            additionalProperties: false,
          },
        },
        integration_surface: { type: "array", items: { type: "string" } },
        build_hours_estimate: { type: "number" },
        risk_flags: { type: "array", items: { type: "string" } },
        open_questions_for_call: { type: "array", items: { type: "string" } },
      },
      required: ["feasibility", "integration_surface", "build_hours_estimate", "risk_flags", "open_questions_for_call"],
      additionalProperties: false,
    },
    solution_proposal: {
      type: "object",
      properties: {
        approaches: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              tradeoffs: { type: "string" },
            },
            required: ["name", "description", "tradeoffs"],
            additionalProperties: false,
          },
        },
        recommended: { type: "string" },
      },
      required: ["approaches", "recommended"],
      additionalProperties: false,
    },
  },
  required: ["client_brief", "consultant_dossier", "solution_proposal"],
  additionalProperties: false,
} as const;
