import { describe, it, expect } from "vitest";

describe("OpenAI API Key", () => {
  it("should be set in environment", () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeDefined();
    expect(key).toMatch(/^sk-/);
  });

  it("should be able to reach OpenAI API", async () => {
    const key = process.env.OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    expect(response.status).toBe(200);
  }, 15000);
});
