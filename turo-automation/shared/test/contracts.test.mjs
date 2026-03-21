import test from "node:test";
import assert from "node:assert/strict";
import {
  FIXTURE_NOW,
  FIXTURE_TODAY,
  createActOnApprovalUseCase,
  createActOnIncidentUseCase,
  createCreateMessageDraftUseCase,
  createDetectLateReturnsUseCase,
  createDetectTripAnomaliesUseCase,
  createFixtureContext,
  createGenerateLifecycleTasksUseCase,
  createGenerateMessageDraftsUseCase,
  createGetTodayOpsSnapshotUseCase,
  createGetTripTimelineUseCase,
  createGetVehicleUtilizationUseCase,
  createImportTripsUseCase,
  createInMemoryGuestRepository,
  createInMemoryIncidentRepository,
  createInMemoryMessageRepository,
  createInMemoryTaskRepository,
  createInMemoryTripRepository,
  createInMemoryVehicleRepository,
  renderMessageTemplate,
} from "../dist/index.js";

test("GetTodayOpsSnapshot returns the typed fixture snapshot", async () => {
  const context = createFixtureContext();
  const useCase = createGetTodayOpsSnapshotUseCase({
    tripRepository: context.tripRepository,
    taskRepository: context.taskRepository,
    incidentRepository: context.incidentRepository,
    messageRepository: context.messageRepository,
    jobRunRepository: context.jobRunRepository,
    guests: context.guests,
    vehicles: context.vehicles,
  });

  const result = await useCase.execute({
    today: FIXTURE_TODAY,
    generatedAt: FIXTURE_NOW,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.pickups.length, 1);
  assert.equal(result.data.returns.length, 2);
  assert.equal(result.data.activeIssues[0].externalTripId, "TU-1003");
  assert.equal(result.data.activeIssues[0].vehicleLabel, "Polestar 2 (9ABC123)");
  assert.equal(result.data.activeIssues[0].ownerId, "ops.lead");
  assert.equal(result.data.pendingApprovals.length, 1);
  assert.equal(result.data.overdueTasks.length, 1);
});

test("GenerateLifecycleTasks is deterministic for the fixture trip set", async () => {
  const context = createFixtureContext();
  const useCase = createGenerateLifecycleTasksUseCase({
    tripRepository: context.tripRepository,
    taskRepository: context.taskRepository,
    vehicles: context.vehicles,
  });

  const result = await useCase.execute({
    asOf: FIXTURE_NOW,
    createdBy: "test-runner",
  });

  assert.equal(result.data.createdTasks.length, 3);
  assert.deepEqual(
    result.data.createdTasks.map((task) => task.id).sort(),
    [
      "task-trip-tu-1001-pickup-check",
      "task-trip-tu-1002-return-check",
      "task-trip-tu-1003-incident-followup",
    ].sort(),
  );
});

test("DetectLateReturns creates one incident per qualifying overdue trip", async () => {
  const context = createFixtureContext();
  const useCase = createDetectLateReturnsUseCase({
    tripRepository: context.tripRepository,
    incidentRepository: context.incidentRepository,
    notifier: context.notifier,
    vehicles: context.vehicles,
  });

  const result = await useCase.execute({
    asOf: FIXTURE_NOW,
    openedBy: "test-runner",
  });

  assert.equal(result.data.incidentsCreated.length, 2);
  assert.deepEqual(
    result.data.incidentsCreated.map((incident) => incident.tripId).sort(),
    ["trip-tu-1002", "trip-tu-1003"],
  );
});

test("ImportTrips upserts guests and vehicles when repos are provided", async () => {
  const tripRepository = createInMemoryTripRepository({ trips: [], tripEvents: [] });
  const guestRepository = createInMemoryGuestRepository({ guests: [] });
  const vehicleRepository = createInMemoryVehicleRepository({ vehicles: [] });

  const importSource = {
    async readTripImportRows() {
      return [
        {
          externalTripId: "TU-9901",
          guestFullName: "Import Guest",
          guestEmail: "import@example.com",
          guestPhone: "+13105559999",
          vehicleNickname: "Test EV",
          pickupAt: "2026-04-10T10:00:00.000Z",
          returnAt: "2026-04-12T10:00:00.000Z",
          pickupLocation: "Test Location",
          returnLocation: "Test Location",
          tripStatus: "upcoming",
          deliveryRequired: false,
          tripTotalAmount: 150,
          source: "test",
        },
      ];
    },
  };

  const useCase = createImportTripsUseCase({
    tripImportSource: importSource,
    tripRepository,
    guestRepository,
    vehicleRepository,
  });

  const result = await useCase.execute({
    triggeredBy: "test-runner",
    importedAt: FIXTURE_NOW,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.importedTrips.length, 1);

  // Guest and vehicle should have been upserted
  const guests = await guestRepository.listGuests();
  assert.equal(guests.length, 1);
  assert.equal(guests[0].fullName, "Import Guest");
  assert.equal(guests[0].email, "import@example.com");

  const vehicles = await vehicleRepository.listVehicles();
  assert.equal(vehicles.length, 1);
  assert.equal(vehicles[0].nickname, "Test EV");

  // Trip references the upserted guest and vehicle
  const trips = await tripRepository.listTrips();
  assert.equal(trips[0].guestId, guests[0].id);
  assert.equal(trips[0].vehicleId, vehicles[0].id);
});

test("ActOnApproval transitions a pending approval to approved and updates draft state", async () => {
  const context = createFixtureContext();
  const noopNotifier = {
    async publishDigest() { return { accepted: false, externalId: null }; },
    async notifyApprovalRequested() { return { accepted: false, externalId: null }; },
    async notifyIncidentDetected() { return { accepted: false, externalId: null }; },
  };

  const useCase = createActOnApprovalUseCase({
    messageRepository: context.messageRepository,
    notifier: noopNotifier,
  });

  const result = await useCase.execute({
    approvalRequestId: "approval-tu-1001-pretrip",
    decision: "approved",
    reviewedBy: "test.reviewer",
    reviewedAt: FIXTURE_NOW,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.approvalRequest.status, "approved");
  assert.equal(result.data.approvalRequest.reviewedBy, "test.reviewer");
  assert.equal(result.data.draft.approvalStatus, "approved");
  assert.equal(result.data.draft.state, "ready_for_review");
});

test("ActOnIncident transitions an incident to resolved and stamps actor metadata", async () => {
  const context = createFixtureContext();
  const useCase = createActOnIncidentUseCase({
    incidentRepository: context.incidentRepository,
  });

  const result = await useCase.execute({
    incidentId: "incident-cleaning-tu-1003",
    status: "resolved",
    actedBy: "ops.manager",
    actedAt: FIXTURE_NOW,
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.incident.status, "resolved");
  assert.equal(result.data.incident.ownerId, "ops.manager");
  assert.equal(result.data.incident.resolvedAt, FIXTURE_NOW);
  assert.equal(result.data.incident.updatedAt, FIXTURE_NOW);
});

test("renderMessageTemplate pretrip_reminder contains guest name and vehicle", () => {
  const body = renderMessageTemplate({
    templateKey: "pretrip_reminder",
    guestFirstName: "Alex",
    vehicleNickname: "Polestar 2",
    externalTripId: "TU-1001",
    pickupAt: "2026-03-20T20:00:00.000Z",
    returnAt: "2026-03-22T17:00:00.000Z",
    pickupLocation: "LAX",
  });

  assert.ok(body.includes("Alex"), "body should include guest first name");
  assert.ok(body.includes("Polestar 2"), "body should include vehicle nickname");
  assert.ok(body.includes("TU-1001"), "body should include trip ID");
  assert.ok(body.includes("2026-03-20"), "body should include pickup date");
});

test("renderMessageTemplate return_reminder contains vehicle and return date", () => {
  const body = renderMessageTemplate({
    templateKey: "return_reminder",
    guestFirstName: "Maya",
    vehicleNickname: "Model Y",
    externalTripId: "TU-1002",
    pickupAt: "2026-03-18T17:00:00.000Z",
    returnAt: "2026-03-20T16:30:00.000Z",
    pickupLocation: "Santa Monica",
  });

  assert.ok(body.includes("Maya"), "body should include guest first name");
  assert.ok(body.includes("Model Y"), "body should include vehicle nickname");
  assert.ok(body.includes("2026-03-20"), "body should include return date");
});

test("CreateMessageDraft renders templated body when guests and vehicles provided", async () => {
  const tripRepository = createInMemoryTripRepository({
    trips: [
      {
        id: "trip-tu-1001",
        externalTripId: "TU-1001",
        vehicleId: "vehicle-polestar-2",
        guestId: "guest-alex-lee",
        status: "upcoming",
        pickupAt: "2026-03-20T20:00:00.000Z",
        returnAt: "2026-03-22T17:00:00.000Z",
        actualReturnAt: null,
        pickupLocation: "LAX",
        returnLocation: "LAX",
        tripTotalAmount: 286,
        deliveryRequired: true,
        source: "test",
        notes: null,
        createdAt: FIXTURE_NOW,
        updatedAt: FIXTURE_NOW,
      },
    ],
    tripEvents: [],
  });
  const messageRepository = createInMemoryMessageRepository({
    threads: [],
    drafts: [],
    approvalRequests: [],
  });
  const guests = [{ id: "guest-alex-lee", firstName: "Alex", fullName: "Alex Lee" }];
  const vehicles = [
    {
      id: "vehicle-polestar-2",
      vin: null,
      plate: "9ABC123",
      nickname: "Polestar 2",
      make: "Polestar",
      model: "2",
      year: 2024,
      status: "active",
      location: "LAX",
      odometer: null,
      fuelType: "electric",
      notes: null,
      createdAt: FIXTURE_NOW,
      updatedAt: FIXTURE_NOW,
    },
  ];

  const useCase = createCreateMessageDraftUseCase({
    tripRepository,
    messageRepository,
    guests,
    vehicles,
  });

  const result = await useCase.execute({
    tripId: "trip-tu-1001",
    templateKey: "pretrip_reminder",
    requestedBy: "test-runner",
    createdAt: FIXTURE_NOW,
  });

  assert.equal(result.ok, true);
  assert.ok(result.data.draft.body.includes("Alex"), "draft body includes guest name");
  assert.ok(result.data.draft.body.includes("Polestar 2"), "draft body includes vehicle");
  assert.ok(result.data.draft.body.includes("TU-1001"), "draft body includes trip ID");
});

test("GenerateMessageDrafts creates pretrip and return reminder drafts within window", async () => {
  // Set asOf to 18h before TU-1001 pickup so it's within 24h pre-trip window
  // TU-1001 pickup: 2026-03-20T20:00:00Z → asOf must be < 20:00 but > 20:00 - 24h = 2026-03-19T20:00Z
  // Use 2 hours before pickup: 2026-03-20T18:00:00Z (= FIXTURE_NOW)
  const asOf = FIXTURE_NOW; // 2026-03-20T18:00Z — 2h before TU-1001 pickup at 20:00Z

  const notifier = {
    async publishDigest() { return { accepted: false, externalId: null }; },
    async notifyApprovalRequested() { return { accepted: false, externalId: null }; },
    async notifyIncidentDetected() { return { accepted: false, externalId: null }; },
  };

  const tripRepository = createInMemoryTripRepository({
    trips: [
      // upcoming trip with pickup in 2h (within 24h window)
      {
        id: "trip-upcoming",
        externalTripId: "TU-UP",
        vehicleId: "v1",
        guestId: "g1",
        status: "upcoming",
        pickupAt: "2026-03-20T20:00:00.000Z",
        returnAt: "2026-03-22T20:00:00.000Z",
        actualReturnAt: null,
        pickupLocation: "LAX",
        returnLocation: "LAX",
        tripTotalAmount: 200,
        deliveryRequired: false,
        source: "test",
        notes: null,
        createdAt: asOf,
        updatedAt: asOf,
      },
      // active trip with return in 3h (within 24h window)
      {
        id: "trip-active",
        externalTripId: "TU-ACT",
        vehicleId: "v2",
        guestId: "g2",
        status: "active",
        pickupAt: "2026-03-18T10:00:00.000Z",
        returnAt: "2026-03-20T21:00:00.000Z",
        actualReturnAt: null,
        pickupLocation: "Santa Monica",
        returnLocation: "Santa Monica",
        tripTotalAmount: 150,
        deliveryRequired: false,
        source: "test",
        notes: null,
        createdAt: asOf,
        updatedAt: asOf,
      },
    ],
    tripEvents: [],
  });
  const messageRepository = createInMemoryMessageRepository({
    threads: [],
    drafts: [],
    approvalRequests: [],
  });
  const guests = [
    { id: "g1", fullName: "Alex Lee" },
    { id: "g2", fullName: "Maya Patel" },
  ];
  const vehicles = [
    { id: "v1", vin: null, plate: null, nickname: "Polestar 2", make: "Polestar", model: "2", year: 2024, status: "active", location: null, odometer: null, fuelType: null, notes: null, createdAt: asOf, updatedAt: asOf },
    { id: "v2", vin: null, plate: null, nickname: "Model Y", make: "Tesla", model: "Model Y", year: 2023, status: "active", location: null, odometer: null, fuelType: null, notes: null, createdAt: asOf, updatedAt: asOf },
  ];

  const useCase = createGenerateMessageDraftsUseCase({
    tripRepository,
    messageRepository,
    notifier,
    guests,
    vehicles,
  });

  const result = await useCase.execute({ asOf, requestedBy: "test-runner" });

  assert.equal(result.ok, true);
  assert.equal(result.data.createdDrafts.length, 2);

  const keys = result.data.createdDrafts.map((d) => d.templateKey).sort();
  assert.deepEqual(keys, ["pretrip_reminder", "return_reminder"]);

  // Pretrip body should mention the guest and vehicle
  const preTripDraft = result.data.createdDrafts.find((d) => d.templateKey === "pretrip_reminder");
  assert.ok(preTripDraft?.body.includes("Alex"), "pretrip body mentions guest");
  assert.ok(preTripDraft?.body.includes("Polestar 2"), "pretrip body mentions vehicle");

  // Running again should skip both trips (already have drafts for both)
  const result2 = await useCase.execute({ asOf, requestedBy: "test-runner" });
  assert.equal(result2.data.createdDrafts.length, 0);
  assert.equal(result2.data.skippedCount, 2); // both trips are still in window but drafts already exist
});

test("DetectTripAnomalies creates late return AND trip issue incidents", async () => {
  const notifier = {
    async publishDigest() { return { accepted: false, externalId: null }; },
    async notifyApprovalRequested() { return { accepted: false, externalId: null }; },
    async notifyIncidentDetected() { return { accepted: false, externalId: null }; },
  };

  const vehicle = { id: "v1", vin: null, plate: null, nickname: "Polestar 2", make: "Polestar", model: "2", year: 2024, status: "active", location: null, odometer: null, fuelType: null, notes: null, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW };

  const tripRepository = createInMemoryTripRepository({
    trips: [
      // Late return: active trip past its return time
      {
        id: "trip-late",
        externalTripId: "TU-LATE",
        vehicleId: "v1",
        guestId: "g1",
        status: "active",
        pickupAt: "2026-03-18T10:00:00.000Z",
        returnAt: "2026-03-20T10:00:00.000Z", // 8h before FIXTURE_NOW
        actualReturnAt: null,
        pickupLocation: "LAX",
        returnLocation: "LAX",
        tripTotalAmount: 100,
        deliveryRequired: false,
        source: "test",
        notes: null,
        createdAt: FIXTURE_NOW,
        updatedAt: FIXTURE_NOW,
      },
      // Issue status: trip still within return window (return in future) — no matching incident
      {
        id: "trip-issue",
        externalTripId: "TU-ISSUE",
        vehicleId: "v1",
        guestId: "g2",
        status: "issue",
        pickupAt: "2026-03-20T10:00:00.000Z",
        returnAt: "2026-03-21T10:00:00.000Z", // return is tomorrow — not yet late
        actualReturnAt: null,
        pickupLocation: "LAX",
        returnLocation: "LAX",
        tripTotalAmount: 120,
        deliveryRequired: false,
        source: "test",
        notes: null,
        createdAt: FIXTURE_NOW,
        updatedAt: FIXTURE_NOW,
      },
    ],
    tripEvents: [],
  });
  const incidentRepository = createInMemoryIncidentRepository({ incidents: [] });

  const useCase = createDetectTripAnomaliesUseCase({
    tripRepository,
    incidentRepository,
    notifier,
    vehicles: [vehicle],
  });

  const result = await useCase.execute({ asOf: FIXTURE_NOW, openedBy: "test-runner" });

  assert.equal(result.ok, true);
  assert.equal(result.data.incidentsCreated.length, 2);
  assert.equal(result.data.lateReturns, 1);
  assert.equal(result.data.tripIssues, 1);

  const types = result.data.incidentsCreated.map((i) => i.type).sort();
  assert.deepEqual(types, ["late_return", "other"]);
});

test("GetTripTimeline returns sorted entries from events, tasks, incidents, and drafts", async () => {
  const tripId = "trip-tu-1001";
  const tripRepository = createInMemoryTripRepository({
    trips: [
      {
        id: tripId,
        externalTripId: "TU-1001",
        vehicleId: "v1",
        guestId: "g1",
        status: "upcoming",
        pickupAt: "2026-03-20T20:00:00.000Z",
        returnAt: "2026-03-22T20:00:00.000Z",
        actualReturnAt: null,
        pickupLocation: "LAX",
        returnLocation: "LAX",
        tripTotalAmount: 200,
        deliveryRequired: false,
        source: "test",
        notes: null,
        createdAt: FIXTURE_NOW,
        updatedAt: FIXTURE_NOW,
      },
    ],
    tripEvents: [
      {
        id: "event-1",
        tripId,
        eventType: "trip_imported",
        eventTime: "2026-03-19T10:00:00.000Z",
        source: "csv",
        payload: {},
        createdAt: FIXTURE_NOW,
      },
    ],
  });

  const taskRepository = createInMemoryTaskRepository({
    tasks: [
      {
        id: "task-1",
        tripId,
        vehicleId: "v1",
        type: "prep",
        title: "Prep vehicle",
        description: null,
        status: "todo",
        priority: "high",
        assignedTo: null,
        dueAt: "2026-03-20T18:00:00.000Z",
        completedAt: null,
        createdBy: "test",
        createdAt: FIXTURE_NOW,
        updatedAt: FIXTURE_NOW,
      },
    ],
  });

  const incidentRepository = createInMemoryIncidentRepository({
    incidents: [
      {
        id: "incident-1",
        tripId,
        vehicleId: "v1",
        type: "mechanical",
        severity: "medium",
        status: "open",
        summary: "Warning light",
        details: null,
        ownerId: null,
        openedAt: "2026-03-20T15:00:00.000Z",
        resolvedAt: null,
        createdAt: FIXTURE_NOW,
        updatedAt: FIXTURE_NOW,
      },
    ],
  });

  const messageRepository = createInMemoryMessageRepository({
    threads: [],
    drafts: [
      {
        id: "draft-1",
        threadId: "thread-1",
        tripId,
        direction: "outbound",
        channel: "turo",
        body: "Hi Alex!",
        templateKey: "pretrip_reminder",
        approvalStatus: "pending",
        state: "awaiting_approval",
        requestedBy: "ops",
        createdAt: "2026-03-20T16:00:00.000Z",
        updatedAt: FIXTURE_NOW,
      },
    ],
    approvalRequests: [],
  });

  const useCase = createGetTripTimelineUseCase({
    tripRepository,
    taskRepository,
    incidentRepository,
    messageRepository,
  });

  const result = await useCase.execute({ tripId, generatedAt: FIXTURE_NOW });

  assert.equal(result.ok, true);
  assert.equal(result.data.tripId, tripId);
  assert.equal(result.data.entries.length, 4); // event + task + incident + draft

  // Should be sorted by timestamp ascending
  const timestamps = result.data.entries.map((e) => e.timestamp);
  const sorted = [...timestamps].sort();
  assert.deepEqual(timestamps, sorted, "entries should be sorted by timestamp");

  const kinds = result.data.entries.map((e) => e.kind);
  assert.ok(kinds.includes("trip_event"), "should include trip_event");
  assert.ok(kinds.includes("task"), "should include task");
  assert.ok(kinds.includes("incident"), "should include incident");
  assert.ok(kinds.includes("draft"), "should include draft");
});

test("GetVehicleUtilization computes utilization rates per vehicle", async () => {
  const windowStart = "2026-03-01T00:00:00.000Z";
  const windowEnd = "2026-03-31T00:00:00.000Z"; // 30 days

  const vehicles = [
    { id: "v1", vin: null, plate: null, nickname: "Polestar 2", make: "Polestar", model: "2", year: 2024, status: "active", location: null, odometer: null, fuelType: null, notes: null, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW },
    { id: "v2", vin: null, plate: null, nickname: "Model Y", make: "Tesla", model: "Model Y", year: 2023, status: "active", location: null, odometer: null, fuelType: null, notes: null, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW },
  ];

  const tripRepository = createInMemoryTripRepository({
    trips: [
      // 10-day trip for v1
      { id: "t1", externalTripId: "TU-1", vehicleId: "v1", guestId: "g1", status: "completed", pickupAt: "2026-03-05T00:00:00.000Z", returnAt: "2026-03-15T00:00:00.000Z", actualReturnAt: null, pickupLocation: "LAX", returnLocation: "LAX", tripTotalAmount: 300, deliveryRequired: false, source: "test", notes: null, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW },
      // 5-day trip for v2
      { id: "t2", externalTripId: "TU-2", vehicleId: "v2", guestId: "g2", status: "completed", pickupAt: "2026-03-10T00:00:00.000Z", returnAt: "2026-03-15T00:00:00.000Z", actualReturnAt: null, pickupLocation: "LAX", returnLocation: "LAX", tripTotalAmount: 150, deliveryRequired: false, source: "test", notes: null, createdAt: FIXTURE_NOW, updatedAt: FIXTURE_NOW },
    ],
    tripEvents: [],
  });

  const useCase = createGetVehicleUtilizationUseCase({ tripRepository, vehicles });
  const result = await useCase.execute({ windowStart, windowEnd, generatedAt: FIXTURE_NOW });

  assert.equal(result.ok, true);
  assert.equal(result.data.items.length, 2);

  const v1Item = result.data.items.find((i) => i.vehicleId === "v1");
  const v2Item = result.data.items.find((i) => i.vehicleId === "v2");

  assert.equal(v1Item?.utilizationDays, 10, "v1 utilization should be 10 days");
  assert.equal(v2Item?.utilizationDays, 5, "v2 utilization should be 5 days");
  assert.equal(v1Item?.totalRevenueAmount, 300);
  assert.equal(v2Item?.totalRevenueAmount, 150);

  // v1 (10/30 ≈ 0.333) should rank above v2 (5/30 ≈ 0.167)
  assert.equal(result.data.items[0]?.vehicleId, "v1", "higher utilization should rank first");
});
