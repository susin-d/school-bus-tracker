import request from "supertest";
import { app } from "../src/server";

describe("POST /routes/optimize", () => {
  it("returns an optimized route for a school with students", async () => {
    // These IDs/coords should be replaced with test fixtures or seeded data
    const school_id = "test-school-id";
    // Seed test data or mock DB as needed
    const res = await request(app)
      .post("/routes/optimize")
      .send({ school_id });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("stops");
    expect(Array.isArray(res.body.stops)).toBe(true);
    expect(res.body).toHaveProperty("totalDistance");
  });

  it("returns 400 if school_id is missing", async () => {
    const res = await request(app)
      .post("/routes/optimize")
      .send({});
    expect(res.status).toBe(400);
  });
});
