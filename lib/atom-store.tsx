import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Memory,
  Goal,
  Reminder,
  BehaviorEvent,
  ChatMessage,
  AIResponse,
  MemoryKind,
  Recurrence,
  BehaviorCategory,
} from "@/types/atom";

// ─── Storage Keys ────────────────────────────────────────────
const KEYS = {
  MEMORIES: "atom:memories",
  GOALS: "atom:goals",
  REMINDERS: "atom:reminders",
  BEHAVIORS: "atom:behaviors",
  MESSAGES: "atom:messages",
};

// ─── State ───────────────────────────────────────────────────
interface AtomState {
  memories: Memory[];
  goals: Goal[];
  reminders: Reminder[];
  behaviors: BehaviorEvent[];
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
}

const initialState: AtomState = {
  memories: [],
  goals: [],
  reminders: [],
  behaviors: [],
  messages: [],
  isLoading: true,
  isTyping: false,
};

// ─── Actions ─────────────────────────────────────────────────
type Action =
  | { type: "HYDRATE"; payload: Partial<AtomState> }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_TYPING"; payload: boolean }
  | { type: "ADD_MEMORIES"; payload: Memory[] }
  | { type: "DELETE_MEMORY"; payload: string }
  | { type: "ADD_GOALS"; payload: Goal[] }
  | { type: "UPDATE_GOAL"; payload: { id: string; updates: Partial<Goal> } }
  | { type: "DELETE_GOAL"; payload: string }
  | { type: "ADD_REMINDER"; payload: Reminder }
  | { type: "DELETE_REMINDER"; payload: string }
  | { type: "ADD_BEHAVIORS"; payload: BehaviorEvent[] }
  | { type: "ERASE_ALL" };

function reducer(state: AtomState, action: Action): AtomState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, isLoading: false };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_TYPING":
      return { ...state, isTyping: action.payload };
    case "ADD_MEMORIES":
      return { ...state, memories: [...state.memories, ...action.payload] };
    case "DELETE_MEMORY":
      return { ...state, memories: state.memories.filter((m) => m.id !== action.payload) };
    case "ADD_GOALS":
      return { ...state, goals: [...state.goals, ...action.payload] };
    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload.updates } : g
        ),
      };
    case "DELETE_GOAL":
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload) };
    case "ADD_REMINDER":
      return { ...state, reminders: [...state.reminders, action.payload] };
    case "DELETE_REMINDER":
      return { ...state, reminders: state.reminders.filter((r) => r.id !== action.payload) };
    case "ADD_BEHAVIORS":
      return { ...state, behaviors: [...state.behaviors, ...action.payload] };
    case "ERASE_ALL":
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────
interface AtomContextValue {
  state: AtomState;
  sendMessage: (text: string) => Promise<void>;
  addMemory: (memory: Omit<Memory, "id" | "timestamp">) => void;
  deleteMemory: (id: string) => void;
  addGoal: (goalText: string) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, "id" | "createdAt" | "status">) => void;
  deleteReminder: (id: string) => void;
  eraseAll: () => void;
}

const AtomContext = createContext<AtomContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────
function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function persist(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("[AtomStore] persist error:", e);
  }
}

