import { readFile } from "node:fs/promises";
import type { TripImportRow, TripStatus } from "@turo-automation/shared";
import type { TripImportSource } from "@turo-automation/shared";

/**
 * CSV-backed TripImportSource.
 *
 * Expected column headers (case-insensitive, order-independent):
 *   external_trip_id, guest_full_name, guest_email, guest_phone,
 *   vehicle_nickname, pickup_at, return_at, pickup_location,
 *   return_location, trip_status, delivery_required,
 *   trip_total_amount, source
 *
 * Created by `createCsvTripImportSource(filePath)` or by
 * `createEnvCsvTripImportSource()` which reads TRIP_IMPORT_CSV_PATH.
 */

type CsvRow = Record<string, string>;

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

/**
 * Minimal CSV line splitter that handles double-quoted fields.
 * Not a full RFC 4180 parser — sufficient for the expected Turo export format.
 */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function rowToImportRow(r: CsvRow): TripImportRow | null {
  const externalTripId = r["external_trip_id"] ?? "";
  const pickupAt = r["pickup_at"] ?? "";
  const returnAt = r["return_at"] ?? "";
  if (!externalTripId || !pickupAt || !returnAt) return null;

  const rawStatus = (r["trip_status"] ?? "upcoming").toLowerCase();
  const tripStatus: TripStatus =
    rawStatus === "active" ||
    rawStatus === "completed" ||
    rawStatus === "cancelled" ||
    rawStatus === "issue"
      ? (rawStatus as TripStatus)
      : "upcoming";

  const rawAmount = r["trip_total_amount"] ?? "";
  const tripTotalAmount = rawAmount ? parseFloat(rawAmount) : null;

  return {
    externalTripId,
    guestFullName: r["guest_full_name"] ?? "Unknown Guest",
    guestEmail: r["guest_email"] || null,
    guestPhone: r["guest_phone"] || null,
    vehicleNickname: r["vehicle_nickname"] ?? "Unknown Vehicle",
    pickupAt,
    returnAt,
    pickupLocation: r["pickup_location"] ?? "",
    returnLocation: r["return_location"] ?? "",
    tripStatus,
    deliveryRequired: (r["delivery_required"] ?? "").toLowerCase() === "true",
    tripTotalAmount: isNaN(tripTotalAmount!) ? null : tripTotalAmount,
    source: r["source"] || "csv_import",
  };
}

export function createCsvTripImportSource(filePath: string): TripImportSource {
  return {
    async readTripImportRows() {
      const text = await readFile(filePath, "utf-8");
      const csvRows = parseCsv(text);
      const importRows: TripImportRow[] = [];
      for (const row of csvRows) {
        const importRow = rowToImportRow(row);
        if (importRow) importRows.push(importRow);
      }
      return importRows;
    },
  };
}

/**
 * Read TRIP_IMPORT_CSV_PATH from env; return a no-op source when absent.
 */
export function createEnvCsvTripImportSource(): TripImportSource {
  const csvPath = process.env["TRIP_IMPORT_CSV_PATH"];
  if (!csvPath) {
    return {
      async readTripImportRows() {
        return [];
      },
    };
  }
  return createCsvTripImportSource(csvPath);
}
