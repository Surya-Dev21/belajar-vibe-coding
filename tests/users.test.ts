import { describe, it, expect, beforeEach } from "bun:test";
import { app, db, cleanDatabase, createTestUser } from "./setup";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";

describe("Root & Health Endpoints", () => {
  it("GET / should return welcome message and status ok", async () => {
    const res = await app.handle(new Request("http://localhost/"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.message).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  it("GET /health should return healthy status and uptime", async () => {
    const res = await app.handle(new Request("http://localhost/health"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(typeof body.uptime).toBe("number");
  });
});

describe("Users Endpoints", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /api/users", () => {
    it("should return empty array when no users exist", async () => {
      const res = await app.handle(new Request("http://localhost/api/users"));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });

    it("should return array of users after inserting users", async () => {
      await createTestUser({
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      });
      await createTestUser({
        name: "Bob",
        email: "bob@example.com",
        password: "password123",
      });

      const res = await app.handle(new Request("http://localhost/api/users"));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);
      expect(body[0].email).toBe("alice@example.com");
      expect(body[1].email).toBe("bob@example.com");
    });

    it("should not expose plaintext password if password is in response", async () => {
      await createTestUser({
        name: "Charlie",
        email: "charlie@example.com",
        password: "plainpassword",
      });

      const res = await app.handle(new Request("http://localhost/api/users"));
      expect(res.status).toBe(200);

      const body = await res.json();
      if (body[0].password) {
        expect(body[0].password).not.toBe("plainpassword");
        expect(body[0].password.startsWith("$2")).toBe(true);
      }
    });
  });

  describe("POST /api/users", () => {
    it("should register a new user successfully", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toBe("OK");
    });

    it("should return 400 when registering with already registered email", async () => {
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "duplicate@example.com",
            password: "password123",
          }),
        })
      );

      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Another John",
            email: "duplicate@example.com",
            password: "password456",
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Email sudah terdaftar");
    });

    it("should return 422 when name is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "noname@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when email is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "No Email",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when password is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "No Password",
            email: "nopass@example.com",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when body is empty object", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when email format is invalid", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Invalid Email",
            email: "bukan-email",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should store password as bcrypt hash and not plaintext in database", async () => {
      const rawPassword = "mysecretpassword";
      await app.handle(
        new Request("http://localhost/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Secure User",
            email: "secure@example.com",
            password: rawPassword,
          }),
        })
      );

      const dbUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, "secure@example.com"));

      expect(dbUsers.length).toBe(1);
      expect(dbUsers[0].password).not.toBe(rawPassword);
      expect(dbUsers[0].password.startsWith("$2")).toBe(true);

      const isMatch = await Bun.password.verify(rawPassword, dbUsers[0].password);
      expect(isMatch).toBe(true);
    });
  });
});
