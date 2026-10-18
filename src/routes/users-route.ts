import { Elysia, t } from "elysia";
import { registerUser, getCurrentUser } from "../services/users-service";
import { loginUser, logoutUser } from "../services/sessions-service";

function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }
  const token = authorization.slice(7).trim();
  return token || null;
}

export const usersRoute = new Elysia({ prefix: "/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await registerUser(body);
        set.status = 201;
        return result;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message || "Gagal mendaftarkan user" };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 255 }),
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        tags: ["Users"],
        summary: "Registrasi pengguna baru",
        description: "Mendaftarkan user baru dengan email unik dan password yang di-hash dengan bcrypt.",
      },
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const result = await loginUser(body);
        set.status = 200;
        return result;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message || "Email atau password salah" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email", maxLength: 255 }),
        password: t.String({ minLength: 1, maxLength: 255 }),
      }),
      detail: {
        tags: ["Auth"],
        summary: "Login pengguna",
        description: "Verifikasi email dan password, kemudian mengembalikan UUID session token baru.",
      },
    }
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers["authorization"]);
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const result = await getCurrentUser(token);
        set.status = 200;
        return result;
      } catch (error: any) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Mendapatkan profil user yang sedang login",
        description: "Membutuhkan header Authorization dengan format 'Bearer <token>'.",
        security: [{ bearerAuth: [] }],
      },
    }
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
      try {
        const token = extractBearerToken(headers["authorization"]);
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized" };
        }

        const result = await logoutUser(token);
        set.status = 200;
        return result;
      } catch (error: any) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Logout pengguna",
        description: "Menghapus token sesi dari database sehingga token tidak lagi valid.",
        security: [{ bearerAuth: [] }],
      },
    }
  );
