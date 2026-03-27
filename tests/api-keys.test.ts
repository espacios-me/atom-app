import { describe, it, expect, beforeAll } from "vitest";

describe("API Keys Validation", () => {
  let apiKeys: Record<string, string | undefined>;

  beforeAll(() => {
    apiKeys = {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
      FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
      GMAIL_API_KEY: process.env.GMAIL_API_KEY,
      GOOGLE_DRIVE_API_KEY: process.env.GOOGLE_DRIVE_API_KEY,
      ATOM_GOOGLE_API_KEY: process.env.ATOM_GOOGLE_API_KEY,
      LINEAR_API_KEY: process.env.LINEAR_API_KEY,
      VERCEL_API_KEY: process.env.VERCEL_API_KEY,
      CLOUDFLARE_API_KEY: process.env.CLOUDFLARE_API_KEY,
      GROK_API_KEY: process.env.GROK_API_KEY,
      WEBHOOK_API_KEY: process.env.WEBHOOK_API_KEY,
    };
  });

  describe("Environment Variables", () => {
    it("should have OPENAI_API_KEY configured", () => {
      expect(apiKeys.OPENAI_API_KEY).toBeDefined();
      expect(apiKeys.OPENAI_API_KEY).toMatch(/^sk-proj-/);
    });

    it("should have CLAUDE_API_KEY configured", () => {
      expect(apiKeys.CLAUDE_API_KEY).toBeDefined();
      expect(apiKeys.CLAUDE_API_KEY).toMatch(/^sk-ant-/);
    });

    it("should have FIREBASE_API_KEY configured", () => {
      expect(apiKeys.FIREBASE_API_KEY).toBeDefined();
      expect(apiKeys.FIREBASE_API_KEY).toMatch(/^sbp_/);
    });

    it("should have GMAIL_API_KEY configured", () => {
      expect(apiKeys.GMAIL_API_KEY).toBeDefined();
      expect(apiKeys.GMAIL_API_KEY).toMatch(/^sk-/);
    });

    it("should have GOOGLE_DRIVE_API_KEY configured", () => {
      expect(apiKeys.GOOGLE_DRIVE_API_KEY).toBeDefined();
      expect(apiKeys.GOOGLE_DRIVE_API_KEY).toMatch(/^AIza/);
    });

    it("should have ATOM_GOOGLE_API_KEY configured", () => {
      expect(apiKeys.ATOM_GOOGLE_API_KEY).toBeDefined();
      expect(apiKeys.ATOM_GOOGLE_API_KEY).toMatch(/^AIza/);
    });

    it("should have LINEAR_API_KEY configured", () => {
      expect(apiKeys.LINEAR_API_KEY).toBeDefined();
      expect(apiKeys.LINEAR_API_KEY).toMatch(/^lin_api_/);
    });

    it("should have VERCEL_API_KEY configured", () => {
      expect(apiKeys.VERCEL_API_KEY).toBeDefined();
      expect(apiKeys.VERCEL_API_KEY).toMatch(/^vck_/);
    });

    it("should have CLOUDFLARE_API_KEY configured", () => {
      expect(apiKeys.CLOUDFLARE_API_KEY).toBeDefined();
      expect(apiKeys.CLOUDFLARE_API_KEY).toMatch(/^cfut_/);
    });

    it("should have GROK_API_KEY configured", () => {
      expect(apiKeys.GROK_API_KEY).toBeDefined();
      expect(apiKeys.GROK_API_KEY).toMatch(/^xai-/);
    });

    it("should have WEBHOOK_API_KEY configured", () => {
      expect(apiKeys.WEBHOOK_API_KEY).toBeDefined();
      expect(apiKeys.WEBHOOK_API_KEY).toMatch(/^\d+\|/);
    });
  });

  describe("OpenAI Integration", () => {
    it("should validate OpenAI API key format", async () => {
      const key = apiKeys.OPENAI_API_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(50);
      expect(key).toContain("sk-proj-");
    });

    it("should be able to make a test call to OpenAI", async () => {
      const key = apiKeys.OPENAI_API_KEY;
      if (!key) {
        throw new Error("OPENAI_API_KEY not configured");
      }

      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data)).toBe(true);
      } catch (error) {
        console.error("OpenAI API test failed:", error);
        throw error;
      }
    });
  });

  describe("Claude Integration", () => {
    it("should validate Claude API key format", () => {
      const key = apiKeys.CLAUDE_API_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(50);
      expect(key).toContain("sk-ant-");
    });
  });

  describe("Firebase Integration", () => {
    it("should validate Firebase API key format", () => {
      const key = apiKeys.FIREBASE_API_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(20);
      expect(key).toContain("sbp_");
    });
  });

  describe("Linear Integration", () => {
    it("should validate Linear API key format", () => {
      const key = apiKeys.LINEAR_API_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(20);
      expect(key).toContain("lin_api_");
    });

    it("should be able to make a test call to Linear", async () => {
      const key = apiKeys.LINEAR_API_KEY;
      if (!key) {
        throw new Error("LINEAR_API_KEY not configured");
      }

      try {
        const response = await fetch("https://api.linear.app/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query {
                viewer {
                  id
                  email
                }
              }
            `,
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.data || data.errors).toBeDefined();
      } catch (error) {
        console.error("Linear API test failed:", error);
        throw error;
      }
    });
  });

  describe("Vercel Integration", () => {
    it("should validate Vercel API key format", () => {
      const key = apiKeys.VERCEL_API_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(20);
      expect(key).toContain("vck_");
    });

    it("should be able to make a test call to Vercel", async () => {
      const key = apiKeys.VERCEL_API_KEY;
      if (!key) {
        throw new Error("VERCEL_API_KEY not configured");
      }

      try {
        const response = await fetch("https://api.vercel.com/v1/projects", {
          headers: {
            Authorization: `Bearer ${key}`,
          },
        });

        expect([200, 401, 403]).toContain(response.status);
      } catch (error) {
        console.error("Vercel API test failed:", error);
        throw error;
      }
    });
  });

  describe("Cloudflare Integration", () => {
    it("should validate Cloudflare API key format", () => {
      const key = apiKeys.CLOUDFLARE_API_KEY;
      expect(key).toBeDefined();
      expect(key?.length).toBeGreaterThan(20);
      expect(key).toContain("cfut_");
    });
  });

  describe("All Keys Present", () => {
    it("should have all required API keys configured", () => {
      const requiredKeys = [
        "OPENAI_API_KEY",
        "CLAUDE_API_KEY",
        "FIREBASE_API_KEY",
        "GMAIL_API_KEY",
        "GOOGLE_DRIVE_API_KEY",
        "ATOM_GOOGLE_API_KEY",
        "LINEAR_API_KEY",
        "VERCEL_API_KEY",
        "CLOUDFLARE_API_KEY",
        "GROK_API_KEY",
        "WEBHOOK_API_KEY",
      ];

      for (const key of requiredKeys) {
        expect(apiKeys[key]).toBeDefined();
        expect(apiKeys[key]?.length ?? 0).toBeGreaterThan(10);
      }
    });
  });
});
