import type {
  ApprovalRequest,
  ApprovalStatus,
  Guest,
  Incident,
  ISODateString,
  JobName,
  JobRun,
  JobStatus,
  MessageDraft,
  MessageThread,
  MessageState,
  Task,
  TaskPriority,
  TaskType,
  Trip,
  TripEvent,
  TripImportRow,
  TripStatus,
  Vehicle,
} from "../domain/index.js";
import type {
  BrowserAssistPort,
  GuestRepository,
  IncidentRepository,
  JobRunRepository,
  MessageRepository,
  OpsNotifier,
  TaskRepository,
  TripImportSource,
  TripRepository,
  VehicleRepository,
} from "../ports/index.js";

export type UseCaseSeverity = "info" | "warning" | "error";

export interface UseCaseIssue {
  code: string;
  message: string;
  severity: UseCaseSeverity;
  entityType?: string;
  entityId?: string;
}

export interface UseCaseResult<TData> {
  ok: boolean;
  data: TData;
  issues: UseCaseIssue[];
  meta: {
    generatedAt: ISODateString;
  };
}

export interface TodayOpsTripItem {
  tripId: string;
  externalTripId: string;
  vehicleLabel: string;
  guestLabel: string;
  tripStatus: TripStatus;
  pickupAt: ISODateString;
  returnAt: ISODateString;
  needsDelivery: boolean;
}

export interface TodayOpsIncidentItem {
  incidentId: string;
  tripId: string | null;
  externalTripId: string | null;
  vehicleLabel: string;
  summary: string;
  severity: Incident["severity"];
  status: Incident["status"];
  ownerId: string | null;
  openedAt: ISODateString;
}

export interface TodayOpsApprovalItem {
  approvalRequestId: string;
  draftId: string;
  tripId: string;
  status: ApprovalRequest["status"];
  requestedBy: string;
  requestedAt: ISODateString;
}

export interface WorkerHealthItem {
  jobName: JobName;
  status: JobStatus;
  finishedAt: ISODateString | null;
  summary: string;
  issueCount: number;
}

export interface TodayOpsSnapshot {
  generatedAt: ISODateString;
  pickups: TodayOpsTripItem[];
  returns: TodayOpsTripItem[];
  activeIssues: TodayOpsIncidentItem[];
  pendingApprovals: TodayOpsApprovalItem[];
  overdueTasks: Task[];
  workerHealth: WorkerHealthItem[];
  summary: {
    pickupCount: number;
    returnCount: number;
    activeIssueCount: number;
    pendingApprovalCount: number;
    overdueTaskCount: number;
  };
}

export interface ImportTripsInput {
  triggeredBy: string;
  sourceRunId?: string;
  importedAt: ISODateString;
}

export interface ImportTripsData {
  rowsRead: number;
  importedTrips: Trip[];
  importedTripEvents: TripEvent[];
}

export interface GenerateLifecycleTasksInput {
  asOf: ISODateString;
  createdBy: string;
}

export interface GenerateLifecycleTasksData {
  createdTasks: Task[];
  existingTasks: Task[];
}

export interface CreateMessageDraftInput {
  tripId: string;
  templateKey: string;
  requestedBy: string;
  createdAt: ISODateString;
}

export interface CreateMessageDraftData {
  draft: MessageDraft | null;
}

export interface RequestApprovalInput {
  draftId: string;
  tripId: string;
  requestedBy: string;
  requestedAt: ISODateString;
}

export interface RequestApprovalData {
  approvalRequest: ApprovalRequest | null;
}

export interface DetectLateReturnsInput {
  asOf: ISODateString;
  openedBy: string;
}

export interface DetectLateReturnsData {
  incidentsCreated: Incident[];
}

export interface BuildDailyDigestInput {
  today: string;
  generatedAt: ISODateString;
  channel: string;
}

export interface BuildDailyDigestData {
  snapshot: TodayOpsSnapshot;
  summary: string;
  notificationAccepted: boolean;
}

export interface GetTodayOpsSnapshotInput {
  today: string;
  generatedAt: ISODateString;
}

export interface GetTodayOpsSnapshotUseCase {
  execute(
    input: GetTodayOpsSnapshotInput,
  ): Promise<UseCaseResult<TodayOpsSnapshot>>;
}

export interface ImportTripsUseCase {
  execute(input: ImportTripsInput): Promise<UseCaseResult<ImportTripsData>>;
}

export interface GenerateLifecycleTasksUseCase {
  execute(
    input: GenerateLifecycleTasksInput,
  ): Promise<UseCaseResult<GenerateLifecycleTasksData>>;
}

export interface CreateMessageDraftUseCase {
  execute(
    input: CreateMessageDraftInput,
  ): Promise<UseCaseResult<CreateMessageDraftData>>;
}

export interface RequestApprovalUseCase {
  execute(
    input: RequestApprovalInput,
  ): Promise<UseCaseResult<RequestApprovalData>>;
}

export interface DetectLateReturnsUseCase {
  execute(
    input: DetectLateReturnsInput,
  ): Promise<UseCaseResult<DetectLateReturnsData>>;
}

export interface BuildDailyDigestUseCase {
  execute(
    input: BuildDailyDigestInput,
  ): Promise<UseCaseResult<BuildDailyDigestData>>;
}

export interface ActOnApprovalInput {
  approvalRequestId: string;
  decision: "approved" | "rejected";
  reviewedBy: string;
  reviewedAt: ISODateString;
  notes?: string;
}

export interface ActOnApprovalData {
  approvalRequest: ApprovalRequest;
  draft: MessageDraft;
}

export interface ActOnApprovalUseCase {
  execute(
    input: ActOnApprovalInput,
  ): Promise<UseCaseResult<ActOnApprovalData>>;
}

export interface SendApprovedMessageDraftsInput {
  triggeredBy: string;
  sentAt: ISODateString;
}

export interface SendApprovedMessageDraftsData {
  triggeredBy: string;
  sentDrafts: MessageDraft[];
  sentThreads: MessageThread[];
  skippedCount: number;
}

export interface SendApprovedMessageDraftsUseCase {
  execute(
    input: SendApprovedMessageDraftsInput,
  ): Promise<UseCaseResult<SendApprovedMessageDraftsData>>;
}

export interface ActOnIncidentInput {
  incidentId: string;
  status: Incident["status"];
  actedBy: string;
  actedAt: ISODateString;
}

export interface ActOnIncidentData {
  incident: Incident;
}

export interface ActOnIncidentUseCase {
  execute(
    input: ActOnIncidentInput,
  ): Promise<UseCaseResult<ActOnIncidentData>>;
}

export interface GenerateMessageDraftsInput {
  asOf: ISODateString;
  requestedBy: string;
  /** Hours before pickup to generate a pre-trip reminder (default: 24) */
  preTripWindowHours?: number;
  /** Hours before return to generate a return reminder (default: 24) */
  returnWindowHours?: number;
}

export interface GenerateMessageDraftsData {
  createdDrafts: MessageDraft[];
  skippedCount: number;
}

export interface GenerateMessageDraftsUseCase {
  execute(
    input: GenerateMessageDraftsInput,
  ): Promise<UseCaseResult<GenerateMessageDraftsData>>;
}

export type TimelineEventKind = "trip_event" | "task" | "incident" | "draft";

export interface TripTimelineEntry {
  kind: TimelineEventKind;
  id: string;
  timestamp: ISODateString;
  label: string;
  detail: string | null;
}

export interface GetTripTimelineInput {
  tripId: string;
  generatedAt: ISODateString;
}

export interface GetTripTimelineData {
  tripId: string;
  entries: TripTimelineEntry[];
}

