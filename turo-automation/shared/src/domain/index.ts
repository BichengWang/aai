export type ISODateString = string;
export type EntityId = string;

export type VehicleStatus = "active" | "maintenance" | "inactive";
export type TripStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "cancelled"
  | "issue";
export type TaskType =
  | "prep"
  | "cleaning"
  | "delivery"
  | "pickup_check"
  | "return_check"
  | "late_return_followup"
  | "incident_followup"
  | "admin";
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type IncidentType =
  | "late_return"
  | "damage"
  | "cleaning"
  | "smoking"
  | "toll"
  | "ticket"
  | "mechanical"
  | "other";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "open"
  | "investigating"
  | "waiting"
  | "resolved"
  | "closed";
export type MessageChannel =
  | "turo"
  | "sms"
  | "whatsapp"
  | "email"
  | "slack_internal";
export type MessageState =
  | "drafting"
  | "awaiting_approval"
  | "ready_for_review"
  | "sent"
  | "failed"
  | "closed";
export type ApprovalStatus =
  | "not_needed"
  | "pending"
  | "approved"
  | "rejected";
export type ApprovalDecision = "pending" | "approved" | "rejected";
export type JobStatus = "planned" | "running" | "completed" | "failed";
export type JobName =
  | "today_ops_snapshot"
  | "trip_import"
  | "lifecycle_tasks"
  | "late_return_scan"
  | "generate_drafts"
  | "daily_digest";

export interface Vehicle {
  id: EntityId;
  vin: string | null;
  plate: string | null;
  nickname: string;
  make: string;
  model: string;
  year: number | null;
  status: VehicleStatus;
  location: string | null;
  odometer: number | null;
  fuelType: string | null;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Guest {
  id: EntityId;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  driverLicenseLast4: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Trip {
  id: EntityId;
  externalTripId: string;
  vehicleId: EntityId;
  guestId: EntityId;
  status: TripStatus;
  pickupAt: ISODateString;
  returnAt: ISODateString;
  actualReturnAt: ISODateString | null;
  pickupLocation: string;
  returnLocation: string;
  tripTotalAmount: number | null;
  deliveryRequired: boolean;
  source: string;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Task {
  id: EntityId;
  tripId: EntityId | null;
  vehicleId: EntityId | null;
  type: TaskType;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  dueAt: ISODateString | null;
  completedAt: ISODateString | null;
  createdBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Incident {
  id: EntityId;
  tripId: EntityId | null;
  vehicleId: EntityId | null;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  summary: string;
  details: string | null;
  ownerId: string | null;
  openedAt: ISODateString;
  resolvedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MessageThread {
  id: EntityId;
  tripId: EntityId;
  guestId: EntityId;
  channel: MessageChannel;
  status: MessageState;
  lastMessageAt: ISODateString | null;
  ownerId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface MessageDraft {
  id: EntityId;
  threadId: EntityId;
  tripId: EntityId;
  direction: "inbound" | "outbound";
  channel: MessageChannel;
  body: string;
  templateKey: string;
  approvalStatus: ApprovalStatus;
  state: MessageState;
  requestedBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ApprovalRequest {
  id: EntityId;
  draftId: EntityId;
  tripId: EntityId;
  status: ApprovalDecision;
  requestedBy: string;
  reviewedBy: string | null;
  requestedAt: ISODateString;
  reviewedAt: ISODateString | null;
  notes: string | null;
}

export interface TripEvent {
  id: EntityId;
  tripId: EntityId;
  eventType: string;
  eventTime: ISODateString;
  source: string;
  payload: Record<string, string | number | boolean | null>;
  createdAt: ISODateString;
}

export interface JobRun {
  id: EntityId;
  jobName: JobName;
  status: JobStatus;
  startedAt: ISODateString;
  finishedAt: ISODateString | null;
  summary: string;
  issueCount: number;
}

export interface TripImportRow {
  externalTripId: string;
  guestFullName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  vehicleNickname: string;
  pickupAt: ISODateString;
  returnAt: ISODateString;
  pickupLocation: string;
  returnLocation: string;
  tripStatus: TripStatus;
  deliveryRequired: boolean;
  tripTotalAmount: number | null;
  source: string;
}

export interface TaskGenerationRule {
  status: TripStatus;
  taskType: TaskType;
  priority: TaskPriority;
  titleTemplate: string;
}

export interface OpsTaskTemplate {
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
}
