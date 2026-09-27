import type {
  ApprovalRequest,
  Guest,
  Incident,
  JobRun,
  MessageDraft,
  MessageThread,
  Task,
  Trip,
  TripEvent,
  TripImportRow,
  Vehicle,
} from "../domain/index.js";
import {
  createBuildDailyDigestUseCase,
  createDetectLateReturnsUseCase,
  createGenerateLifecycleTasksUseCase,
  createGetTodayOpsSnapshotUseCase,
  createImportTripsUseCase,
  createInMemoryIncidentRepository,
  createInMemoryJobRunRepository,
  createInMemoryMessageRepository,
  createInMemoryTaskRepository,
  createInMemoryTripRepository,
  type SharedFixtureContext,
} from "../application/index.js";

export const FIXTURE_TODAY = "2026-03-20";
export const FIXTURE_NOW = "2026-03-20T18:00:00.000Z";

export const fixtureVehicles: Vehicle[] = [
  {
    id: "vehicle-polestar-2",
    vin: null,
    plate: "9ABC123",
    nickname: "Polestar 2",
    make: "Polestar",
    model: "2",
    year: 2024,
    status: "active",
    location: "LAX Remote Lot",
    odometer: 18240,
    fuelType: "electric",
    notes: "Primary airport delivery vehicle.",
    createdAt: "2026-03-10T09:00:00.000Z",
    updatedAt: "2026-03-19T09:00:00.000Z",
  },
  {
    id: "vehicle-model-y",
    vin: null,
    plate: "8XYZ555",
    nickname: "Model Y",
    make: "Tesla",
    model: "Model Y",
    year: 2023,
    status: "active",
    location: "Santa Monica",
    odometer: 24190,
    fuelType: "electric",
    notes: "Preferred for local handoffs.",
    createdAt: "2026-03-10T09:10:00.000Z",
    updatedAt: "2026-03-19T09:10:00.000Z",
  },
];

export const fixtureGuests: Guest[] = [
  {
    id: "guest-alex-lee",
    firstName: "Alex",
    lastName: "Lee",
    fullName: "Alex Lee",
    phone: "+13105550101",
    email: "alex@example.com",
    driverLicenseLast4: "4421",
    rating: 4.98,
    notes: null,
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "guest-maya-patel",
    firstName: "Maya",
    lastName: "Patel",
    fullName: "Maya Patel",
    phone: "+13105550102",
    email: "maya@example.com",
    driverLicenseLast4: "7703",
    rating: 4.94,
    notes: null,
    createdAt: "2026-03-11T10:00:00.000Z",
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
  {
    id: "guest-jordan-kim",
    firstName: "Jordan",
    lastName: "Kim",
    fullName: "Jordan Kim",
    phone: "+13105550103",
    email: "jordan@example.com",
    driverLicenseLast4: "9211",
    rating: 5,
    notes: null,
    createdAt: "2026-03-12T10:00:00.000Z",
    updatedAt: "2026-03-18T10:00:00.000Z",
  },
];

export const fixtureTrips: Trip[] = [
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
    source: "manual_import",
    notes: null,
    createdAt: "2026-03-18T08:00:00.000Z",
    updatedAt: "2026-03-19T11:30:00.000Z",
  },
  {
    id: "trip-tu-1002",
    externalTripId: "TU-1002",
    vehicleId: "vehicle-model-y",
    guestId: "guest-maya-patel",
    status: "active",
    pickupAt: "2026-03-18T17:00:00.000Z",
    returnAt: "2026-03-20T16:30:00.000Z",
    actualReturnAt: null,
    pickupLocation: "Santa Monica",
    returnLocation: "Santa Monica",
    tripTotalAmount: 194,
    deliveryRequired: false,
    source: "manual_import",
    notes: "Guest requested a 15 minute grace period.",
    createdAt: "2026-03-17T08:00:00.000Z",
    updatedAt: "2026-03-20T15:40:00.000Z",
  },
  {
    id: "trip-tu-1003",
    externalTripId: "TU-1003",
    vehicleId: "vehicle-polestar-2",
    guestId: "guest-jordan-kim",
    status: "issue",
    pickupAt: "2026-03-19T16:00:00.000Z",
    returnAt: "2026-03-20T12:00:00.000Z",
    actualReturnAt: null,
    pickupLocation: "Downtown LA",
    returnLocation: "Downtown LA",
    tripTotalAmount: 149,
    deliveryRequired: false,
    source: "manual_import",
    notes: "Guest reported a warning light.",
    createdAt: "2026-03-18T13:00:00.000Z",
    updatedAt: "2026-03-20T13:30:00.000Z",
  },
];