export interface GetTripTimelineUseCase {
  execute(
    input: GetTripTimelineInput,
  ): Promise<UseCaseResult<GetTripTimelineData>>;
}

export interface VehicleUtilizationItem {
  vehicleId: string;
  vehicleNickname: string;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  totalRevenueAmount: number;
  utilizationDays: number;
  /** Total calendar days in the window */
  windowDays: number;
  /** Ratio of utilizationDays / windowDays (0–1) */
  utilizationRate: number;
}

export interface GetVehicleUtilizationInput {
  windowStart: ISODateString;
  windowEnd: ISODateString;
  generatedAt: ISODateString;
}

export interface GetVehicleUtilizationData {
  items: VehicleUtilizationItem[];
  windowStart: ISODateString;
  windowEnd: ISODateString;
}

export interface GetVehicleUtilizationUseCase {
  execute(
    input: GetVehicleUtilizationInput,
  ): Promise<UseCaseResult<GetVehicleUtilizationData>>;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeResult<TData>(
  data: TData,
  issues: UseCaseIssue[],
  generatedAt: ISODateString,
): UseCaseResult<TData> {
  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    data,
    issues,
    meta: {
      generatedAt,
    },
  };
}

function dayPrefix(value: ISODateString): string {
  return value.slice(0, 10);
}

function minutesBefore(iso: ISODateString, minutes: number): ISODateString {
  return new Date(Date.parse(iso) - minutes * 60_000).toISOString();
}