// ─── Provider ────────────────────────────────────────────────
export function AtomProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const [memories, goals, reminders, behaviors, messages] = await Promise.all([
          AsyncStorage.getItem(KEYS.MEMORIES),
          AsyncStorage.getItem(KEYS.GOALS),
          AsyncStorage.getItem(KEYS.REMINDERS),
          AsyncStorage.getItem(KEYS.BEHAVIORS),
          AsyncStorage.getItem(KEYS.MESSAGES),
        ]);
        dispatch({
          type: "HYDRATE",
          payload: {
            memories: memories ? JSON.parse(memories) : [],
            goals: goals ? JSON.parse(goals) : [],
            reminders: reminders ? JSON.parse(reminders) : [],
            behaviors: behaviors ? JSON.parse(behaviors) : [],
            messages: messages ? JSON.parse(messages) : [],
          },
        });
      } catch (e) {
        console.warn("[AtomStore] hydrate error:", e);
        dispatch({ type: "HYDRATE", payload: {} });
      }
    })();
  }, []);

  // Persist whenever data changes
  useEffect(() => {
    if (!state.isLoading) {
      persist(KEYS.MEMORIES, state.memories);
      persist(KEYS.GOALS, state.goals);
      persist(KEYS.REMINDERS, state.reminders);
      persist(KEYS.BEHAVIORS, state.behaviors);
      // Only persist last 100 messages to avoid storage bloat
      persist(KEYS.MESSAGES, state.messages.slice(-100));
    }
  }, [state.memories, state.goals, state.reminders, state.behaviors, state.messages, state.isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: uuid(),
        role: "user",
        text,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_MESSAGE", payload: userMsg });
      dispatch({ type: "SET_TYPING", payload: true });

      try {
        // Build context for AI
        const recentTurns = state.messages.slice(-10).map((m) => ({
          role: m.role,
          text: m.text,
        }));
        const memoriesContext = state.memories.slice(-20).map((m, i) => ({
          index: i + 1,
          kind: m.kind,
          importance: m.importance,
          text: m.text,
        }));
        const goalsContext = state.goals.filter((g) => g.status === "active").map((g) => g.goal);

        const response = await fetch("/api/trpc/atom.chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            json: {
              userText: text,
              recentTurns,
              memories: memoriesContext,
              goals: goalsContext,
              currentDate: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const trpcResult = await response.json();
        const aiData: AIResponse = trpcResult?.result?.data?.json ?? trpcResult;

        // Save memories
        const newMemories: Memory[] = (aiData.memories_to_save ?? []).map((m: any) => ({
          id: uuid(),
          kind: m.kind as MemoryKind,
          importance: m.importance,
          text: m.text,
          timestamp: new Date().toISOString(),
        }));
        if (newMemories.length > 0) dispatch({ type: "ADD_MEMORIES", payload: newMemories });

        // Save goals
        const newGoals: Goal[] = (aiData.goals_to_save ?? []).map((g: string) => ({
          id: uuid(),
          goal: g,
          status: "active",
          timestamp: new Date().toISOString(),
        }));
        if (newGoals.length > 0) dispatch({ type: "ADD_GOALS", payload: newGoals });

        // Save reminder
        if (aiData.reminder) {
          const newReminder: Reminder = {
            id: uuid(),
            title: aiData.reminder.title,
            dueAt: aiData.reminder.due_at_iso,
            recurrence: aiData.reminder.recurrence as Recurrence,
            status: "scheduled",
            createdAt: new Date().toISOString(),
          };
          dispatch({ type: "ADD_REMINDER", payload: newReminder });
        }

        // Save behavior events
        const newBehaviors: BehaviorEvent[] = (aiData.behavior_events ?? []).map((b: any) => ({
          id: uuid(),
          event: b.event,
          category: b.category as BehaviorCategory,
          notes: b.notes,
          timestamp: new Date().toISOString(),
        }));
        if (newBehaviors.length > 0) dispatch({ type: "ADD_BEHAVIORS", payload: newBehaviors });

        // Add AI reply message
        const assistantMsg: ChatMessage = {
          id: uuid(),
          role: "assistant",
          text: aiData.reply ?? "I'm not sure how to respond to that.",
          timestamp: new Date().toISOString(),
          intent: aiData.intent,
          memoriesSaved: newMemories.length,
          goalsSaved: newGoals.length,
          reminderSet: aiData.reminder !== null,
        };
        dispatch({ type: "ADD_MESSAGE", payload: assistantMsg });
      } catch (err) {
        console.error("[AtomStore] sendMessage error:", err);
        const errorMsg: ChatMessage = {
          id: uuid(),
          role: "assistant",
          text: "I'm having a little trouble thinking right now. Could you try again?",
          timestamp: new Date().toISOString(),
          intent: "chat",
        };
        dispatch({ type: "ADD_MESSAGE", payload: errorMsg });
      } finally {
        dispatch({ type: "SET_TYPING", payload: false });
      }
    },
    [state.messages, state.memories, state.goals]
  );

  const addMemory = useCallback((memory: Omit<Memory, "id" | "timestamp">) => {
    dispatch({
      type: "ADD_MEMORIES",
      payload: [{ ...memory, id: uuid(), timestamp: new Date().toISOString() }],
    });
  }, []);

  const deleteMemory = useCallback((id: string) => {
    dispatch({ type: "DELETE_MEMORY", payload: id });
  }, []);

  const addGoal = useCallback((goalText: string) => {
    dispatch({
      type: "ADD_GOALS",
      payload: [{ id: uuid(), goal: goalText, status: "active", timestamp: new Date().toISOString() }],
    });
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    dispatch({ type: "UPDATE_GOAL", payload: { id, updates } });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    dispatch({ type: "DELETE_GOAL", payload: id });
  }, []);

  const addReminder = useCallback((reminder: Omit<Reminder, "id" | "createdAt" | "status">) => {
    dispatch({
      type: "ADD_REMINDER",
      payload: { ...reminder, id: uuid(), createdAt: new Date().toISOString(), status: "scheduled" },
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    dispatch({ type: "DELETE_REMINDER", payload: id });
  }, []);

  const eraseAll = useCallback(() => {
    dispatch({ type: "ERASE_ALL" });
    AsyncStorage.multiRemove([KEYS.MEMORIES, KEYS.GOALS, KEYS.REMINDERS, KEYS.BEHAVIORS, KEYS.MESSAGES]);
  }, []);

  return (
    <AtomContext.Provider
      value={{
        state,
        sendMessage,
        addMemory,
        deleteMemory,
        addGoal,
        updateGoal,
        deleteGoal,
        addReminder,
        deleteReminder,
        eraseAll,
      }}
    >
      {children}
    </AtomContext.Provider>
  );
}

export function useAtom(): AtomContextValue {
  const ctx = useContext(AtomContext);
  if (!ctx) throw new Error("useAtom must be used within AtomProvider");
  return ctx;
}
