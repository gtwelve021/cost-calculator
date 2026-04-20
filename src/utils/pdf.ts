interface QuotePdfData {
  leadName: string;
  email: string;
  phone: string;
  residenceCountry: string;
  licenseName: string;
  durationYears: number;
  shareholderCount: number;
  activities: string[];
  investorVisa: boolean;
  employeeVisas: number;
  dependentVisas: number;
  applicantsInsideUae: number;
  addOns: string[];
  totalAed: number;
  isMainland: boolean;
}

interface PdfRow {
  label: string;
  value: string;
}

interface PdfSection {
  title: string;
  rows: PdfRow[];
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const LABEL_WIDTH = 150;
const VALUE_X = MARGIN_X + LABEL_WIDTH + 16;
const ROW_LINE_HEIGHT = 13;
const ROW_GAP = 24;
const SECTION_TOP_PADDING = 24;
const SECTION_TITLE_GAP = 24;
const SECTION_BOTTOM_PADDING = 8;

function escapePdfText(value: string): string {
  const asciiValue = value.replace(/[^\x20-\x7E]/g, "?");

  return asciiValue
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value: string, maxCharsPerLine: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return ["-"];
  }

  const lines: string[] = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const word = words[index];
    const next = `${current} ${word}`;

    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  lines.push(current);
  return lines;
}

