import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/server";

describe("POST /routes/optimize", () => {
  it("returns 400 if school_id is missing", async () => {
    const res = await request(app)
      .post("/routes/optimize")
      .send({});
    expect(res.status).toBe(400);
  });
});
