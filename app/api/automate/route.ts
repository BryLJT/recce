import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

// The hero automation — the real AccelLearn worksheet pipeline:
// copy template per student → share with student → construct Kami viewer link
// → (optionally) append the links to a master Google Doc. All on the consultant's
// own account via a pre-minted refresh token; no browser, no consent on stage.

export const maxDuration = 120;

interface Student {
  name: string;
  email: string;
}

function oauthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error("Google credentials missing from .env.local");
  }
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return client;
}

const kamiLink = (fileId: string) =>
  `https://web.kamihq.com/web/viewer.html?state=${encodeURIComponent(
    JSON.stringify({ ids: [fileId], action: "open" })
  )}`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Demo defaults: template + master doc pre-staged on the consultant's Drive.
  const templateFileId: string = body.templateFileId || process.env.DEMO_TEMPLATE_FILE_ID || "";
  const masterDocId: string | undefined = body.masterDocId || process.env.DEMO_MASTER_DOC_ID;
  const students: Student[] = body.students?.length
    ? body.students
    : [
        { name: "Aisha", email: "" },
        { name: "Marcus", email: "" },
        { name: "Wei Lin", email: "" },
      ];
  const share: boolean = body.share ?? true;
  if (!templateFileId) {
    return NextResponse.json({ ok: false, error: "no template file id" }, { status: 400 });
  }

  try {
    const auth = oauthClient();
    const drive = google.drive({ version: "v3", auth });

    const results = [];
    for (const student of students) {
      const copy = await drive.files.copy({
        fileId: templateFileId,
        requestBody: { name: `${student.name} — worksheet` },
        fields: "id,name,webViewLink",
      });
      const fileId = copy.data.id!;

      if (share && student.email) {
        await drive.permissions.create({
          fileId,
          requestBody: { type: "user", role: "writer", emailAddress: student.email },
          sendNotificationEmail: false,
        });
      }

      results.push({
        student: student.name,
        fileId,
        driveLink: copy.data.webViewLink,
        kamiLink: kamiLink(fileId),
      });
    }

    if (masterDocId) {
      const docs = google.docs({ version: "v1", auth });
      const textBlock =
        `\nWorksheet round — generated ${new Date().toLocaleDateString("en-SG")}\n` +
        results.map((r) => `${r.student}: ${r.kamiLink}\n`).join("");
      await docs.documents.batchUpdate({
        documentId: masterDocId,
        requestBody: {
          requests: [{ insertText: { text: textBlock, endOfSegmentLocation: { segmentId: "" } } }],
        },
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("automate failed:", err);
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
