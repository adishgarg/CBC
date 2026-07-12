import { google } from "googleapis";

// Use OAuth for Sheets (with separate credentials from Calendar/Tasks)
const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;

// Sheets uses OAuth authentication
if (!clientId || !clientSecret || !refreshToken) {
  throw new Error(
    "Google Sheets authentication not configured. Please set:" +
    "\nGOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN" +
    "\n(or fall back to GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)"
  );
}

console.log("Using OAuth authentication for Google Sheets");
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret
);

oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

const auth = oauth2Client;

const sheets = google.sheets({
  version: "v4",
  auth,
});

/**
 * Get data from a Google Sheet
 * Tries multiple approaches to read the sheet
 */
export async function getSheetData(
  spreadsheetId: string,
  range: string = "A:Z",
  options?: { allowFallback?: boolean }
) {
  const allowFallback = options?.allowFallback ?? true;

  try {
    let response;
    
    try {
      // First try with the provided range
      response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
    } catch (error: any) {
      if (!allowFallback) {
        throw error;
      }

      // If that fails, try to get metadata and read from first sheet
      console.log("Failed to read with default range, trying to get sheet metadata...");
      const metadataResponse = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title',
      });
      
      if (metadataResponse.data.sheets && metadataResponse.data.sheets.length > 0) {
        const firstSheetName = metadataResponse.data.sheets[0].properties?.title;
        const newRange = `'${firstSheetName}'!A:Z`;
        console.log(`Trying to read from sheet: ${firstSheetName}`);
        
        response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: newRange,
        });
      } else {
        throw error;
      }
    }

    const values = response.data.values || [];
    console.log(`Successfully read ${values.length} rows from sheet`);
    return values;
  } catch (error: any) {
    console.error("Error fetching sheet data:", error.message);
    throw new Error(`Failed to fetch sheet data: ${error.message}`);
  }
}

/**
 * Append rows to a Google Sheet range.
 */
export async function appendSheetRows(
  spreadsheetId: string,
  sheetName: string,
  rows: Array<Array<string | number | null | undefined>>,
  range: string = "A:F"
) {
  if (!rows.length) {
    return { updatedRows: 0, updatedRange: undefined as string | undefined };
  }

  const escapedSheetName = sheetName.replace(/'/g, "''");
  const targetRange = `'${escapedSheetName}'!${range}`;

  const normalizedRows = rows.map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : cell))
  );

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: targetRange,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: normalizedRows,
      },
    });

    return {
      updatedRows: response.data.updates?.updatedRows || 0,
      updatedRange: response.data.updates?.updatedRange,
    };
  } catch (error: any) {
    console.error("Error appending sheet rows:", error.message);
    throw new Error(`Failed to append sheet rows: ${error.message}`);
  }
}

/**
 * Find the header row in the sheet data
 * Looks for rows that contain common header keywords
 */
function findHeaderRow(data: any[][]): number {
  const headerKeywords = [
    'title', 'name', 'task', 'status', 'date', 'deadline', 
    'start', 'end', 'duration', 'quantity', 'amount', 'rate', 'unit',
    'proposed', 'actual', 'p.', 'a.'
  ];

  console.log(`Searching for header row in ${data.length} rows...`);

  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i];
    if (!row || row.length === 0) {
      console.log(`Row ${i + 1}: Empty or undefined`);
      continue;
    }

    // Count how many cells contain header-like keywords
    let headerCount = 0;
    const cellsWithKeywords: string[] = [];
    
    for (const cell of row) {
      if (!cell) continue;
      const cellLower = cell.toString().toLowerCase().trim();
      if (headerKeywords.some(keyword => cellLower.includes(keyword))) {
        headerCount++;
        cellsWithKeywords.push(cell.toString());
      }
    }

    console.log(`Row ${i + 1}: ${headerCount} headers found - [${cellsWithKeywords.join(', ')}]`);

    // If 2 or more cells look like headers (lowered from 3 to catch more cases)
    if (headerCount >= 2) {
      console.log(`✓ Using row ${i + 1} as header row`);
      return i;
    }
  }

  // Default to first non-empty row if no clear header found
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    if (data[i] && data[i].length > 0 && data[i].some(cell => cell)) {
      console.log(`⚠ No clear header found, using first non-empty row: ${i + 1}`);
      return i;
    }
  }
  
  console.log(`⚠ No header row found, defaulting to row 1`);
  return 0;
}

/**
 * Check if a row is likely a section header (like "1. Civil & Masonary Works")
 * Section headers typically have content only in the first few columns
 */
function isSectionHeader(row: any[], totalColumns: number): boolean {
  if (!row || row.length === 0) return true;

  // Count non-empty cells
  const nonEmptyCells = row.filter(cell => 
    cell !== null && cell !== undefined && cell !== ''
  ).length;

  // If only 1-2 cells are filled and the first cell looks like a section header
  if (nonEmptyCells <= 2 && row[0]) {
    const firstCell = row[0].toString();
    // Check if it looks like a section header (starts with number, contains words)
    if (/^[\d.]+\s+[\w\s&]+/i.test(firstCell)) {
      return true;
    }
  }

  return false;
}

/**
 * Parse dates from sheet data
 * Looks for date columns and extracts date values
 * Intelligently detects header row and handles various sheet formats
 * @param spreadsheetId - The ID of the spreadsheet
 * @param sheetName - Optional name of the specific sheet/tab to read from
 */
