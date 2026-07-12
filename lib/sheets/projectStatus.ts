import { appendSheetRows, getSheetData } from "@/lib/sheets/googlesheets";

const DEFAULT_PROJECT_STATUS_SPREADSHEET_ID = "1bayhVCpPAOWUWZTUJ1k-OhFSBM6FC4ow57v_IVRDbw8";
const DEFAULT_PROJECT_STATUS_SHEET_NAME = "Clients";

type ProjectInputClient = {
  name?: string;
  phoneNumber?: string;
  email?: string;
};

function formatSheetTimestamp(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

function parseProjectIdFromSheetCell(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return null;
  }

  const directNumber = Number(rawValue);
  if (Number.isInteger(directNumber) && directNumber >= 0) {
    return directNumber;
  }

  const digitsMatch = rawValue.match(/\d+/);
  if (!digitsMatch) {
    return null;
  }

  const parsedNumber = Number(digitsMatch[0]);
  return Number.isInteger(parsedNumber) ? parsedNumber : null;
}

export async function getRedTimelineProjectIds(): Promise<Set<number>> {
  const spreadsheetId =
    process.env.PROJECT_STATUS_SPREADSHEET_ID || DEFAULT_PROJECT_STATUS_SPREADSHEET_ID;
  const configuredSheetName =
    process.env.PROJECT_STATUS_SHEET_NAME?.trim() || DEFAULT_PROJECT_STATUS_SHEET_NAME;

  const escapedSheetName = configuredSheetName.replace(/'/g, "''");
  const statusRange = `'${escapedSheetName}'!B:Q`;

  const rows = (await getSheetData(spreadsheetId, statusRange, {
    allowFallback: false,
  })) as unknown[][];

  const redProjectIds = new Set<number>();

  for (const row of rows) {
    const projectId = parseProjectIdFromSheetCell(row[0]);
    if (projectId === null) {
      continue;
    }

    const statusInColumnQ = String(row[15] ?? "").trim().toLowerCase();
    if (statusInColumnQ === "red") {
      redProjectIds.add(projectId);
    }
  }

  return redProjectIds;
}

export async function appendProjectInputsToStatusSheet(params: {
  projectId?: number | null;
  projectName?: string | null;
  location?: string | null;
  // Sheet-only project type label (separate from internal architecture/interior field).
  projectType?: string | null;
  clients?: ProjectInputClient[];
  timestamp?: Date;
}): Promise<void> {
  const spreadsheetId =
    process.env.PROJECT_STATUS_SPREADSHEET_ID || DEFAULT_PROJECT_STATUS_SPREADSHEET_ID;
  const configuredSheetName =
    process.env.PROJECT_STATUS_SHEET_NAME?.trim() || DEFAULT_PROJECT_STATUS_SHEET_NAME;

  const baseTimestamp = formatSheetTimestamp(params.timestamp || new Date());
  const projectId = params.projectId ?? "";
  const projectName = String(params.projectName ?? "").trim();
  const location = String(params.location ?? "").trim();
  const projectType = String(params.projectType ?? "").trim();

  const clients = (params.clients || [])
    .map((client) => ({
      name: String(client.name || "").trim(),
      phoneNumber: String(client.phoneNumber || "").trim(),
      email: String(client.email || "").trim(),
    }))
    .filter((client) => client.name || client.phoneNumber || client.email);

  // Only first client should be written to the sheet.
  const firstClient = clients[0] || { name: "", phoneNumber: "", email: "" };

  const rows: Array<Array<string | number>> = [[
    baseTimestamp,
    projectId,
    firstClient.name,
    firstClient.phoneNumber,
    firstClient.email,
    projectName,
    location,
    projectType,
  ]];

  await appendSheetRows(spreadsheetId, configuredSheetName, rows, "A:H");
}