export const fixtureTasks: Task[] = [
  {
    id: "task-existing-prep-tu-1001",
    tripId: "trip-tu-1001",
    vehicleId: "vehicle-polestar-2",
    type: "prep",
    title: "Prep Polestar 2 for pickup",
    description: "Confirm fueling, cleaning, and staging before guest arrival.",
    status: "in_progress",
    priority: "high",
    assignedTo: "ops.lead",
    dueAt: "2026-03-20T18:00:00.000Z",
    completedAt: null,
    createdBy: "seed",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T12:00:00.000Z",
  },
  {
    id: "task-overdue-admin",
    tripId: "trip-tu-1002",
    vehicleId: "vehicle-model-y",
    type: "admin",
    title: "Review return extension request",
    description: "Resolve the guest extension request before return deadline.",
    status: "todo",
    priority: "urgent",
    assignedTo: "ops.lead",
    dueAt: "2026-03-20T15:45:00.000Z",
    completedAt: null,
    createdBy: "seed",
    createdAt: "2026-03-20T12:00:00.000Z",
    updatedAt: "2026-03-20T12:00:00.000Z",
  },
];

export const fixtureIncidents: Incident[] = [
  {
    id: "incident-cleaning-tu-1003",
    tripId: "trip-tu-1003",
    vehicleId: "vehicle-polestar-2",
    type: "mechanical",
    severity: "medium",
    status: "investigating",
    summary: "Dashboard warning light reported during trip",
    details: "Awaiting guest photo and vehicle scan.",
    ownerId: "ops.lead",
    openedAt: "2026-03-20T13:45:00.000Z",
    resolvedAt: null,
    createdAt: "2026-03-20T13:45:00.000Z",
    updatedAt: "2026-03-20T14:00:00.000Z",
  },
];

export const fixtureMessageThreads: MessageThread[] = [
  {
    id: "thread-tu-1001",
    tripId: "trip-tu-1001",
    guestId: "guest-alex-lee",
    channel: "turo",
    status: "awaiting_approval",
    lastMessageAt: "2026-03-20T16:00:00.000Z",
    ownerId: "ops.coordinator",
    createdAt: "2026-03-20T15:50:00.000Z",
    updatedAt: "2026-03-20T16:00:00.000Z",
  },
];

export const fixtureMessageDrafts: MessageDraft[] = [
  {
    id: "draft-tu-1001-pretrip",
    threadId: "thread-tu-1001",
    tripId: "trip-tu-1001",
    direction: "outbound",
    channel: "turo",
    body: "Hi Alex, your vehicle is staged and ready. Please review pickup photos before check-in.",
    templateKey: "pre_trip_ready",
    approvalStatus: "pending",
    state: "awaiting_approval",
    requestedBy: "ops.coordinator",
    createdAt: "2026-03-20T15:55:00.000Z",
    updatedAt: "2026-03-20T16:00:00.000Z",
  },
];

export const fixtureApprovalRequests: ApprovalRequest[] = [
  {
    id: "approval-tu-1001-pretrip",
    draftId: "draft-tu-1001-pretrip",
    tripId: "trip-tu-1001",
    status: "pending",
    requestedBy: "ops.coordinator",
    reviewedBy: null,
    requestedAt: "2026-03-20T16:00:00.000Z",
    reviewedAt: null,
    notes: "Confirm pickup wording before handoff.",
  },
];

export const fixtureTripEvents: TripEvent[] = [
  {
    id: "trip-event-tu-1001-import",
    tripId: "trip-tu-1001",
    eventType: "trip_imported",
    eventTime: "2026-03-19T11:30:00.000Z",
    source: "manual_import",
    payload: {
      externalTripId: "TU-1001",
      tripStatus: "upcoming",
    },
    createdAt: "2026-03-19T11:30:00.000Z",
  },
  {
    id: "trip-event-tu-1002-active",
    tripId: "trip-tu-1002",
    eventType: "trip_imported",
    eventTime: "2026-03-20T15:40:00.000Z",
    source: "manual_import",
    payload: {
      externalTripId: "TU-1002",
      tripStatus: "active",
    },
    createdAt: "2026-03-20T15:40:00.000Z",
  },
];

export const fixtureJobRuns: JobRun[] = [
  {
    id: "job-run-snapshot",
    jobName: "today_ops_snapshot",
    status: "completed",
    startedAt: "2026-03-20T17:00:00.000Z",
    finishedAt: "2026-03-20T17:00:02.000Z",
    summary: "Snapshot generated from fixture repositories.",
    issueCount: 1,
  },
  {
    id: "job-run-late-return",
    jobName: "late_return_scan",
    status: "failed",
    startedAt: "2026-03-20T17:10:00.000Z",
    finishedAt: "2026-03-20T17:10:04.000Z",
    summary: "Notifier adapter was stubbed, follow-up required.",
    issueCount: 1,
  },
];

