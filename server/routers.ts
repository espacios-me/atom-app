import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

// ─── Atom System Prompt ───────────────────────────────────────
const SYSTEM_PROMPT = `
You are Atom, a personal memory assistant.
You remember what matters, remind at the right time, and help the user stay aligned with their goals.

PERSONALITY: Warm, concise, intelligent. Never robotic. Speak like a thoughtful assistant.

CORE RULES:
1. Only write long-term memories when the user EXPLICITLY asks ("remember", "save this", "note that") OR you detect a stable preference/fact with very high confidence.
2. NEVER store: passport numbers, card numbers, OTPs, passwords, or any PII that could cause harm if leaked.
3. Be CONSERVATIVE with memory – 5 high-quality memories beat 50 noisy ones.
4. Always return ONLY valid JSON matching the schema. No preamble. No markdown. No explanation outside the JSON.
5. If the user seems to be testing or joking, set intent to "chat" and memories_to_save to [].
6. goal_alignment_score: 0.0–1.0 measuring how well this message aligns with the user's stated goals.

INTENT CLASSIFICATION:
- "chat"          → normal conversation
- "remember"      → user explicitly wants something saved
- "recall"        → user asks what you remember
- "remind"        → user sets a future reminder
- "delete_memory" → user wants to delete a specific memory
- "erase_all"     → user says "erase me", "delete all my data", "forget everything"
- "goals"         → user discusses or updates their goals
- "log_behavior"  → user shares actions/behaviors worth tracking (workouts, meals, habits)
- "opt_out"       → user wants to stop receiving messages
- "opt_in"        → user wants to resume

MEMORY QUALITY RULES:
- importance 5: core identity facts ("My name is X", "I have diabetes")
- importance 4: stable strong preferences ("I hate phone calls", "I'm vegetarian")
- importance 3: useful context ("Working on Project Y", "Client Z prefers email")
- importance 2: mildly useful ("I like coffee in the morning")
- importance 1: ephemeral notes (low value – be very selective)

REMINDER PARSING:
- If no explicit time: set due_at_iso to tomorrow 9:00 AM in the user's timezone.
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

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  atom: router({
    chat: publicProcedure
      .input(
        z.object({
          userText: z.string().min(1).max(4000),
          recentTurns: z
            .array(z.object({ role: z.string(), text: z.string() }))
            .max(20)
            .default([]),
          memories: z
            .array(
              z.object({
                index: z.number(),
                kind: z.string(),
                importance: z.number(),
                text: z.string(),
              })
            )
            .max(30)
            .default([]),
          goals: z.array(z.string()).max(20).default([]),
          currentDate: z.string().default(() => new Date().toISOString()),
        })
      )
      .mutation(async ({ input }) => {
        const memBlock =
          input.memories.length
            ? input.memories
                .map((m) => `[${m.index}] (${m.kind}, importance:${m.importance}) ${m.text}`)
                .join("\n")
            : "(no memories stored yet)";

        const goalBlock =
          input.goals.length
            ? input.goals.map((g) => `• ${g}`).join("\n")
            : "(no goals set yet)";

        const turnBlock =
          input.recentTurns.length
            ? input.recentTurns
                .map((t) => `${t.role === "user" ? "User" : "Atom"}: ${t.text}`)
                .join("\n")
            : "(no prior conversation)";

        const userPrompt = [
          `Current date/time: ${input.currentDate}`,
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
          input.userText,
        ].join("\n");

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

          // Coerce arrays in case of partial schema violations
          parsed.memories_to_save = Array.isArray(parsed.memories_to_save) ? parsed.memories_to_save : [];
          parsed.delete_memory_indexes = Array.isArray(parsed.delete_memory_indexes) ? parsed.delete_memory_indexes : [];
          parsed.goals_to_save = Array.isArray(parsed.goals_to_save) ? parsed.goals_to_save : [];
          parsed.behavior_events = Array.isArray(parsed.behavior_events) ? parsed.behavior_events : [];
          if (typeof parsed.goal_alignment_score !== "number") parsed.goal_alignment_score = 0.5;

          return parsed;
        } catch (err) {
          console.error("[Atom] chat error:", err);
          return {
            intent: "chat",
            reply: "I'm having a little trouble thinking right now. Could you try again?",
            memories_to_save: [],
            delete_memory_indexes: [],
            goals_to_save: [],
            reminder: null,
            behavior_events: [],
            goal_alignment_score: 0.5,
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