function minutesAfter(iso: ISODateString, minutes: number): ISODateString {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

function stableId(parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findVehicle(vehicles: Vehicle[], vehicleId: string): Vehicle | undefined {
  return vehicles.find((vehicle) => vehicle.id === vehicleId);
}

function buildTripLabel(
  trip: Trip,
  guestsById: Map<string, string>,
  vehiclesById: Map<string, string>,
): TodayOpsTripItem {
  return {
    tripId: trip.id,
    externalTripId: trip.externalTripId,
    vehicleLabel: vehiclesById.get(trip.vehicleId) ?? trip.vehicleId,
    guestLabel: guestsById.get(trip.guestId) ?? trip.guestId,
    tripStatus: trip.status,
    pickupAt: trip.pickupAt,
    returnAt: trip.returnAt,
    needsDelivery: trip.deliveryRequired,
  };
}

export interface MessageTemplateContext {
  templateKey: string;
  guestFirstName: string;
  vehicleNickname: string;
  externalTripId: string;
  pickupAt: ISODateString;
  returnAt: ISODateString;
  pickupLocation: string;
}

export function renderMessageTemplate(ctx: MessageTemplateContext): string {
  const pickupDate = ctx.pickupAt.slice(0, 10);
  const returnDate = ctx.returnAt.slice(0, 10);

  switch (ctx.templateKey) {
    case "pretrip_reminder":
      return [
        `Hi ${ctx.guestFirstName}! This is a quick reminder that your Turo trip (${ctx.externalTripId}) is coming up.`,
        ``,
        `Vehicle: ${ctx.vehicleNickname}`,
        `Pickup: ${pickupDate} at ${ctx.pickupLocation}`,
        `Return: ${returnDate}`,
        ``,
        `Please review the trip details and let us know if you have any questions. Drive safe!`,
      ].join("\n");

    case "return_reminder":
      return [
        `Hi ${ctx.guestFirstName}! Just a reminder that your ${ctx.vehicleNickname} (trip ${ctx.externalTripId}) is due back on ${returnDate}.`,
        ``,
        `Return location: ${ctx.pickupLocation}`,
        ``,
        `Please ensure the vehicle is returned on time and in good condition. Thank you!`,
      ].join("\n");

    case "incident_notice":
      return [
        `Hi ${ctx.guestFirstName}, we wanted to follow up regarding your recent trip (${ctx.externalTripId}) with ${ctx.vehicleNickname}.`,
        ``,
        `Our team will be in touch to discuss the details. Please respond to this message or call us if you have questions.`,
      ].join("\n");

    default:
      return `[${ctx.templateKey}] Trip ${ctx.externalTripId} — ${ctx.vehicleNickname} — ${ctx.guestFirstName}`;
  }
}

function buildDigestText(snapshot: TodayOpsSnapshot): string {
  return [
    `Turo ops digest for ${snapshot.generatedAt.slice(0, 10)}`,
    `Pickups: ${snapshot.summary.pickupCount}`,
    `Returns: ${snapshot.summary.returnCount}`,
    `Active issues: ${snapshot.summary.activeIssueCount}`,
    `Pending approvals: ${snapshot.summary.pendingApprovalCount}`,
    `Overdue tasks: ${snapshot.summary.overdueTaskCount}`,
  ].join("\n");
}

function taskTemplateForTrip(
  trip: Trip,
  vehiclesById: Map<string, Vehicle>,
): Array<{
  type: TaskType;
  title: string;
  description: string;
  dueAt: ISODateString;
  priority: TaskPriority;
}> {
  const vehicle = vehiclesById.get(trip.vehicleId);
  const vehicleLabel = vehicle?.nickname ?? trip.vehicleId;
  const templates: Array<{
    type: TaskType;
    title: string;
    description: string;
    dueAt: ISODateString;
    priority: TaskPriority;
  }> = [];

  if (trip.status === "upcoming") {
    templates.push({
      type: "prep",
      title: `Prep ${vehicleLabel} for pickup`,
      description: "Confirm fueling, cleaning, and staging before guest arrival.",
      dueAt: minutesBefore(trip.pickupAt, 120),
      priority: "high",
    });
    templates.push({
      type: "pickup_check",
      title: `Pickup check for ${vehicleLabel}`,
      description: "Verify photos, key handoff instructions, and trip readiness.",
      dueAt: trip.pickupAt,
      priority: trip.deliveryRequired ? "urgent" : "high",
    });
  }

  if (trip.status === "active") {
    templates.push({
      type: "return_check",
      title: `Return check for ${vehicleLabel}`,
      description: "Review expected return status, photos, and guest notes.",
      dueAt: trip.returnAt,
      priority: "high",
    });
  }

  if (trip.status === "completed") {
    templates.push({
      type: "cleaning",
      title: `Turn around ${vehicleLabel}`,
      description: "Clean, refuel, and reset the vehicle after trip completion.",
      dueAt: minutesAfter(trip.actualReturnAt ?? trip.returnAt, 45),
      priority: "medium",
    });
  }

  if (trip.status === "issue") {
    templates.push({
      type: "incident_followup",
      title: `Investigate issue on ${vehicleLabel}`,
      description: "Coordinate host follow-up and collect supporting evidence.",
      dueAt: trip.returnAt,
      priority: "urgent",
    });
  }

  return templates;
}

export function buildTodayOpsSnapshotModel(input: {
  today: string;
  generatedAt: ISODateString;
  trips: Trip[];
  tasks: Task[];
  incidents: Incident[];
  approvalRequests: ApprovalRequest[];
  jobRuns: JobRun[];
  guests: Array<{ id: string; fullName: string }>;
  vehicles: Vehicle[];
}): UseCaseResult<TodayOpsSnapshot> {
  const guestsById = new Map(
    input.guests.map((guest) => [guest.id, guest.fullName] as const),
  );
  const vehiclesById = new Map(
    input.vehicles.map(
      (vehicle) => [vehicle.id, `${vehicle.nickname} (${vehicle.plate ?? "no plate"})`] as const,
    ),
  );
  const tripsById = new Map(input.trips.map((trip) => [trip.id, trip] as const));

  const pickups = input.trips
    .filter((trip) => dayPrefix(trip.pickupAt) === input.today)
    .map((trip) => buildTripLabel(trip, guestsById, vehiclesById));
  const returns = input.trips
    .filter((trip) => dayPrefix(trip.returnAt) === input.today)
    .map((trip) => buildTripLabel(trip, guestsById, vehiclesById));
  const activeIssues = input.incidents
    .filter((incident) => incident.status !== "resolved" && incident.status !== "closed")
    .map((incident) => {
      const trip = incident.tripId ? tripsById.get(incident.tripId) ?? null : null;

      return {
        incidentId: incident.id,
        tripId: incident.tripId,
        externalTripId: trip?.externalTripId ?? null,
        vehicleLabel:
          vehiclesById.get(incident.vehicleId ?? trip?.vehicleId ?? "") ?? "Unknown vehicle",
        summary: incident.summary,
        severity: incident.severity,
        status: incident.status,
        ownerId: incident.ownerId,
        openedAt: incident.openedAt,
      };
    });
  const pendingApprovals = input.approvalRequests
    .filter((approvalRequest) => approvalRequest.status === "pending")
    .map((approvalRequest) => ({
      approvalRequestId: approvalRequest.id,
      draftId: approvalRequest.draftId,
      tripId: approvalRequest.tripId,
      status: approvalRequest.status,
      requestedBy: approvalRequest.requestedBy,
      requestedAt: approvalRequest.requestedAt,
    }));
  const overdueTasks = input.tasks.filter((task) => {
    if (!task.dueAt) {
      return false;
    }

    return (
      task.status !== "done" &&
      task.status !== "cancelled" &&
      Date.parse(task.dueAt) < Date.parse(input.generatedAt)
    );
  });
  const workerHealth = input.jobRuns.map((jobRun) => ({
    jobName: jobRun.jobName,
    status: jobRun.status,
    finishedAt: jobRun.finishedAt,
    summary: jobRun.summary,
    issueCount: jobRun.issueCount,
  }));

  const issues: UseCaseIssue[] = [];

  if (overdueTasks.length > 0) {
    issues.push({
      code: "OVERDUE_TASKS_PRESENT",
      message: `${overdueTasks.length} tasks are overdue in the ops snapshot.`,
      severity: "warning",
      entityType: "task",
    });
  }

  if (workerHealth.some((job) => job.status === "failed")) {
    issues.push({
      code: "FAILED_JOB_PRESENT",
      message: "One or more worker jobs are marked as failed.",
      severity: "warning",
      entityType: "job_run",
    });
  }

  return makeResult(
    {
      generatedAt: input.generatedAt,
      pickups,
      returns,
      activeIssues,
      pendingApprovals,
      overdueTasks,
      workerHealth,
      summary: {
        pickupCount: pickups.length,
        returnCount: returns.length,
        activeIssueCount: activeIssues.length,
        pendingApprovalCount: pendingApprovals.length,
        overdueTaskCount: overdueTasks.length,
      },
    },
    issues,
    input.generatedAt,
  );
}

export function computeLifecycleTasks(input: {
  asOf: ISODateString;
  createdBy: string;
  trips: Trip[];
  vehicles: Vehicle[];
  existingTasks: Task[];
}): UseCaseResult<GenerateLifecycleTasksData> {
  const vehiclesById = new Map(input.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const existingTaskIds = new Set(
    input.existingTasks.map((task) => `${task.tripId ?? "none"}:${task.type}`),
  );

  const createdTasks: Task[] = [];

  for (const trip of input.trips) {
    for (const template of taskTemplateForTrip(trip, vehiclesById)) {
      const dedupeKey = `${trip.id}:${template.type}`;
      if (existingTaskIds.has(dedupeKey)) {
        continue;
      }

      createdTasks.push({
        id: stableId(["task", trip.id, template.type]),
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        type: template.type,
        title: template.title,
        description: template.description,
        status: "todo",
        priority: template.priority,
        assignedTo: null,
        dueAt: template.dueAt,
        completedAt: null,
        createdBy: input.createdBy,
        createdAt: input.asOf,
        updatedAt: input.asOf,
      });
    }
  }

  const issues =
    createdTasks.length === 0
      ? [
          {
            code: "NO_LIFECYCLE_TASKS_CREATED",
            message: "No additional lifecycle tasks were created for the current trip set.",
            severity: "info" as const,
          },
        ]
      : [];

  return makeResult(
    {
      createdTasks,
      existingTasks: input.existingTasks,
    },
    issues,
    input.asOf,
  );
}

export function computeLateReturnIncidents(input: {
  asOf: ISODateString;
  openedBy: string;
  trips: Trip[];
  incidents: Incident[];
  vehicles: Vehicle[];
}): UseCaseResult<DetectLateReturnsData> {
  const openLateReturnByTripId = new Set(
    input.incidents
      .filter(
        (incident) =>
          incident.type === "late_return" &&
          incident.status !== "resolved" &&
          incident.status !== "closed" &&
          incident.tripId,
      )
      .map((incident) => incident.tripId as string),
  );
  const vehiclesById = new Map(input.vehicles.map((vehicle) => [vehicle.id, vehicle]));

  const incidentsCreated = input.trips
    .filter(
      (trip) =>
        (trip.status === "active" || trip.status === "issue") &&
        !trip.actualReturnAt &&
        Date.parse(trip.returnAt) < Date.parse(input.asOf) &&
        !openLateReturnByTripId.has(trip.id),
    )
    .map((trip) => {
      const vehicle = vehiclesById.get(trip.vehicleId);
      const vehicleLabel = vehicle?.nickname ?? trip.vehicleId;

      return {
        id: stableId(["incident", trip.id, "late-return"]),
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        type: "late_return" as const,
        severity: "high" as const,
        status: "open" as const,
        summary: `${vehicleLabel} is past the planned return time`,
        details: `Trip ${trip.externalTripId} has not been closed and is past ${trip.returnAt}.`,
        ownerId: input.openedBy,
        openedAt: input.asOf,
        resolvedAt: null,
        createdAt: input.asOf,
        updatedAt: input.asOf,
      };
    });

  const issues =
    incidentsCreated.length > 0
      ? [
          {
            code: "LATE_RETURNS_DETECTED",
            message: `${incidentsCreated.length} late return incidents were detected.`,
            severity: "warning" as const,
            entityType: "incident",
          },
        ]
      : [];

  return makeResult(
    {
      incidentsCreated,
    },
    issues,
    input.asOf,
  );
}

export interface DetectTripAnomaliesInput {
  asOf: ISODateString;
  openedBy: string;
}

export interface DetectTripAnomaliesData {
  incidentsCreated: Incident[];
  lateReturns: number;
  tripIssues: number;
}

export interface DetectTripAnomaliesUseCase {
  execute(
    input: DetectTripAnomaliesInput,
  ): Promise<UseCaseResult<DetectTripAnomaliesData>>;
}

export function computeTripIssueIncidents(input: {
  asOf: ISODateString;
  openedBy: string;
  trips: Trip[];
  incidents: Incident[];
  vehicles: Vehicle[];
}): Incident[] {
  const openIssueIncidentByTripId = new Set(
    input.incidents
      .filter(
        (incident) =>
          incident.type === "other" &&
          incident.status !== "resolved" &&
          incident.status !== "closed" &&
          incident.tripId,
      )
      .map((incident) => incident.tripId as string),
  );
  const vehiclesById = new Map(input.vehicles.map((v) => [v.id, v]));

  const asOfMs = Date.parse(input.asOf);

  return input.trips
    .filter(
      (trip) =>
        trip.status === "issue" &&
        // Exclude trips already past return time — those are handled by late return detection
        Date.parse(trip.returnAt) >= asOfMs &&
        !openIssueIncidentByTripId.has(trip.id),
    )
    .map((trip) => {
      const vehicle = vehiclesById.get(trip.vehicleId);
      const vehicleLabel = vehicle?.nickname ?? trip.vehicleId;
      return {
        id: stableId(["incident", trip.id, "trip-issue"]),
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        type: "other" as const,
        severity: "medium" as const,
        status: "open" as const,
        summary: `Trip issue flagged on ${vehicleLabel}`,
        details: `Trip ${trip.externalTripId} is in 'issue' status with no active incident.`,
        ownerId: input.openedBy,
        openedAt: input.asOf,
        resolvedAt: null,
        createdAt: input.asOf,
        updatedAt: input.asOf,
      };
    });
}

export function createDetectTripAnomaliesUseCase(deps: {
  tripRepository: TripRepository;
  incidentRepository: IncidentRepository;
  notifier: OpsNotifier;
  vehicles: Vehicle[];
}): DetectTripAnomaliesUseCase {
  return {
    async execute(input) {
      const [trips, incidents] = await Promise.all([
        deps.tripRepository.listTrips(),
        deps.incidentRepository.listIncidents(),
      ]);

      const lateReturnResult = computeLateReturnIncidents({
        asOf: input.asOf,
        openedBy: input.openedBy,
        trips,
        incidents,
        vehicles: deps.vehicles,
      });

      const tripIssueIncidents = computeTripIssueIncidents({
        asOf: input.asOf,
        openedBy: input.openedBy,
        trips,
        incidents,
        vehicles: deps.vehicles,
      });

      const allNew = [...lateReturnResult.data.incidentsCreated, ...tripIssueIncidents];

      if (allNew.length > 0) {
        await deps.incidentRepository.saveIncidents(allNew);
        await Promise.all(
          allNew.map((incident) =>
            deps.notifier.notifyIncidentDetected({
              incidentId: incident.id,
              tripId: incident.tripId,
              type: incident.type,
            }).catch(() => {}),
          ),
        );
      }

      const useCaseIssues: UseCaseIssue[] =
        allNew.length > 0
          ? [
              {
                code: "ANOMALIES_DETECTED",
                message: `${allNew.length} trip anomaly incidents created (${lateReturnResult.data.incidentsCreated.length} late returns, ${tripIssueIncidents.length} trip issues).`,
                severity: "warning" as const,
                entityType: "incident",
              },
            ]
          : [];

      return makeResult(
        {
          incidentsCreated: allNew,
          lateReturns: lateReturnResult.data.incidentsCreated.length,
          tripIssues: tripIssueIncidents.length,
        },
        useCaseIssues,
        input.asOf,
      );
    },
  };
}

export function createGetTripTimelineUseCase(deps: {
  tripRepository: TripRepository;
  taskRepository: TaskRepository;
  incidentRepository: IncidentRepository;
  messageRepository: MessageRepository;
}): GetTripTimelineUseCase {
  return {
    async execute(input) {
      const [tripEvents, tasks, incidents, drafts] = await Promise.all([
        deps.tripRepository.listTripEvents(),
        deps.taskRepository.listTasks(),
        deps.incidentRepository.listIncidents(),
        deps.messageRepository.listDrafts(),
      ]);

      const entries: TripTimelineEntry[] = [];

      for (const event of tripEvents.filter((e) => e.tripId === input.tripId)) {
        entries.push({
          kind: "trip_event",
          id: event.id,
          timestamp: event.eventTime,
          label: event.eventType.replace(/_/g, " "),
          detail: event.source,
        });
      }

      for (const task of tasks.filter((t) => t.tripId === input.tripId)) {
        entries.push({
          kind: "task",
          id: task.id,
          timestamp: task.dueAt ?? task.createdAt,
          label: task.title,
          detail: task.status,
        });
      }

      for (const incident of incidents.filter((i) => i.tripId === input.tripId)) {
        entries.push({
          kind: "incident",
          id: incident.id,
          timestamp: incident.openedAt,
          label: incident.summary,
          detail: incident.status,
        });
      }

      for (const draft of drafts.filter((d) => d.tripId === input.tripId)) {
        entries.push({
          kind: "draft",
          id: draft.id,
          timestamp: draft.createdAt,
          label: `Draft: ${draft.templateKey}`,
          detail: draft.state,
        });
      }

      entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      const issues: UseCaseIssue[] =
        entries.length === 0
          ? [
              {
                code: "NO_TIMELINE_ENTRIES",
                message: `No timeline entries found for trip ${input.tripId}.`,
                severity: "info" as const,
                entityType: "trip",
                entityId: input.tripId,
              },
            ]
          : [];

      return makeResult(
        { tripId: input.tripId, entries },
        issues,
        input.generatedAt,
      );
    },
  };
}

export function createGetVehicleUtilizationUseCase(deps: {
  tripRepository: TripRepository;
  vehicles: Vehicle[];
}): GetVehicleUtilizationUseCase {
  return {
    async execute(input) {
      const trips = await deps.tripRepository.listTrips();
      const windowStartMs = Date.parse(input.windowStart);
      const windowEndMs = Date.parse(input.windowEnd);
      const windowDays = Math.max(1, Math.round((windowEndMs - windowStartMs) / 86_400_000));

      // Filter trips that overlap with the window
      const windowTrips = trips.filter((trip) => {
        const pickupMs = Date.parse(trip.pickupAt);
        const returnMs = Date.parse(trip.returnAt);
        return pickupMs < windowEndMs && returnMs > windowStartMs;
      });

      const vehiclesById = new Map(deps.vehicles.map((v) => [v.id, v]));
      const statsByVehicle = new Map<string, {
        totalTrips: number;
        completedTrips: number;
        activeTrips: number;
        cancelledTrips: number;
        totalRevenueAmount: number;
        utilizationMs: number;
      }>();

      for (const vehicle of deps.vehicles) {
        statsByVehicle.set(vehicle.id, {
          totalTrips: 0,
          completedTrips: 0,
          activeTrips: 0,
          cancelledTrips: 0,
          totalRevenueAmount: 0,
          utilizationMs: 0,
        });
      }

      for (const trip of windowTrips) {
        const stats = statsByVehicle.get(trip.vehicleId);
        if (!stats) continue;

        stats.totalTrips++;
        if (trip.status === "completed") stats.completedTrips++;
        else if (trip.status === "active") stats.activeTrips++;
        else if (trip.status === "cancelled") stats.cancelledTrips++;
        stats.totalRevenueAmount += trip.tripTotalAmount ?? 0;

        // Clamp trip overlap to the window
        const effectiveStart = Math.max(Date.parse(trip.pickupAt), windowStartMs);
        const effectiveEnd = Math.min(Date.parse(trip.returnAt), windowEndMs);
        if (effectiveEnd > effectiveStart) {
          stats.utilizationMs += effectiveEnd - effectiveStart;
        }
      }

      const items: VehicleUtilizationItem[] = [];
      for (const vehicle of deps.vehicles) {
        const stats = statsByVehicle.get(vehicle.id);
        if (!stats) continue;
        const utilizationDays = stats.utilizationMs / 86_400_000;
        items.push({
          vehicleId: vehicle.id,
          vehicleNickname: vehicle.nickname,
          totalTrips: stats.totalTrips,
          completedTrips: stats.completedTrips,
          activeTrips: stats.activeTrips,
          cancelledTrips: stats.cancelledTrips,
          totalRevenueAmount: Math.round(stats.totalRevenueAmount * 100) / 100,
          utilizationDays: Math.round(utilizationDays * 100) / 100,
          windowDays,
          utilizationRate: Math.round((utilizationDays / windowDays) * 10_000) / 10_000,
        });
      }

      // Sort by utilization rate descending
      items.sort((a, b) => b.utilizationRate - a.utilizationRate);

      return makeResult(
        { items, windowStart: input.windowStart, windowEnd: input.windowEnd },
        [],
        input.generatedAt,
      );
    },
  };
}

export function createGetTodayOpsSnapshotUseCase(deps: {
  tripRepository: TripRepository;
  taskRepository: TaskRepository;
  incidentRepository: IncidentRepository;
  messageRepository: MessageRepository;
  jobRunRepository: JobRunRepository;
  guests: Array<{ id: string; fullName: string }>;
  vehicles: Vehicle[];
}): GetTodayOpsSnapshotUseCase {
  return {
    async execute(input) {
      const [trips, tasks, incidents, approvalRequests, jobRuns] = await Promise.all([
        deps.tripRepository.listTrips(),
        deps.taskRepository.listTasks(),
        deps.incidentRepository.listIncidents(),
        deps.messageRepository.listApprovalRequests(),
        deps.jobRunRepository.listJobRuns(),
      ]);

      return buildTodayOpsSnapshotModel({
        today: input.today,
        generatedAt: input.generatedAt,
        trips,
        tasks,
        incidents,
        approvalRequests,
        jobRuns,
        guests: deps.guests,
        vehicles: deps.vehicles,
      });
    },
  };
}

export function createImportTripsUseCase(deps: {
  tripImportSource: TripImportSource;
  tripRepository: TripRepository;
  /** Optional: when provided, guests derived from import rows are upserted before trips. */
  guestRepository?: GuestRepository;
  /** Optional: when provided, vehicles derived from import rows are upserted before trips. */
  vehicleRepository?: VehicleRepository;
}): ImportTripsUseCase {
  return {
    async execute(input) {
      const rows = await deps.tripImportSource.readTripImportRows({
        triggeredBy: input.triggeredBy,
        sourceRunId: input.sourceRunId,
      });
      const existingTrips = await deps.tripRepository.listTrips();
      const tripsByExternalId = new Map(
        existingTrips.map((trip) => [trip.externalTripId, trip] as const),
      );

      // Upsert guests derived from import rows when a guest repository is provided.
      if (deps.guestRepository && rows.length > 0) {
        const existingGuests = await deps.guestRepository.listGuests();
        const existingGuestIds = new Set(existingGuests.map((g) => g.id));
        const seenGuestIds = new Set<string>();
        const newGuests: Guest[] = [];
        for (const row of rows) {
          const guestId = stableId(["guest", row.guestFullName]);
          if (!existingGuestIds.has(guestId) && !seenGuestIds.has(guestId)) {
            seenGuestIds.add(guestId);
            const nameParts = row.guestFullName.split(" ");
            newGuests.push({
              id: guestId,
              firstName: nameParts[0] ?? "",
              lastName: nameParts.slice(1).join(" "),
              fullName: row.guestFullName,
              phone: row.guestPhone,
              email: row.guestEmail,
              driverLicenseLast4: null,
              rating: null,
              notes: null,
              createdAt: input.importedAt,
              updatedAt: input.importedAt,
            });
          }
        }
        if (newGuests.length > 0) {
          await deps.guestRepository.saveGuests(newGuests);
        }
      }

      // Upsert vehicles derived from import rows when a vehicle repository is provided.
      if (deps.vehicleRepository && rows.length > 0) {
        const existingVehicles = await deps.vehicleRepository.listVehicles();
        const existingVehicleIds = new Set(existingVehicles.map((v) => v.id));
        const seenVehicleIds = new Set<string>();
        const newVehicles: Vehicle[] = [];
        for (const row of rows) {
          const vehicleId = stableId(["vehicle", row.vehicleNickname]);
          if (
            !existingVehicleIds.has(vehicleId) &&
            !seenVehicleIds.has(vehicleId)
          ) {
            seenVehicleIds.add(vehicleId);
            newVehicles.push({
              id: vehicleId,
              vin: null,
              plate: null,
              nickname: row.vehicleNickname,
              make: row.vehicleNickname,
              model: row.vehicleNickname,
              year: null,
              status: "active",
              location: null,
              odometer: null,
              fuelType: null,
              notes: "Auto-created from CSV import. Update make/model/year.",
              createdAt: input.importedAt,
              updatedAt: input.importedAt,
            });
          }
        }
        if (newVehicles.length > 0) {
          await deps.vehicleRepository.saveVehicles(newVehicles);
        }
      }

      const importedTrips: Trip[] = [];
      const importedTripEvents: TripEvent[] = [];

      rows.forEach((row, index) => {
        const existingTrip = tripsByExternalId.get(row.externalTripId);
        const tripId = existingTrip?.id ?? stableId(["trip", row.externalTripId]);
        importedTrips.push({
          id: tripId,
          externalTripId: row.externalTripId,
          vehicleId: stableId(["vehicle", row.vehicleNickname]),
          guestId: stableId(["guest", row.guestFullName]),
          status: row.tripStatus,
          pickupAt: row.pickupAt,
          returnAt: row.returnAt,
          actualReturnAt: existingTrip?.actualReturnAt ?? null,
          pickupLocation: row.pickupLocation,
          returnLocation: row.returnLocation,
          tripTotalAmount: row.tripTotalAmount,
          deliveryRequired: row.deliveryRequired,
          source: row.source,
          notes: null,
          createdAt: existingTrip?.createdAt ?? input.importedAt,
          updatedAt: input.importedAt,
        });
        importedTripEvents.push({
          id: stableId(["trip-event", row.externalTripId, String(index)]),
          tripId,
          eventType: "trip_imported",
          eventTime: input.importedAt,
          source: row.source,
          payload: {
            externalTripId: row.externalTripId,
            tripStatus: row.tripStatus,
          },
          createdAt: input.importedAt,
        });
      });

      await deps.tripRepository.saveTrips(importedTrips);
      await deps.tripRepository.saveTripEvents(importedTripEvents);

      return makeResult(
        {
          rowsRead: rows.length,
          importedTrips,
          importedTripEvents,
        },
        [],
        input.importedAt,
      );
    },
  };
}

export function createGenerateLifecycleTasksUseCase(deps: {
  tripRepository: TripRepository;
  taskRepository: TaskRepository;
  vehicles: Vehicle[];
}): GenerateLifecycleTasksUseCase {
  return {
    async execute(input) {
      const [trips, existingTasks] = await Promise.all([
        deps.tripRepository.listTrips(),
        deps.taskRepository.listTasks(),
      ]);
      const result = computeLifecycleTasks({
        asOf: input.asOf,
        createdBy: input.createdBy,
        trips,
        vehicles: deps.vehicles,
        existingTasks,
      });

      if (result.data.createdTasks.length > 0) {
        await deps.taskRepository.saveTasks(result.data.createdTasks);
      }

      return result;
    },
  };
}

export function createCreateMessageDraftUseCase(deps: {
  tripRepository: TripRepository;
  messageRepository: MessageRepository;
  /** Optional: when provided, used to render template body with guest first name. */
  guests?: Array<{ id: string; firstName: string; fullName: string }>;
  /** Optional: when provided, used to render template body with vehicle nickname. */
  vehicles?: Vehicle[];
}): CreateMessageDraftUseCase {
  return {
    async execute(input) {
      const trip = await deps.tripRepository.getTripById(input.tripId);
      if (!trip) {
        return makeResult(
          {
            draft: null,
          },
          [
            {
              code: "TRIP_NOT_FOUND",
              message: `Trip ${input.tripId} was not found for draft creation.`,
              severity: "error",
              entityType: "trip",
              entityId: input.tripId,
            },
          ],
          input.createdAt,
        );
      }

      const threads = await deps.messageRepository.listThreads();
      const thread =
        threads.find((candidate) => candidate.tripId === trip.id) ??
        {
          id: stableId(["thread", trip.id]),
          tripId: trip.id,
          guestId: trip.guestId,
          channel: "turo" as const,
          status: "drafting" as MessageState,
          lastMessageAt: input.createdAt,
          ownerId: input.requestedBy,
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        };

      if (!threads.some((candidate) => candidate.id === thread.id)) {
        await deps.messageRepository.saveThreads([thread]);
      }

      const guest = deps.guests?.find((g) => g.id === trip.guestId);
      const vehicle = deps.vehicles?.find((v) => v.id === trip.vehicleId);
      const body = renderMessageTemplate({
        templateKey: input.templateKey,
        guestFirstName: guest?.firstName ?? guest?.fullName ?? "there",
        vehicleNickname: vehicle?.nickname ?? trip.vehicleId,
        externalTripId: trip.externalTripId,
        pickupAt: trip.pickupAt,
        returnAt: trip.returnAt,
        pickupLocation: trip.pickupLocation,
      });

      const draft: MessageDraft = {
        id: stableId(["draft", trip.id, input.templateKey, input.createdAt]),
        threadId: thread.id,
        tripId: trip.id,
        direction: "outbound",
        channel: "turo",
        body,
        templateKey: input.templateKey,
        approvalStatus: "pending" as ApprovalStatus,
        state: "awaiting_approval",
        requestedBy: input.requestedBy,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      };

      await deps.messageRepository.saveDrafts([draft]);

      return makeResult(
        {
          draft,
        },
        [],
        input.createdAt,
      );
    },
  };
}

export function createRequestApprovalUseCase(deps: {
  messageRepository: MessageRepository;
  notifier: OpsNotifier;
}): RequestApprovalUseCase {
  return {
    async execute(input) {
      const draft = (await deps.messageRepository.listDrafts()).find(
        (candidate) => candidate.id === input.draftId,
      );

      if (!draft) {
        return makeResult(
          {
            approvalRequest: null,
          },
          [
            {
              code: "DRAFT_NOT_FOUND",
              message: `Draft ${input.draftId} was not found for approval request.`,
              severity: "error",
              entityType: "message_draft",
              entityId: input.draftId,
            },
          ],
          input.requestedAt,
        );
      }

      const approvalRequest: ApprovalRequest = {
        id: stableId(["approval", draft.id]),
        draftId: draft.id,
        tripId: input.tripId,
        status: "pending",
        requestedBy: input.requestedBy,
        reviewedBy: null,
        requestedAt: input.requestedAt,
        reviewedAt: null,
        notes: null,
      };

      await deps.messageRepository.saveApprovalRequests([approvalRequest]);
      await deps.notifier.notifyApprovalRequested({
        approvalRequestId: approvalRequest.id,
        draftId: approvalRequest.draftId,
        tripId: approvalRequest.tripId,
      });

      return makeResult(
        {
          approvalRequest,
        },
        [],
        input.requestedAt,
      );
    },
  };
}

export function createDetectLateReturnsUseCase(deps: {
  tripRepository: TripRepository;
  incidentRepository: IncidentRepository;
  notifier: OpsNotifier;
  vehicles: Vehicle[];
}): DetectLateReturnsUseCase {
  return {
    async execute(input) {
      const [trips, incidents] = await Promise.all([
        deps.tripRepository.listTrips(),
        deps.incidentRepository.listIncidents(),
      ]);
      const result = computeLateReturnIncidents({
        asOf: input.asOf,
        openedBy: input.openedBy,
        trips,
        incidents,
        vehicles: deps.vehicles,
      });

      if (result.data.incidentsCreated.length > 0) {
        await deps.incidentRepository.saveIncidents(result.data.incidentsCreated);
        await Promise.all(
          result.data.incidentsCreated.map((incident) =>
            deps.notifier.notifyIncidentDetected({
              incidentId: incident.id,
              tripId: incident.tripId,
              type: incident.type,
            }),
          ),
        );
      }

      return result;
    },
  };
}

export function createBuildDailyDigestUseCase(deps: {
  getTodayOpsSnapshot: GetTodayOpsSnapshotUseCase;
  notifier: OpsNotifier;
}): BuildDailyDigestUseCase {
  return {
    async execute(input) {
      const snapshotResult = await deps.getTodayOpsSnapshot.execute({
        today: input.today,
        generatedAt: input.generatedAt,
      });
      const summary = buildDigestText(snapshotResult.data);
      const notification = await deps.notifier.publishDigest({
        channel: input.channel,
        summary,
      });

      return makeResult(
        {
          snapshot: snapshotResult.data,
          summary,
          notificationAccepted: notification.accepted,
        },
        snapshotResult.issues,
        input.generatedAt,
      );
    },
  };
}

export function createGenerateMessageDraftsUseCase(deps: {
  tripRepository: TripRepository;
  messageRepository: MessageRepository;
  notifier: OpsNotifier;
  guests: Array<{ id: string; firstName?: string; fullName: string }>;
  vehicles: Vehicle[];
}): GenerateMessageDraftsUseCase {
  return {
    async execute(input) {
      const preTripWindowMs = (input.preTripWindowHours ?? 24) * 3_600_000;
      const returnWindowMs = (input.returnWindowHours ?? 24) * 3_600_000;
      const asOfMs = Date.parse(input.asOf);

      const [trips, existingDrafts, existingThreads] = await Promise.all([
        deps.tripRepository.listTrips(),
        deps.messageRepository.listDrafts(),
        deps.messageRepository.listThreads(),
      ]);

      const existingDraftKeys = new Set(
        existingDrafts.map((d) => `${d.tripId}:${d.templateKey}`),
      );
      const threadByTripId = new Map(
        existingThreads.map((t) => [t.tripId, t]),
      );
      const guestsById = new Map(deps.guests.map((g) => [g.id, g]));
      const vehiclesById = new Map(deps.vehicles.map((v) => [v.id, v]));

      const newDrafts: MessageDraft[] = [];
      const newThreads: MessageThread[] = [];
      let skippedCount = 0;

      for (const trip of trips) {
        const pickupMs = Date.parse(trip.pickupAt);
        const returnMs = Date.parse(trip.returnAt);
        const guest = guestsById.get(trip.guestId);
        const vehicle = vehiclesById.get(trip.vehicleId);

        const templateCtx = {
          vehicleNickname: vehicle?.nickname ?? trip.vehicleId,
          externalTripId: trip.externalTripId,
          pickupAt: trip.pickupAt,
          returnAt: trip.returnAt,
          pickupLocation: trip.pickupLocation,
          guestFirstName: guest?.firstName ?? guest?.fullName?.split(" ")[0] ?? "there",
        };

        // Pre-trip reminder: upcoming trips with pickup within the window
        if (
          trip.status === "upcoming" &&
          pickupMs > asOfMs &&
          pickupMs - asOfMs <= preTripWindowMs &&
          !existingDraftKeys.has(`${trip.id}:pretrip_reminder`)
        ) {
          let thread = threadByTripId.get(trip.id);
          if (!thread) {
            thread = {
              id: stableId(["thread", trip.id]),
              tripId: trip.id,
              guestId: trip.guestId,
              channel: "turo",
              status: "drafting",
              lastMessageAt: input.asOf,
              ownerId: input.requestedBy,
              createdAt: input.asOf,
              updatedAt: input.asOf,
            };
            newThreads.push(thread);
            threadByTripId.set(trip.id, thread);
          }

          newDrafts.push({
            id: stableId(["draft", trip.id, "pretrip_reminder", input.asOf]),
            threadId: thread.id,
            tripId: trip.id,
            direction: "outbound",
            channel: "turo",
            body: renderMessageTemplate({ ...templateCtx, templateKey: "pretrip_reminder" }),
            templateKey: "pretrip_reminder",
            approvalStatus: "pending",
            state: "awaiting_approval",
            requestedBy: input.requestedBy,
            createdAt: input.asOf,
            updatedAt: input.asOf,
          });
        } else if (
          trip.status === "upcoming" &&
          pickupMs > asOfMs &&
          pickupMs - asOfMs <= preTripWindowMs
        ) {
          skippedCount++;
        }

        // Return reminder: active trips with return within the window
        if (
          trip.status === "active" &&
          returnMs > asOfMs &&
          returnMs - asOfMs <= returnWindowMs &&
          !existingDraftKeys.has(`${trip.id}:return_reminder`)
        ) {
          let thread = threadByTripId.get(trip.id);
          if (!thread) {
            thread = {
              id: stableId(["thread", trip.id]),
              tripId: trip.id,
              guestId: trip.guestId,
              channel: "turo",
              status: "drafting",
              lastMessageAt: input.asOf,
              ownerId: input.requestedBy,
              createdAt: input.asOf,
              updatedAt: input.asOf,
            };
            newThreads.push(thread);
            threadByTripId.set(trip.id, thread);
          }

          newDrafts.push({
            id: stableId(["draft", trip.id, "return_reminder", input.asOf]),
            threadId: thread.id,
            tripId: trip.id,
            direction: "outbound",
            channel: "turo",
            body: renderMessageTemplate({ ...templateCtx, templateKey: "return_reminder" }),
            templateKey: "return_reminder",
            approvalStatus: "pending",
            state: "awaiting_approval",
            requestedBy: input.requestedBy,
            createdAt: input.asOf,
            updatedAt: input.asOf,
          });
        } else if (
          trip.status === "active" &&
          returnMs > asOfMs &&
          returnMs - asOfMs <= returnWindowMs
        ) {
          skippedCount++;
        }
      }

      if (newThreads.length > 0) {
        await deps.messageRepository.saveThreads(newThreads);
      }

      if (newDrafts.length > 0) {
        await deps.messageRepository.saveDrafts(newDrafts);
        // Notify for each new draft
        await Promise.all(
          newDrafts.map((draft) =>
            deps.notifier.notifyApprovalRequested({
              approvalRequestId: stableId(["approval", draft.id]),
              draftId: draft.id,
              tripId: draft.tripId,
            }).catch(() => {}),
          ),
        );
      }

      const issues: UseCaseIssue[] =
        newDrafts.length === 0
          ? [
              {
                code: "NO_DRAFTS_GENERATED",
                message: "No new message drafts were generated for the current trip window.",
                severity: "info" as const,
              },
            ]
          : [];

      return makeResult({ createdDrafts: newDrafts, skippedCount }, issues, input.asOf);
    },
  };
}

export function createActOnApprovalUseCase(deps: {
  messageRepository: MessageRepository;
  notifier: OpsNotifier;
}): ActOnApprovalUseCase {
  return {
    async execute(input) {
      const approvalRequests = await deps.messageRepository.listApprovalRequests();
      const existing = approvalRequests.find((a) => a.id === input.approvalRequestId);

      if (!existing) {
        return makeResult(
          { approvalRequest: null as unknown as ApprovalRequest, draft: null as unknown as MessageDraft },
          [
            {
              code: "APPROVAL_REQUEST_NOT_FOUND",
              message: `Approval request ${input.approvalRequestId} not found.`,
              severity: "error",
              entityType: "approval_request",
              entityId: input.approvalRequestId,
            },
          ],
          input.reviewedAt,
        );
      }

      if (existing.status !== "pending") {
        return makeResult(
          { approvalRequest: existing, draft: null as unknown as MessageDraft },
          [
            {
              code: "APPROVAL_ALREADY_DECIDED",
              message: `Approval request ${input.approvalRequestId} is already ${existing.status}.`,
              severity: "error",
              entityType: "approval_request",
              entityId: input.approvalRequestId,
            },
          ],
          input.reviewedAt,
        );
      }

      const updatedApproval: ApprovalRequest = {
        ...existing,
        status: input.decision,
        reviewedBy: input.reviewedBy,
        reviewedAt: input.reviewedAt,
        notes: input.notes ?? existing.notes,
      };

      const [savedApprovals] = await Promise.all([
        deps.messageRepository.saveApprovalRequests([updatedApproval]),
      ]);
      const savedApproval = savedApprovals[0]!;

      // Update the associated draft state
      const drafts = await deps.messageRepository.listDrafts();
      const draft = drafts.find((d) => d.id === existing.draftId);
      let savedDraft = draft ?? (null as unknown as MessageDraft);

      if (draft) {
        const updatedDraft: MessageDraft = {
          ...draft,
          approvalStatus: input.decision === "approved" ? "approved" : "rejected",
          state: input.decision === "approved" ? "ready_for_review" : "closed",
          updatedAt: input.reviewedAt,
        };
        const [saved] = await deps.messageRepository.saveDrafts([updatedDraft]);
        savedDraft = saved!;
      }

      // Notify via Slack if needed (non-blocking, failure does not fail the use-case)
      if (input.decision === "approved" && draft) {
        await deps.notifier.notifyApprovalRequested({
          approvalRequestId: savedApproval.id,
          draftId: draft.id,
          tripId: existing.tripId,
        }).catch(() => {});
      }

      return makeResult(
        { approvalRequest: savedApproval, draft: savedDraft },
        [],
        input.reviewedAt,
      );
    },
  };
}

export function createSendApprovedMessageDraftsUseCase(deps: {
  messageRepository: MessageRepository;
}): SendApprovedMessageDraftsUseCase {
  return {
    async execute(input) {
      const [drafts, threads] = await Promise.all([
        deps.messageRepository.listDrafts(),
        deps.messageRepository.listThreads(),
      ]);

      const eligibleDrafts = drafts.filter(
        (draft) =>
          draft.approvalStatus === "approved" && draft.state === "ready_for_review",
      );
      const threadById = new Map(threads.map((thread) => [thread.id, thread]));
      const updatedThreadsById = new Map<string, MessageThread>();
      const sentDrafts: MessageDraft[] = [];
      const issues: UseCaseIssue[] = [];

      for (const draft of eligibleDrafts) {
        const thread = threadById.get(draft.threadId) ?? updatedThreadsById.get(draft.threadId);
        if (!thread) {
          issues.push({
            code: "MESSAGE_THREAD_NOT_FOUND",
            message: `Message thread ${draft.threadId} was not found for draft ${draft.id}.`,
            severity: "error",
            entityType: "message_thread",
            entityId: draft.threadId,
          });
          continue;
        }

        sentDrafts.push({
          ...draft,
          state: "sent",
          updatedAt: input.sentAt,
        });

        updatedThreadsById.set(thread.id, {
          ...thread,
          status: "sent",
          lastMessageAt: input.sentAt,
          updatedAt: input.sentAt,
        });
      }

      if (sentDrafts.length > 0) {
        await deps.messageRepository.saveDrafts(sentDrafts);
      }

      const sentThreads = [...updatedThreadsById.values()];
      if (sentThreads.length > 0) {
        await deps.messageRepository.saveThreads(sentThreads);
      }

      const summaryIssues =
        sentDrafts.length === 0
          ? [
              {
                code: "NO_APPROVED_MESSAGE_DRAFTS",
                message: "No approved message drafts were ready to send.",
                severity: "info" as const,
              },
            ]
          : [];

      return makeResult(
        {
          triggeredBy: input.triggeredBy,
          sentDrafts,
          sentThreads,
          skippedCount: eligibleDrafts.length - sentDrafts.length,
        },
        issues.length > 0 ? issues : summaryIssues,
        input.sentAt,
      );
    },
  };
}

export function createActOnIncidentUseCase(deps: {
  incidentRepository: IncidentRepository;
}): ActOnIncidentUseCase {
  return {
    async execute(input) {
      const incidents = await deps.incidentRepository.listIncidents();
      const existing = incidents.find((incident) => incident.id === input.incidentId);

      if (!existing) {
        return makeResult(
          { incident: null as unknown as Incident },
          [
            {
              code: "INCIDENT_NOT_FOUND",
              message: `Incident ${input.incidentId} not found.`,
              severity: "error",
              entityType: "incident",
              entityId: input.incidentId,
            },
          ],
          input.actedAt,
        );
      }

      const isResolvedState =
        input.status === "resolved" || input.status === "closed";

      const updatedIncident: Incident = {
        ...existing,
        status: input.status,
        ownerId: input.actedBy,
        resolvedAt: isResolvedState ? input.actedAt : null,
        updatedAt: input.actedAt,
      };

      const [savedIncident] = await deps.incidentRepository.saveIncidents([
        updatedIncident,
      ]);

      return makeResult({ incident: savedIncident! }, [], input.actedAt);
    },
  };
}

export interface SharedFixtureContext {
  vehicles: Vehicle[];
  guests: Array<{ id: string; fullName: string }>;
  tripRepository: TripRepository;
  taskRepository: TaskRepository;
  incidentRepository: IncidentRepository;
  messageRepository: MessageRepository;
  jobRunRepository: JobRunRepository;
  tripImportSource: TripImportSource;
  notifier: OpsNotifier;
  browserAssistPort: BrowserAssistPort;
}

export function createInMemoryTripRepository(seed: {
  trips: Trip[];
  tripEvents: TripEvent[];
}): TripRepository {
  const state = {
    trips: cloneValue(seed.trips),
    tripEvents: cloneValue(seed.tripEvents),
  };

  return {
    async listTrips() {
      return cloneValue(state.trips);
    },
    async getTripById(tripId) {
      return cloneValue(state.trips.find((trip) => trip.id === tripId) ?? null);
    },
    async saveTrips(trips) {
      for (const trip of trips) {
        const index = state.trips.findIndex((candidate) => candidate.id === trip.id);
        if (index >= 0) {
          state.trips[index] = cloneValue(trip);
        } else {
          state.trips.push(cloneValue(trip));
        }
      }

      return cloneValue(trips);
    },
    async listTripEvents() {
      return cloneValue(state.tripEvents);
    },
    async saveTripEvents(events) {
      state.tripEvents.push(...cloneValue(events));
      return cloneValue(events);
    },
  };
}

export function createInMemoryTaskRepository(seed: { tasks: Task[] }): TaskRepository {
  const state = {
    tasks: cloneValue(seed.tasks),
  };

  return {
    async listTasks() {
      return cloneValue(state.tasks);
    },
    async saveTasks(tasks) {
      for (const task of tasks) {
        const index = state.tasks.findIndex((candidate) => candidate.id === task.id);
        if (index >= 0) {
          state.tasks[index] = cloneValue(task);
        } else {
          state.tasks.push(cloneValue(task));
        }
      }

      return cloneValue(tasks);
    },
  };
}

export function createInMemoryIncidentRepository(seed: {
  incidents: Incident[];
}): IncidentRepository {
  const state = {
    incidents: cloneValue(seed.incidents),
  };

  return {
    async listIncidents() {
      return cloneValue(state.incidents);
    },
    async saveIncidents(incidents) {
      for (const incident of incidents) {
        const index = state.incidents.findIndex(
          (candidate) => candidate.id === incident.id,
        );
        if (index >= 0) {
          state.incidents[index] = cloneValue(incident);
        } else {
          state.incidents.push(cloneValue(incident));
        }
      }

      return cloneValue(incidents);
    },
  };
}

export function createInMemoryMessageRepository(seed: {
  threads: MessageThread[];
  drafts: MessageDraft[];
  approvalRequests: ApprovalRequest[];
}): MessageRepository {
  const state = {
    threads: cloneValue(seed.threads),
    drafts: cloneValue(seed.drafts),
    approvalRequests: cloneValue(seed.approvalRequests),
  };

  return {
    async listThreads() {
      return cloneValue(state.threads);
    },
    async saveThreads(threads) {
      for (const thread of threads) {
        const index = state.threads.findIndex((candidate) => candidate.id === thread.id);
        if (index >= 0) {
          state.threads[index] = cloneValue(thread);
        } else {
          state.threads.push(cloneValue(thread));
        }
      }

      return cloneValue(threads);
    },
    async listDrafts() {
      return cloneValue(state.drafts);
    },
    async saveDrafts(drafts) {
      for (const draft of drafts) {
        const index = state.drafts.findIndex((candidate) => candidate.id === draft.id);
        if (index >= 0) {
          state.drafts[index] = cloneValue(draft);
        } else {
          state.drafts.push(cloneValue(draft));
        }
      }

      return cloneValue(drafts);
    },
    async listApprovalRequests() {
      return cloneValue(state.approvalRequests);
    },
    async saveApprovalRequests(approvalRequests) {
      for (const approvalRequest of approvalRequests) {
        const index = state.approvalRequests.findIndex(
          (candidate) => candidate.id === approvalRequest.id,
        );
        if (index >= 0) {
          state.approvalRequests[index] = cloneValue(approvalRequest);
        } else {
          state.approvalRequests.push(cloneValue(approvalRequest));
        }
      }

      return cloneValue(approvalRequests);
    },
  };
}

export function createInMemoryJobRunRepository(seed: {
  jobRuns: JobRun[];
}): JobRunRepository {
  const state = {
    jobRuns: cloneValue(seed.jobRuns),
  };

  return {
    async listJobRuns() {
      return cloneValue(state.jobRuns);
    },
    async saveJobRun(jobRun) {
      state.jobRuns.push(cloneValue(jobRun));
      return cloneValue(jobRun);
    },
  };
}

export function createInMemoryVehicleRepository(seed: {
  vehicles: Vehicle[];
}): VehicleRepository {
  const state = { vehicles: cloneValue(seed.vehicles) };
  return {
    async listVehicles() {
      return cloneValue(state.vehicles);
    },
    async saveVehicles(vehicles) {
      for (const vehicle of vehicles) {
        const index = state.vehicles.findIndex((v) => v.id === vehicle.id);
        if (index >= 0) {
          state.vehicles[index] = cloneValue(vehicle);
        } else {
          state.vehicles.push(cloneValue(vehicle));
        }
      }
      return cloneValue(vehicles);
    },
  };
}

export function createInMemoryGuestRepository(seed: {
  guests: Guest[];
}): GuestRepository {
  const state = { guests: cloneValue(seed.guests) };
  return {
    async listGuests() {
      return cloneValue(state.guests);
    },
    async saveGuests(guests) {
      for (const guest of guests) {
        const index = state.guests.findIndex((g) => g.id === guest.id);
        if (index >= 0) {
          state.guests[index] = cloneValue(guest);
        } else {
          state.guests.push(cloneValue(guest));
        }
      }
      return cloneValue(guests);
    },
  };
}
