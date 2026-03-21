import test from "node:test";
import assert from "node:assert/strict";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Import the CJS-compatible dist output
// (worker builds to dist/ via tsc before tests run)
import { createCsvTripImportSource } from "../dist/adapters/csv/tripImportSource.js";

const CSV_HEADER =
  "external_trip_id,guest_full_name,guest_email,guest_phone,vehicle_nickname," +
  "pickup_at,return_at,pickup_location,return_location,trip_status," +
  "delivery_required,trip_total_amount,source";

test("CsvTripImportSource parses a well-formed CSV file", async () => {
  const csvContent = [
    CSV_HEADER,
    "TU-9001,Sam Test,sam@example.com,+13105550001,Model Y," +
      "2026-04-01T10:00:00.000Z,2026-04-03T10:00:00.000Z," +
      "LAX Airport,Santa Monica,upcoming,false,180,csv_import",
  ].join("\n");

  const filePath = join(tmpdir(), `turo-test-${Date.now()}.csv`);
  await writeFile(filePath, csvContent, "utf-8");

  try {
    const source = createCsvTripImportSource(filePath);
    const rows = await source.readTripImportRows({
      triggeredBy: "test-runner",
    });

    assert.equal(rows.length, 1);
    const row = rows[0];
    assert.equal(row.externalTripId, "TU-9001");
    assert.equal(row.guestFullName, "Sam Test");
    assert.equal(row.guestEmail, "sam@example.com");
    assert.equal(row.vehicleNickname, "Model Y");
    assert.equal(row.tripStatus, "upcoming");
    assert.equal(row.deliveryRequired, false);
    assert.equal(row.tripTotalAmount, 180);
    assert.equal(row.source, "csv_import");
  } finally {
    await unlink(filePath).catch(() => {});
  }
});

test("CsvTripImportSource skips rows missing required fields", async () => {
  const csvContent = [
    CSV_HEADER,
    // Missing external_trip_id
    ",Jane Missing,,,,2026-04-01T10:00:00.000Z,2026-04-03T10:00:00.000Z,,,upcoming,false,,csv_import",
    // Valid row
    "TU-9002,Valid Guest,,,,2026-04-02T10:00:00.000Z,2026-04-04T10:00:00.000Z,LAX,LAX,upcoming,false,,csv_import",
  ].join("\n");

  const filePath = join(tmpdir(), `turo-test-${Date.now()}.csv`);
  await writeFile(filePath, csvContent, "utf-8");

  try {
    const source = createCsvTripImportSource(filePath);
    const rows = await source.readTripImportRows({
      triggeredBy: "test-runner",
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].externalTripId, "TU-9002");
  } finally {
    await unlink(filePath).catch(() => {});
  }
});

test("CsvTripImportSource handles delivery_required true", async () => {
  const csvContent = [
    CSV_HEADER,
    "TU-9003,Delivery Guest,,,Polestar 2,2026-04-05T10:00:00.000Z,2026-04-07T10:00:00.000Z,LAX,LAX,active,true,250,csv_import",
  ].join("\n");

  const filePath = join(tmpdir(), `turo-test-${Date.now()}.csv`);
  await writeFile(filePath, csvContent, "utf-8");

  try {
    const source = createCsvTripImportSource(filePath);
    const rows = await source.readTripImportRows({ triggeredBy: "test" });
    assert.equal(rows[0].deliveryRequired, true);
    assert.equal(rows[0].tripStatus, "active");
  } finally {
    await unlink(filePath).catch(() => {});
  }
});
