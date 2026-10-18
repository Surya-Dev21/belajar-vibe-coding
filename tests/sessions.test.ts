import { describe, it, expect, beforeEach } from "bun:test";
import { app, cleanDatabase, createTestUser } from "./setup";

describe("Sessions Endpoints", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("POST /api/users/login", () => {
    it("should login successfully with valid email and password", async () => {
      await createTestUser({
        name: "Login User",
        email: "login@example.com",
        password: "password123",
      });

      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "login@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(typeof body.data).toBe("string");
      expect(body.data.length).toBeGreaterThan(0);
    });

    it("should return 400 when email is not registered", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "notfound@example.com",
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Email atau password salah");
    });

    it("should return 400 when password is wrong", async () => {
      await createTestUser({
        name: "Wrong Pass User",
        email: "wrongpass@example.com",
        password: "correctpassword",
      });

      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "wrongpass@example.com",
            password: "wrongpassword",
          }),
        })
      );

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Email atau password salah");
    });

    it("should return 422 when email is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: "password123",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when password is missing", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "user@example.com",
          }),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return 422 when body is empty object", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );

      expect(res.status).toBe(422);
    });

    it("should return different tokens on multiple logins for the same user (multi-session)", async () => {
      await createTestUser({
        name: "Multi User",
        email: "multi@example.com",
        password: "password123",
      });

      const res1 = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "multi@example.com",
            password: "password123",
          }),
        })
      );
      const body1 = await res1.json();

      const res2 = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "multi@example.com",
            password: "password123",
          }),
        })
      );
      const body2 = await res2.json();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(body1.data).not.toBe(body2.data);
    });
  });

  describe("GET /api/users/current", () => {
    it("should return user profile with valid Bearer token", async () => {
      await createTestUser({
        name: "Current User",
        email: "current@example.com",
        password: "password123",
      });

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "current@example.com",
            password: "password123",
          }),
        })
      );
      const { data: token } = await loginRes.json();

      const res = await app.handle(
        new Request("http://localhost/api/users/current", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.name).toBe("Current User");
      expect(body.data.email).toBe("current@example.com");
      expect(body.data.id).toBeDefined();
      expect(body.data.created_at).toBeDefined();
    });

    it("should return 401 without Authorization header", async () => {
      const res = await app.handle(new Request("http://localhost/api/users/current"));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when Authorization header does not use Bearer prefix", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/current", {
          headers: {
            Authorization: "Basic somerandomtoken",
          },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid Bearer token", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/current", {
          headers: {
            Authorization: "Bearer invalid-token-12345",
          },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 with empty Bearer token", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/current", {
          headers: {
            Authorization: "Bearer ",
          },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should not include password field in current user response", async () => {
      await createTestUser({
        name: "No Pass Leak",
        email: "nopassleak@example.com",
        password: "secretpassword",
      });

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "nopassleak@example.com",
            password: "secretpassword",
          }),
        })
      );
      const { data: token } = await loginRes.json();

      const res = await app.handle(
        new Request("http://localhost/api/users/current", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.data.password).toBeUndefined();
    });
  });

  describe("DELETE /api/users/logout", () => {
    it("should logout successfully with valid Bearer token", async () => {
      await createTestUser({
        name: "Logout User",
        email: "logout@example.com",
        password: "password123",
      });

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "logout@example.com",
            password: "password123",
          }),
        })
      );
      const { data: token } = await loginRes.json();

      const res = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBe("OK");
    });

    it("should invalidate token after logout so GET /current returns 401", async () => {
      await createTestUser({
        name: "Invalidate User",
        email: "invalidate@example.com",
        password: "password123",
      });

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "invalidate@example.com",
            password: "password123",
          }),
        })
      );
      const { data: token } = await loginRes.json();

      await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const currentRes = await app.handle(
        new Request("http://localhost/api/users/current", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      expect(currentRes.status).toBe(401);
      const body = await currentRes.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 without Authorization header", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 with invalid Bearer token", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: "Bearer invalid-token",
          },
        })
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Unauthorized");
    });

    it("should return 401 when logging out twice with same token", async () => {
      await createTestUser({
        name: "Double Logout",
        email: "double@example.com",
        password: "password123",
      });

      const loginRes = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "double@example.com",
            password: "password123",
          }),
        })
      );
      const { data: token } = await loginRes.json();

      const res1 = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(res1.status).toBe(200);

      const res2 = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );
      expect(res2.status).toBe(401);
      const body2 = await res2.json();
      expect(body2.error).toBe("Unauthorized");
    });
  });
});
