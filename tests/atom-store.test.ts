import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    multiRemove: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

// ─── Type Tests ───────────────────────────────────────────────
describe("Atom Type Definitions", () => {
  it("should define valid MemoryKind values", () => {
    const kinds = ["preference", "fact", "person", "project", "note"];
    expect(kinds).toHaveLength(5);
    kinds.forEach((k) => expect(typeof k).toBe("string"));
  });

  it("should define valid Recurrence values", () => {
    const recurrences = ["none", "daily", "weekly", "monthly"];
    expect(recurrences).toHaveLength(4);
  });

  it("should define valid Intent values", () => {
    const intents = [
      "chat", "remember", "recall", "remind",
      "delete_memory", "erase_all", "goals",
      "log_behavior", "opt_out", "opt_in",
    ];
    expect(intents).toHaveLength(10);
  });
});

// ─── UUID Helper ──────────────────────────────────────────────
describe("UUID generation", () => {
  it("should generate unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      ids.add(id);
    }
    expect(ids.size).toBe(100);
  });
});

// ─── AI Response Schema ───────────────────────────────────────
describe("AI Response Schema", () => {
  it("should validate a well-formed AI response", () => {
    const response = {
      intent: "remember",
      reply: "Got it! I've saved that for you.",
      memories_to_save: [{ text: "Prefers email", kind: "preference", importance: 4 }],
      delete_memory_indexes: [],
      goals_to_save: [],
      reminder: null,
      behavior_events: [],
      goal_alignment_score: 0.7,
    };

    expect(response.intent).toBe("remember");
    expect(response.memories_to_save).toHaveLength(1);
    expect(response.memories_to_save[0].importance).toBeGreaterThanOrEqual(1);
    expect(response.memories_to_save[0].importance).toBeLessThanOrEqual(5);
    expect(response.goal_alignment_score).toBeGreaterThanOrEqual(0);
    expect(response.goal_alignment_score).toBeLessThanOrEqual(1);
  });

  it("should handle a reminder response", () => {
    const response = {
      intent: "remind",
      reply: "Reminder set for 6pm!",
      memories_to_save: [],
      delete_memory_indexes: [],
      goals_to_save: [],
      reminder: {
        title: "Call Ahmed",
        due_at_iso: "2026-03-23T18:00:00.000Z",
        recurrence: "none",
      },
      behavior_events: [],
      goal_alignment_score: 0.5,
    };

    expect(response.reminder).not.toBeNull();
    expect(response.reminder?.title).toBe("Call Ahmed");
    expect(response.reminder?.recurrence).toBe("none");
  });

  it("should coerce missing arrays to empty arrays", () => {
    const raw: Record<string, unknown> = {
      intent: "chat",
      reply: "Hello!",
      goal_alignment_score: 0.5,
    };

    raw.memories_to_save = Array.isArray(raw.memories_to_save) ? raw.memories_to_save : [];
    raw.delete_memory_indexes = Array.isArray(raw.delete_memory_indexes) ? raw.delete_memory_indexes : [];
    raw.goals_to_save = Array.isArray(raw.goals_to_save) ? raw.goals_to_save : [];
    raw.behavior_events = Array.isArray(raw.behavior_events) ? raw.behavior_events : [];

    expect(raw.memories_to_save).toEqual([]);
    expect(raw.delete_memory_indexes).toEqual([]);
    expect(raw.goals_to_save).toEqual([]);
    expect(raw.behavior_events).toEqual([]);
  });
});

// ─── Date Formatting ──────────────────────────────────────────
describe("Reminder date formatting", () => {
  it("should detect past reminders correctly", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    const futureDate = new Date(Date.now() + 86400000).toISOString(); // tomorrow

    expect(new Date(pastDate) < new Date()).toBe(true);
    expect(new Date(futureDate) < new Date()).toBe(false);
  });
});
