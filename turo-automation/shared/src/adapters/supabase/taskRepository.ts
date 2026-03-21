import type { SupabaseClient } from "@supabase/supabase-js";
import type { Task } from "../../domain/index.js";
import type { TaskRepository } from "../../ports/index.js";

interface TaskRow {
  id: string;
  trip_id: string | null;
  vehicle_id: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function rowToTask(r: TaskRow): Task {
  return {
    id: r.id,
    tripId: r.trip_id,
    vehicleId: r.vehicle_id,
    type: r.type as Task["type"],
    title: r.title,
    description: r.description,
    status: r.status as Task["status"],
    priority: r.priority as Task["priority"],
    assignedTo: r.assigned_to,
    dueAt: r.due_at,
    completedAt: r.completed_at,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function taskToRow(
  t: Task
): Omit<TaskRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: t.id,
    trip_id: t.tripId,
    vehicle_id: t.vehicleId,
    type: t.type,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    assigned_to: t.assignedTo,
    due_at: t.dueAt,
    completed_at: t.completedAt,
    created_by: t.createdBy,
  };
}

export function createSupabaseTaskRepository(
  client: SupabaseClient
): TaskRepository {
  return {
    async listTasks() {
      const { data, error } = await client
        .from("tasks")
        .select("*")
        .order("due_at", { ascending: true });
      if (error) throw new Error(`listTasks: ${error.message}`);
      return (data as TaskRow[]).map(rowToTask);
    },

    async saveTasks(tasks) {
      if (tasks.length === 0) return [];
      const rows = tasks.map(taskToRow);
      const { data, error } = await client
        .from("tasks")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveTasks: ${error.message}`);
      return (data as TaskRow[]).map(rowToTask);
    },
  };
}
