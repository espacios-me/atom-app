// ─────────────────────────────────────────────────────────────
// Atom – Core TypeScript Types
// ─────────────────────────────────────────────────────────────

export type MemoryKind = "preference" | "fact" | "person" | "project" | "note";
export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type GoalStatus = "active" | "completed" | "paused";
export type BehaviorCategory = "fitness" | "nutrition" | "productivity" | "social" | "other";
export type MessageRole = "user" | "assistant";
export type Intent =
  | "chat"
  | "remember"
  | "recall"
  | "remind"
  | "delete_memory"
  | "erase_all"
  | "goals"
  | "log_behavior"
  | "opt_out"
  | "opt_in";

export interface Memory {
  id: string;
  kind: MemoryKind;
  importance: number; // 1–5
  text: string;
  timestamp: string; // ISO 8601
  deleted?: boolean;
}

export interface Goal {
  id: string;
  goal: string;
  status: GoalStatus;
  timestamp: string;
  lastChecked?: string;
  alignmentScore?: number; // 0–1
}

export interface Reminder {
  id: string;
  title: string;
  dueAt: string; // ISO 8601
  recurrence: Recurrence;
  status: "scheduled" | "sent" | "dismissed";
  createdAt: string;
}

export interface BehaviorEvent {
  id: string;
  event: string;
  category: BehaviorCategory;
  notes: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
  intent?: Intent;
  memoriesSaved?: number;
  goalsSaved?: number;
  reminderSet?: boolean;
}

// AI response schema (mirrors the backend JSON schema)
export interface AIResponse {
  intent: Intent;
  reply: string;
  memories_to_save: Array<{ text: string; kind: MemoryKind; importance: number }>;
  delete_memory_indexes: number[];
  goals_to_save: string[];
  reminder: { title: string; due_at_iso: string; recurrence: Recurrence } | null;
  behavior_events: Array<{ event: string; category: BehaviorCategory; notes: string }>;
  goal_alignment_score: number;
}