export const fixtureTripImportRows: TripImportRow[] = [
  {
    externalTripId: "TU-1004",
    guestFullName: "Taylor Brooks",
    guestEmail: "taylor@example.com",
    guestPhone: "+13105550104",
    vehicleNickname: "Model Y",
    pickupAt: "2026-03-21T18:00:00.000Z",
    returnAt: "2026-03-23T18:00:00.000Z",
    pickupLocation: "Santa Monica",
    returnLocation: "Santa Monica",
    tripStatus: "upcoming",
    deliveryRequired: false,
    tripTotalAmount: 211,
    source: "fixture_import",
  },
];

export function createFixtureContext(): SharedFixtureContext {
  return {
    vehicles: fixtureVehicles,
    guests: fixtureGuests.map((guest) => ({
      id: guest.id,
      fullName: guest.fullName,
    })),
    tripRepository: createInMemoryTripRepository({
      trips: fixtureTrips,
      tripEvents: fixtureTripEvents,
    }),
    taskRepository: createInMemoryTaskRepository({
      tasks: fixtureTasks,
    }),
    incidentRepository: createInMemoryIncidentRepository({
      incidents: fixtureIncidents,
    }),
    messageRepository: createInMemoryMessageRepository({
      threads: fixtureMessageThreads,
      drafts: fixtureMessageDrafts,
      approvalRequests: fixtureApprovalRequests,
    }),
    jobRunRepository: createInMemoryJobRunRepository({
      jobRuns: fixtureJobRuns,
    }),
    tripImportSource: {
      async readTripImportRows() {
        return JSON.parse(JSON.stringify(fixtureTripImportRows));
      },
    },
    notifier: {
      async publishDigest() {
        return {
          accepted: true,
          externalId: "fixture-digest",
        };
      },
      async notifyApprovalRequested() {
        return {
          accepted: true,
          externalId: "fixture-approval",
        };
      },
      async notifyIncidentDetected() {
        return {
          accepted: true,
          externalId: "fixture-incident",
        };
      },
    },
    browserAssistPort: {
      async openTripReview() {
        return {
          opened: true,
          sessionId: "fixture-trip-review",
        };
      },
      async openMessageReview() {
        return {
          opened: true,
          sessionId: "fixture-message-review",
        };
      },
    },
  };
}

export async function getFixtureTodayOpsSnapshot() {
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

  return useCase.execute({
    today: FIXTURE_TODAY,
    generatedAt: FIXTURE_NOW,
  });
}

export async function runFixtureLifecycleTasks() {
  const context = createFixtureContext();
  const useCase = createGenerateLifecycleTasksUseCase({
    tripRepository: context.tripRepository,
    taskRepository: context.taskRepository,
    vehicles: context.vehicles,
  });

  return useCase.execute({
    asOf: FIXTURE_NOW,
    createdBy: "fixture-worker",
  });
}

export async function runFixtureLateReturnScan() {
  const context = createFixtureContext();
  const useCase = createDetectLateReturnsUseCase({
    tripRepository: context.tripRepository,
    incidentRepository: context.incidentRepository,
    notifier: context.notifier,
    vehicles: context.vehicles,
  });

  return useCase.execute({
    asOf: FIXTURE_NOW,
    openedBy: "fixture-worker",
  });
}

export async function runFixtureDailyDigest() {
  const context = createFixtureContext();
  const getTodayOpsSnapshot = createGetTodayOpsSnapshotUseCase({
    tripRepository: context.tripRepository,
    taskRepository: context.taskRepository,
    incidentRepository: context.incidentRepository,
    messageRepository: context.messageRepository,
    jobRunRepository: context.jobRunRepository,
    guests: context.guests,
    vehicles: context.vehicles,
  });
  const useCase = createBuildDailyDigestUseCase({
    getTodayOpsSnapshot,
    notifier: context.notifier,
  });

  return useCase.execute({
    today: FIXTURE_TODAY,
    generatedAt: FIXTURE_NOW,
    channel: "slack://host-ops",
  });
}

export async function runFixtureTripImport() {
  const context = createFixtureContext();
  const useCase = createImportTripsUseCase({
    tripImportSource: context.tripImportSource,
    tripRepository: context.tripRepository,
  });

  return useCase.execute({
    triggeredBy: "fixture-worker",
    importedAt: FIXTURE_NOW,
  });
}
