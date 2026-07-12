// Mock mode — used automatically when ANTHROPIC_API_KEY is absent, so the whole
// happy path is demoable/testable before credits land. Same shapes as the real thing.

import type { AnalyzeResponse, ElicitResponse, WorkflowModel } from "./types";

const baseModel: WorkflowModel = {
  business_context: "Tuition centre preparing and distributing weekly worksheets to students",
  steps: [],
  open_questions: ["How long does each worksheet round take?", "How many students?"],
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

const stages: ElicitResponse[] = [
  {
    message:
      "Got it — so every week you prepare worksheets for your students. Walk me through what happens first, from the moment a worksheet is ready. (You'll see the maths build up on the right as we talk — the numbers are yours to correct.)",
    model: { ...baseModel },
  },
  {
    message:
      "That's really clear. So you copy the PDF once per student in Google Drive — roughly how many minutes does one full copying round take you?",
    model: {
      ...baseModel,
      steps: [
        {
          id: "copy-worksheets",
          name: "Copy worksheet per student",
          description: "Duplicate the template PDF once for each student in Google Drive",
          tool: "Google Drive",
          minutes_per_occurrence: 20,
          frequency_per_month: 4,
          is_estimate: true,
          pain_level: 4,
          automatable: "yes",
          fit_note: "Drive can copy per-student automatically from one template",
        },
      ],
      capture_notes: {
        ...baseModel.capture_notes,
        tools_systems: ["Google Drive"],
        data_shape: "PDF worksheets in Drive folders",
      },
    },
  },
  {
    message:
      "I'll put sharing and link-collection down as 25 minutes a round — fix me if I'm off. Last big one: when you mark, do you and the student look at the same copy together, or do they send it back?",
    model: {
      ...baseModel,
      steps: [
        {
          id: "copy-worksheets",
          name: "Copy worksheet per student",
          description: "Duplicate the template PDF once for each student in Google Drive",
          tool: "Google Drive",
          minutes_per_occurrence: 20,
          frequency_per_month: 4,
          is_estimate: false,
          pain_level: 4,
          automatable: "yes",
          fit_note: "Drive can copy per-student automatically from one template",
        },
        {
          id: "share-and-links",
          name: "Share copies + collect Kami links",
          description: "Share each copy with its student, open each in Kami, paste links into the master doc",
          tool: "Google Drive + Kami + Google Docs",
          minutes_per_occurrence: 25,
          frequency_per_month: 4,
          is_estimate: true,
          pain_level: 5,
          automatable: "yes",
          fit_note: "Links are constructable automatically; the master doc can fill itself in",
        },
      ],
      open_questions: ["Hourly value of the teacher's time?"],
      capture_notes: {
        tools_systems: ["Google Drive", "Kami", "Google Docs"],
        data_shape: "PDF worksheets, one master Google Doc of links",
        data_sensitivity: "Student names and work — moderate",
        access_reality: "Owner has full Google Workspace admin",
        volume_scale: "~15 students, weekly",
        adoption_constraints: "Teachers comfortable with Drive; no new tools wanted",
      },
      hourly_value_sgd: 0,
    },
  },
  {
    message:
      "Perfect — that's everything I need. You can hit \"Generate my value brief\" whenever you're ready, or keep adding anything I missed.",
    model: {
      ...baseModel,
      steps: [
        {
          id: "copy-worksheets",
          name: "Copy worksheet per student",
          description: "Duplicate the template PDF once for each student in Google Drive",
          tool: "Google Drive",
          minutes_per_occurrence: 20,
          frequency_per_month: 4,
          is_estimate: false,
          pain_level: 4,
          automatable: "yes",
          fit_note: "Drive can copy per-student automatically from one template",
        },
        {
          id: "share-and-links",
          name: "Share copies + collect Kami links",
          description: "Share each copy with its student, open each in Kami, paste links into the master doc",
          tool: "Google Drive + Kami + Google Docs",
          minutes_per_occurrence: 25,
          frequency_per_month: 4,
          is_estimate: false,
          pain_level: 5,
          automatable: "yes",
          fit_note: "Links are constructable automatically; the master doc can fill itself in",
        },
        {
          id: "chase-completion",
          name: "Chase students for completion",
          description: "Message students/parents on WhatsApp to remind about unfinished worksheets",
          tool: "WhatsApp",
          minutes_per_occurrence: 15,
          frequency_per_month: 4,
          is_estimate: true,
          pain_level: 3,
          automatable: "partial",
          fit_note: "Reminders can be drafted automatically; sending stays human",
        },
      ],
      open_questions: [],
      capture_notes: {
        tools_systems: ["Google Drive", "Kami", "Google Docs", "WhatsApp"],
        data_shape: "PDF worksheets, one master Google Doc of links, WhatsApp chats",
        data_sensitivity: "Student names and work — moderate; parent phone numbers",
        access_reality: "Owner has full Google Workspace admin",
        volume_scale: "~15 students, weekly worksheets",
        adoption_constraints: "Teachers comfortable with Drive; no new tools wanted",
      },
      hourly_value_sgd: 30,
      done: true,
    },
  },
];

export function mockElicit(turn: number): ElicitResponse {
  return stages[Math.min(turn, stages.length - 1)];
}

export function mockAnalyze(model: WorkflowModel): AnalyzeResponse {
  return {
    client_brief: {
      headline: "Your worksheet round can run itself — every week, before you sit down.",
      summary:
        "Each week you copy a worksheet for every student, share it, open each one in Kami, and paste links into your master doc — then chase completion on WhatsApp. Almost all of that is the same clicks repeated per student, which is exactly what automation is best at.",
      fit_points: model.steps
        .filter((s) => s.automatable !== "no")
        .map((s) => ({ step_id: s.id, opportunity: s.fit_note || "Can be streamlined" })),
      prototype_pitch:
        "Below is a working first cut of your automation: it copied a real worksheet, shared it, and produced the Kami links — built by AI from this conversation alone. It's a taster, not the final tool: the consultant will sit down with you and iron out exactly what you need.",
    },
    consultant_dossier: {
      feasibility: model.steps.map((s) => ({
        step_id: s.id,
        method:
          s.id === "copy-worksheets"
            ? "Drive API files.copy per student from template ID"
            : s.id === "share-and-links"
              ? "permissions.create per copy + Kami viewer URL interpolation + Docs batchUpdate"
              : "Draft-only WhatsApp reminder generation (human sends)",
        feasibility: s.automatable === "yes" ? "easy" : "moderate",
      })),
      integration_surface: ["Google Drive API", "Google Docs API", "Kami (viewer URL only)", "WhatsApp (manual send)"],
      build_hours_estimate: 12,
      risk_flags: [
        "Student-side Kami link access unverified (Test C pending)",
        "Parent phone numbers = PDPA-sensitive; keep out of any hosted DB",
      ],
      open_questions_for_call: [
        "Confirm student Google accounts are consistent",
        "Who maintains the student email list?",
      ],
    },
    solution_proposal: {
      approaches: [
        {
          name: "Apps Script bound to a Sheet",
          description: "Teacher clicks a button in a Google Sheet; script runs as the owner's account.",
          tradeoffs: "Zero hosting and zero auth setup, teacher-friendly; harder to extend beyond Google.",
        },
        {
          name: "Hosted Node service",
          description: "Small server with OAuth refresh token, callable from anywhere.",
          tradeoffs: "Extensible (chat/webhooks later); needs hosting + key management.",
        },
      ],
      recommended: "Apps Script bound to a Sheet — everything lives in Workspace and no infra to babysit.",
    },
  };
}