function textCommand(
  x: number,
  y: number,
  text: string,
  font: "F1" | "F2",
  size: number,
  color: [number, number, number],
): string {
  return `BT /${font} ${size} Tf ${color[0]} ${color[1]} ${color[2]} rg ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function fillRectCommand(
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
): string {
  return `${color[0]} ${color[1]} ${color[2]} rg ${x} ${y} ${width} ${height} re f`;
}

function strokeRectCommand(
  x: number,
  y: number,
  width: number,
  height: number,
  color: [number, number, number],
): string {
  return `${color[0]} ${color[1]} ${color[2]} RG 1 w ${x} ${y} ${width} ${height} re S`;
}

function lineCommand(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: [number, number, number],
): string {
  return `${color[0]} ${color[1]} ${color[2]} RG 1 w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function getSectionHeight(section: PdfSection): number {
  let rowsHeight = 0;

  for (let index = 0; index < section.rows.length; index += 1) {
    const row = section.rows[index];
    const valueLines = wrapText(row.value, 56);
    rowsHeight += Math.max(1, valueLines.length) * ROW_LINE_HEIGHT;
    if (index < section.rows.length - 1) {
      rowsHeight += ROW_GAP;
    }
  }

  return (
    SECTION_TOP_PADDING +
    SECTION_TITLE_GAP +
    rowsHeight +
    SECTION_BOTTOM_PADDING
  );
}

function renderSection(commands: string[], topY: number, section: PdfSection): number {
  const sectionHeight = getSectionHeight(section);
  const bottomY = topY - sectionHeight;

  commands.push(fillRectCommand(MARGIN_X, bottomY, CONTENT_WIDTH, sectionHeight, [0.98, 0.99, 1]));
  commands.push(strokeRectCommand(MARGIN_X, bottomY, CONTENT_WIDTH, sectionHeight, [0.85, 0.9, 0.96]));
  commands.push(
    textCommand(
      MARGIN_X + 14,
      topY - SECTION_TOP_PADDING,
      section.title,
      "F2",
      12,
      [0.12, 0.25, 0.45],
    ),
  );

  let rowY = topY - SECTION_TOP_PADDING - SECTION_TITLE_GAP;

  for (let index = 0; index < section.rows.length; index += 1) {
    const row = section.rows[index];
    const valueLines = wrapText(row.value, 56);

    commands.push(textCommand(MARGIN_X + 14, rowY, `${row.label}:`, "F2", 10, [0.35, 0.42, 0.5]));

    for (let lineIndex = 0; lineIndex < valueLines.length; lineIndex += 1) {
      commands.push(
        textCommand(
          VALUE_X,
          rowY - lineIndex * ROW_LINE_HEIGHT,
          valueLines[lineIndex],
          "F1",
          10,
          [0.1, 0.12, 0.15],
        ),
      );
    }

    const rowHeight = Math.max(1, valueLines.length) * ROW_LINE_HEIGHT;
    if (index < section.rows.length - 1) {
      const separatorY = rowY - rowHeight - ROW_GAP / 2 + 2;
      commands.push(
        lineCommand(
          MARGIN_X + 14,
          separatorY,
          MARGIN_X + CONTENT_WIDTH - 14,
          separatorY,
          [0.9, 0.93, 0.97],
        ),
      );
    }

    rowY -= rowHeight + ROW_GAP;
  }

  return bottomY - 18;
}

function buildPdfContent(data: QuotePdfData): string {
  const issuedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const commands: string[] = [];

  commands.push(fillRectCommand(0, 0, PAGE_WIDTH, PAGE_HEIGHT, [1, 1, 1]));
  commands.push(fillRectCommand(MARGIN_X, PAGE_HEIGHT - 110, CONTENT_WIDTH, 70, [0.1, 0.18, 0.3]));
  commands.push(textCommand(MARGIN_X + 18, PAGE_HEIGHT - 78, "Business Setup Submission", "F2", 18, [1, 1, 1]));
  commands.push(
    textCommand(
      MARGIN_X + 18,
      PAGE_HEIGHT - 96,
      `Generated on ${issuedDate}`,
      "F1",
      10,
      [0.82, 0.89, 0.98],
    ),
  );

  const leadSection: PdfSection = {
    title: "Lead Details",
    rows: [
      { label: "Full Name", value: data.leadName || "-" },
      { label: "Email", value: data.email || "-" },
      { label: "Phone", value: data.phone || "-" },
      { label: "Country of Residence", value: data.residenceCountry || "-" },
    ],
  };

  const setupSection: PdfSection = {
    title: "Setup Summary",
    rows: [
      { label: "Jurisdiction", value: data.licenseName || "-" },
      { label: "License Duration", value: `${data.durationYears} year(s)` },
      { label: "Shareholders", value: String(data.shareholderCount) },
      {
        label: "Activities",
        value: data.activities.length ? data.activities.join(", ") : "-",
      },
      { label: "Investor Visa", value: data.investorVisa ? "Yes" : "No" },
      { label: "Employee Visas", value: String(data.employeeVisas) },
      { label: "Dependent Visas", value: String(data.dependentVisas) },
      { label: "Applicants Inside UAE", value: String(data.applicantsInsideUae) },
      { label: "Add-ons", value: data.addOns.length ? data.addOns.join(", ") : "-" },
      { label: "Mainland Consultation", value: data.isMainland ? "Yes" : "No" },
    ],
  };

  let currentTopY = PAGE_HEIGHT - 130;
  currentTopY = renderSection(commands, currentTopY, leadSection);
  currentTopY = renderSection(commands, currentTopY, setupSection);

  const totalBoxHeight = 58;
  const totalBoxBottomY = Math.max(44, currentTopY - totalBoxHeight);
  commands.push(fillRectCommand(MARGIN_X, totalBoxBottomY, CONTENT_WIDTH, totalBoxHeight, [0.1, 0.18, 0.3]));
  commands.push(textCommand(MARGIN_X + 16, totalBoxBottomY + 34, "Grand Total (AED)", "F2", 12, [0.82, 0.89, 0.98]));
  commands.push(
    textCommand(
      MARGIN_X + 16,
      totalBoxBottomY + 14,
      data.totalAed.toLocaleString("en-US"),
      "F2",
      18,
      [1, 1, 1],
    ),
  );

  return commands.join("\n");
}

function toPdfDocument(contentStream: string): string {
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const xrefOffsets = [0];

  for (const obj of objects) {
    xrefOffsets.push(pdf.length);
    pdf += obj;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < xrefOffsets.length; index += 1) {
    pdf += `${String(xrefOffsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

function makeFilename(name: string): string {
  const normalizedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const safeName = normalizedName || "lead";
  const date = new Date().toISOString().slice(0, 10);

  return `quote-form-${safeName}-${date}.pdf`;
}

export function downloadQuotePdf(data: QuotePdfData): void {
  const content = buildPdfContent(data);
  const blob = new Blob([toPdfDocument(content)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = makeFilename(data.leadName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
