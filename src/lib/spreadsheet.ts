import "server-only";
import ExcelJS from "exceljs";

export type SheetRow = Record<string, string>;

// คืนค่าเป็นแถวที่ key คือชื่อหัวคอลัมน์ (แถวแรก) และ value เป็นข้อความเสมอ
export async function readSpreadsheet(file: File): Promise<SheetRow[]> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return readXlsx(buffer);
  if (name.endsWith(".csv") || name.endsWith(".txt")) return toRows(parseCsv(decodeText(buffer)));
  throw new Error("รองรับเฉพาะไฟล์ .xlsx หรือ .csv");
}

async function readXlsx(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  // exceljs ประกาศ type ของ Buffer ไว้เก่ากว่า Node รุ่นปัจจุบัน
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const table: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values: string[] = [];
    for (let c = 1; c <= sheet.columnCount; c++) values.push(cellText(row.getCell(c).value));
    table.push(values);
  });
  return toRows(table);
}

function cellText(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value) return value.richText.map((r) => r.text).join("");
    if ("text" in value) return String(value.text);
    return "";
  }
  return String(value).trim();
}

// ไฟล์ CSV จาก Excel ภาษาไทยบน Windows มักเป็น windows-874 ไม่ใช่ UTF-8
function decodeText(buffer: Buffer) {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-874").decode(buffer);
  }
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toRows(table: string[][]): SheetRow[] {
  const [header, ...body] = table;
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body
    .filter((cells) => cells.some((c) => c.trim() !== ""))
    .map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? "").trim()])));
}
