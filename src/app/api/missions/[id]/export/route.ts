import PDFDocument from "pdfkit";
import { DEMO_MISSION, DEMO_RESPONSES } from "@/features/missions/demo-data";

export const runtime = "nodejs";

function buildPacket(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margins: { top: 56, right: 58, bottom: 56, left: 58 }, info: { Title: `${DEMO_MISSION.title} — Student Letter Packet`, Author: "CivicSpark Missions" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor("#0d1f3c").font("Helvetica-Bold").fontSize(11).text("CIVICSPARK MISSIONS", { characterSpacing: 1.4 });
    doc.moveDown(2).font("Times-Bold").fontSize(28).text(DEMO_MISSION.title, { lineGap: 3 });
    doc.moveDown(.5).fillColor("#6a7482").font("Helvetica").fontSize(11).text(`${DEMO_MISSION.bill.type} ${DEMO_MISSION.bill.number} · ${DEMO_MISSION.bill.title}`);
    doc.moveDown(2).fillColor("#0d1f3c").font("Helvetica-Bold").text(`Prepared for ${DEMO_MISSION.representative.title} ${DEMO_MISSION.representative.name}`);
    doc.fillColor("#6a7482").font("Helvetica").text(DEMO_MISSION.representative.district);
    doc.moveDown(2).fillColor("#0d1f3c").font("Helvetica-Bold").text("About this packet");
    doc.moveDown(.5).fillColor("#3e4b5c").font("Helvetica").text("Students examined official congressional sources, evaluated multiple perspectives, completed a knowledge check, and wrote from their own experience. A teacher reviewed each included letter. CivicSpark does not score or reward political positions.", { lineGap: 4 });
    doc.moveDown(2).fontSize(9).fillColor("#7d8791").text(`Official bill record: ${DEMO_MISSION.bill.url}`);

    const approved = DEMO_RESPONSES.filter((response) => response.reviewStatus === "approved" && response.letter);
    for (const [index, response] of approved.entries()) {
      doc.addPage();
      doc.fillColor("#b27709").font("Helvetica-Bold").fontSize(9).text(`STUDENT LETTER ${String(index + 1).padStart(2, "0")}`, { characterSpacing: 1.1 });
      doc.moveDown(1.5).fillColor("#0d1f3c").font("Times-Bold").fontSize(20).text(`From ${response.nickname}`);
      doc.moveDown(1).fillColor("#334155").font("Helvetica").fontSize(11).text(response.letter!, { lineGap: 5 });
      doc.moveDown(2).fillColor("#7d8791").fontSize(8).text("Pseudonym shown. CivicSpark does not collect the student’s email, home address, ZIP code, school, or legal name.");
    }
    doc.end();
  });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== DEMO_MISSION.id) return Response.json({ error: "mission_not_found" }, { status: 404 });
  const pdf = await buildPacket();
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="civicspark-${DEMO_MISSION.code.toLowerCase()}-letters.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
