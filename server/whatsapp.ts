/**
 * WhatsApp Cloud API Webhook Handler
 * ─────────────────────────────────────────────────────────────
 * Handles:
 *  GET  /webhook/whatsapp  → Meta verification challenge
 *  POST /webhook/whatsapp  → Incoming messages from WhatsApp
 *
 * Required env vars:
 *   WHATSAPP_TOKEN           – Bearer token for sending messages
 *   WHATSAPP_PHONE_NUMBER_ID – Your WhatsApp phone number ID
 *   WHATSAPP_APP_SECRET      – App secret for signature verification (optional)
 *   WEBHOOK_VERIFY_TOKEN     – Token you set in Meta webhook settings
 *   OPENAI_API_KEY           – Already configured
 */

import type { Express, Request, Response } from "express";
import { invokeLLM } from "./_core/llm";

// ─── In-memory conversation store (replace with DB for production) ────────────
const conversationStore = new Map<string, { role: string; text: string }[]>();
const memoryStore = new Map<string, { index: number; kind: string; importance: number; text: string }[]>();
const goalStore = new Map<string, string[]>();

// ─── System Prompt (same as tRPC route) ──────────────────────────────────────
const SYSTEM_PROMPT = `
You are Atom, a personal AI memory assistant delivered via WhatsApp.
Your job is to help the user remember things, set goals, create reminders, and log behaviors.

INTENTS (pick exactly one):
- "chat"          → general conversation / question
- "remember"      → user wants to save something
- "recall"        → user wants to retrieve memories
- "remind"        → user wants a reminder
- "delete_memory" → user wants to delete specific memories
- "erase_all"     → user wants to wipe everything
- "goals"         → user wants to set/view goals
- "log_behavior"  → user logging activity (workouts, meals, habits)
- "opt_out"       → user wants to stop receiving messages
- "opt_in"        → user wants to resume

MEMORY QUALITY RULES:
- importance 5: core identity facts ("My name is X", "I have diabetes")
- importance 4: stable strong preferences ("I hate phone calls", "I'm vegetarian")
- importance 3: useful context ("Working on Project Y")
- importance 2: mildly useful ("I like coffee in the morning")
- importance 1: ephemeral notes

REMINDER PARSING:
- If no explicit time: set due_at_iso to tomorrow 9:00 AM in Asia/Dubai timezone.
- Always output due_at_iso in full ISO 8601.
- "reminder" field must be null if no reminder in this message.

Return ONLY valid JSON:
{
  "intent": "<intent string>",
  "reply": "<your reply to the user>",
  "memories_to_save": [{"text":"...","kind":"preference|fact|person|project|note","importance":1}],
  "delete_memory_indexes": [],
  "goals_to_save": ["<goal>"],
  "reminder": null,
  "behavior_events": [{"event":"...","category":"fitness|nutrition|productivity|social|other","notes":"..."}],
  "goal_alignment_score": 0.5
}
`.trim();

// ─── Send a WhatsApp message ──────────────────────────────────────────────────
async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("[WhatsApp] Missing WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID — cannot send message");
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[WhatsApp] Send failed:", err);
  }
}

// ─── Process an incoming WhatsApp message ────────────────────────────────────
async function processMessage(from: string, messageText: string): Promise<void> {
  // Get conversation history
  const recentTurns = conversationStore.get(from) ?? [];
  const memories = memoryStore.get(from) ?? [];
  const goals = goalStore.get(from) ?? [];

  const memBlock = memories.length
    ? memories.map((m) => `[${m.index}] (${m.kind}, importance:${m.importance}) ${m.text}`).join("\n")
    : "(no memories stored yet)";
  const goalBlock = goals.length ? goals.map((g) => `• ${g}`).join("\n") : "(no goals set yet)";
  const turnBlock = recentTurns.length
    ? recentTurns.map((t) => `${t.role === "user" ? "User" : "Atom"}: ${t.text}`).join("\n")
    : "(no prior conversation)";

  const userPrompt = [
    `Current date/time: ${new Date().toISOString()}`,
    `Timezone: Asia/Dubai`,
    ``,
    `=== STORED MEMORIES ===`,
    memBlock,
    ``,
    `=== ACTIVE GOALS ===`,
    goalBlock,
    ``,
    `=== RECENT CONVERSATION ===`,
    turnBlock,
    ``,
    `=== NEW MESSAGE ===`,
    messageText,
  ].join("\n");

  let reply = "I'm having a little trouble thinking right now. Could you try again?";

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (!content) throw new Error("Empty LLM response");

    const parsed = JSON.parse(content);
    reply = parsed.reply ?? reply;

    // Save new memories
    if (Array.isArray(parsed.memories_to_save) && parsed.memories_to_save.length > 0) {
      const existing = memoryStore.get(from) ?? [];
      const newMemories = parsed.memories_to_save.map((m: { text: string; kind: string; importance: number }, i: number) => ({
        index: existing.length + i,
        kind: m.kind ?? "note",
        importance: m.importance ?? 3,
        text: m.text,
      }));
      memoryStore.set(from, [...existing, ...newMemories]);
    }

    // Delete memories by index
    if (Array.isArray(parsed.delete_memory_indexes) && parsed.delete_memory_indexes.length > 0) {
      const existing = memoryStore.get(from) ?? [];
      const filtered = existing.filter((_, i) => !parsed.delete_memory_indexes.includes(i));
      memoryStore.set(from, filtered.map((m, i) => ({ ...m, index: i })));
    }

    // Save goals
    if (Array.isArray(parsed.goals_to_save) && parsed.goals_to_save.length > 0) {
      const existing = goalStore.get(from) ?? [];
      goalStore.set(from, [...existing, ...parsed.goals_to_save]);
    }

    // Erase all
    if (parsed.intent === "erase_all") {
      memoryStore.delete(from);
      goalStore.delete(from);
      conversationStore.delete(from);
    }

    // Update conversation history (keep last 10 turns)
    const updatedTurns = [
      ...recentTurns,
      { role: "user", text: messageText },
      { role: "assistant", text: reply },
    ].slice(-20);
    conversationStore.set(from, updatedTurns);
  } catch (err) {
    console.error("[WhatsApp] AI error:", err);
  }

  await sendWhatsAppMessage(from, reply);
}

// ─── Register WhatsApp webhook routes ────────────────────────────────────────
export function registerWhatsAppWebhook(app: Express): void {
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN ?? "atom_imperial_2026";

  // GET: Meta webhook verification
  app.get("/webhook/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp] Webhook verified ✓");
      res.status(200).send(challenge);
    } else {
      console.warn("[WhatsApp] Webhook verification failed — token mismatch");
      res.sendStatus(403);
    }
  });

  // POST: Incoming messages
  app.post("/webhook/whatsapp", (req: Request, res: Response) => {
    // Acknowledge immediately (Meta requires < 5s response)
    res.sendStatus(200);

    const body = req.body;
    if (body?.object !== "whatsapp_business_account") return;

    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const messages = change?.value?.messages ?? [];
        for (const msg of messages) {
          if (msg?.type !== "text") continue; // Only handle text for now
          const from: string = msg.from;
          const text: string = msg.text?.body ?? "";
          if (!from || !text) continue;

          console.log(`[WhatsApp] Message from ${from}: ${text.slice(0, 80)}`);
          // Process async — don't await (already sent 200)
          processMessage(from, text).catch((err) =>
            console.error("[WhatsApp] processMessage error:", err)
          );
        }
      }
    }
  });

  console.log("[WhatsApp] Webhook registered at /webhook/whatsapp");
}