export async function extractDatesFromSheet(spreadsheetId: string, sheetName?: string) {
  try {
    // Construct the range with sheet name if provided
    const range = sheetName ? `'${sheetName}'!A:Z` : "A:Z";
    console.log(`Reading dates from spreadsheet ${spreadsheetId}, range: ${range}`);
    
    const data = await getSheetData(spreadsheetId, range);
    
    if (data.length === 0) {
      return [];
    }

    // DEBUG: Log first 15 rows to understand structure
    console.log('\n=== SHEET STRUCTURE DEBUG ===');
    for (let i = 0; i < Math.min(15, data.length); i++) {
      const row = data[i];
      if (row && row.length > 0) {
        // Show ALL columns of each row
        console.log(`Row ${i + 1} (${row.length} columns):`);
        row.forEach((cell: any, idx: number) => {
          if (cell !== null && cell !== undefined && cell !== '') {
            console.log(`  [${idx}]: ${String(cell).substring(0, 50)}`);
          }
        });
      } else {
        console.log(`Row ${i + 1}: Empty`);
      }
    }
    console.log('=== END DEBUG ===\n');

    // User indicated headers are at row 9 (index 8)
    // But let's still try to detect it automatically first
    let headerRowIndex = findHeaderRow(data);
    
    // If detection failed and we're at row 2, try row 8 (row 9 in spreadsheet)
    if (headerRowIndex === 1 && data.length > 8) {
      console.log('Header detection seems wrong, checking row 9 (index 8)...');
      const row9 = data[8];
      if (row9 && row9.length > 0) {
        console.log('Row 9 content:', row9);
        // Check if row 9 has date-related headers
        const hasDateHeaders = row9.some((cell: any) => {
          if (!cell) return false;
          const cellLower = String(cell).toLowerCase();
          return cellLower.includes('date') || cellLower.includes('deadline') || 
                 cellLower.includes('start') || cellLower.includes('end');
        });
        if (hasDateHeaders) {
          console.log('✓ Row 9 has date headers, using it instead');
          headerRowIndex = 8;
        }
      }
    }
    
    const headers = data[headerRowIndex];
    const rows = data.slice(headerRowIndex + 1);

    console.log(`Using headers at row ${headerRowIndex + 1}:`, headers);

    // Find columns that might contain dates (looking for keywords)
    const dateKeywords = ['date', 'deadline', 'due', 'start', 'end', 'scheduled', 'time'];
    const dateColumnIndices: number[] = [];
    const dateColumnNames: string[] = [];

    headers.forEach((header: string, index: number) => {
      if (!header) return;
      const headerLower = header.toString().toLowerCase();
      if (dateKeywords.some(keyword => headerLower.includes(keyword))) {
        dateColumnIndices.push(index);
        dateColumnNames.push(header.toString());
      }
    });

    if (dateColumnIndices.length === 0) {
      console.log("No date columns found in spreadsheet");
      return [];
    }

    console.log(`Found ${dateColumnIndices.length} date columns:`, dateColumnNames);

    // Extract dates from identified columns
    const dates: Array<{
      date: string;
      title: string;
      description: string;
      columnName: string;
      rowData: any[];
    }> = [];

    rows.forEach((row: any[], rowIndex: number) => {
      if (!row || row.length === 0) return;

      // Skip section headers
      if (isSectionHeader(row, headers.length)) {
        return;
      }

      dateColumnIndices.forEach((colIndex, i) => {
        const cellValue = row[colIndex];
        if (cellValue) {
          // Try to parse the date
          const parsedDate = parseDate(cellValue.toString());
          if (parsedDate) {
            // Use first column as title or row number
            const itemTitle = row[0] ? row[0].toString().trim() : `Row ${rowIndex + headerRowIndex + 2}`;
            
            // Skip if title is empty or looks like just numbers/section marker
            if (!itemTitle || /^[\d.]+\s*$/.test(itemTitle)) {
              return;
            }

            // Create description from first 3 columns (or fewer if not available)
            const description = row.slice(0, 3)
              .filter(cell => cell !== null && cell !== undefined && cell !== '')
              .map(cell => cell.toString().trim())
              .join(' - ');
            
            dates.push({
              date: parsedDate,
              title: `${itemTitle} - ${dateColumnNames[i]}`,
              description: description || itemTitle,
              columnName: dateColumnNames[i],
              rowData: row,
            });
          }
        }
      });
    });

    console.log(`Extracted ${dates.length} date events from sheet`);
    return dates;
  } catch (error: any) {
    console.error("Error extracting dates from sheet:", error.message);
    throw new Error(`Failed to extract dates: ${error.message}`);
  }
}

/**
 * Parse various date formats
 */
function parseDate(value: string): string | null {
  if (!value || typeof value !== 'string') return null;

  // Try various date formats
  const datePatterns = [
    // ISO format: 2024-01-25
    /^\d{4}-\d{2}-\d{2}$/,
    // US format: 01/25/2024
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,
    // European format: 25.01.2024
    /^\d{1,2}\.\d{1,2}\.\d{4}$/,
    // Month day year: Jan 25, 2024
    /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}$/,
  ];

  let date: Date | null = null;

  // Check if it matches any pattern
  if (datePatterns.some(pattern => pattern.test(value.trim()))) {
    date = new Date(value);
  } else {
    // Try parsing anyway
    date = new Date(value);
  }

  // Validate the date
  if (date && !isNaN(date.getTime())) {
    return date.toISOString();
  }

  return null;
}

/**
 * Get sheet metadata
 */
export async function getSheetMetadata(spreadsheetId: string) {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return {
      title: response.data.properties?.title,
      sheets: response.data.sheets?.map(sheet => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
      })),
    };
  } catch (error: any) {
    console.error("Error fetching sheet metadata:", error.message);
    throw new Error(`Failed to fetch sheet metadata: ${error.message}`);
  }
}
