import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { users } from "./db/schema";
import { usersRoute } from "./routes/users-route";

const port = Number(process.env.PORT) || 3000;

export const app = new Elysia()
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Belajar Vibe Coding - API Documentation",
          version: "1.0.0",
          description:
            "Dokumentasi API interaktif untuk autentikasi user dan manajemen sesi dengan ElysiaJS, Drizzle ORM, dan MySQL.",
        },
        tags: [
          { name: "General", description: "Endpoint sistem dan monitoring kesehatan server" },
          { name: "Users", description: "Endpoint manajemen data dan registrasi pengguna" },
          { name: "Auth", description: "Endpoint autentikasi dan manajemen sesi login/logout" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "UUID",
              description: "Masukkan session token UUID yang didapat dari endpoint login",
            },
          },
        },
      },
    })
  )
  .get(
    "/",
    () => ({
      message: "Welcome to Elysia + Bun + Drizzle + MySQL API",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["General"],
        summary: "Welcome message & server status",
      },
    }
  )
  .get(
    "/health",
    () => ({
      status: "healthy",
      uptime: process.uptime(),
    }),
    {
      detail: {
        tags: ["General"],
        summary: "Health check & uptime server",
      },
    }
  )
  .group("/api", (app) =>
    app
      .get(
        "/users",
        async () => {
          try {
            return await db.select().from(users);
          } catch (error: any) {
            return { error: error.message };
          }
        },
        {
          detail: {
            tags: ["Users"],
            summary: "Mendapatkan daftar seluruh user",
          },
        }
      )
      .use(usersRoute)
  );

if (import.meta.main) {
  app.listen(port);
  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
}

