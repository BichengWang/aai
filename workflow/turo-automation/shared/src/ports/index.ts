import type {
  ApprovalRequest,
  Guest,
  Incident,
  JobRun,
  MessageDraft,
  MessageThread,
  Trip,
  TripEvent,
  TripImportRow,
  Task,
  Vehicle,
} from "../domain/index.js";

export interface VehicleRepository {
  listVehicles(): Promise<Vehicle[]>;
  saveVehicles(vehicles: Vehicle[]): Promise<Vehicle[]>;
}

export interface GuestRepository {
  listGuests(): Promise<Guest[]>;
  saveGuests(guests: Guest[]): Promise<Guest[]>;
}

export interface TripRepository {
  listTrips(): Promise<Trip[]>;
  getTripById(tripId: string): Promise<Trip | null>;
  saveTrips(trips: Trip[]): Promise<Trip[]>;
  listTripEvents(): Promise<TripEvent[]>;
  saveTripEvents(events: TripEvent[]): Promise<TripEvent[]>;
}

export interface TaskRepository {
  listTasks(): Promise<Task[]>;
  saveTasks(tasks: Task[]): Promise<Task[]>;
}

export interface IncidentRepository {
  listIncidents(): Promise<Incident[]>;
  saveIncidents(incidents: Incident[]): Promise<Incident[]>;
}

export interface MessageRepository {
  listThreads(): Promise<MessageThread[]>;
  saveThreads(threads: MessageThread[]): Promise<MessageThread[]>;
  listDrafts(): Promise<MessageDraft[]>;
  saveDrafts(drafts: MessageDraft[]): Promise<MessageDraft[]>;
  listApprovalRequests(): Promise<ApprovalRequest[]>;
  saveApprovalRequests(
    approvalRequests: ApprovalRequest[],
  ): Promise<ApprovalRequest[]>;
}

export interface JobRunRepository {
  listJobRuns(): Promise<JobRun[]>;
  saveJobRun(jobRun: JobRun): Promise<JobRun>;
}

export interface TripImportSource {
  readTripImportRows(input: {
    triggeredBy: string;
    sourceRunId?: string;
  }): Promise<TripImportRow[]>;
}

export interface OpsNotifier {
  publishDigest(input: {
    channel: string;
    summary: string;
  }): Promise<{ accepted: boolean; externalId: string | null }>;
  notifyApprovalRequested(input: {
    approvalRequestId: string;
    draftId: string;
    tripId: string;
  }): Promise<{ accepted: boolean; externalId: string | null }>;
  notifyIncidentDetected(input: {
    incidentId: string;
    tripId: string | null;
    type: string;
  }): Promise<{ accepted: boolean; externalId: string | null }>;
}

export interface BrowserAssistPort {
  openTripReview(input: {
    tripId: string;
    reason: string;
    triggeredBy: string;
  }): Promise<{ opened: boolean; sessionId: string | null }>;
  openMessageReview(input: {
    tripId: string;
    threadId: string;
    triggeredBy: string;
  }): Promise<{ opened: boolean; sessionId: string | null }>;
}
