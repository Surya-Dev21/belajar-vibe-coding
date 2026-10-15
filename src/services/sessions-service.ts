import { db } from "../db";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser({ email, password }: LoginInput) {
  // 1. Cari user berdasarkan email
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUsers.length === 0) {
    throw new Error("Email atau password salah");
  }

  const user = existingUsers[0];

  // 2. Verifikasi password dengan hash yang tersimpan
  const isPasswordValid = await Bun.password.verify(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Email atau password salah");
  }

  // 3. Generate session token (UUID v4)
  const token = crypto.randomUUID();

  // 4. Simpan session baru ke database
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { data: token };
}

export async function logoutUser(token: string) {
  // 1. Cek keberadaan sesi berdasarkan token
  const existingSession = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (existingSession.length === 0) {
    throw new Error("Unauthorized");
  }

  // 2. Hapus sesi dari database
  await db.delete(sessions).where(eq(sessions.token, token));

  return { data: "OK" };
}

