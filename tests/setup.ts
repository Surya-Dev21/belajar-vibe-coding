import { app } from "../src/index";
import { db } from "../src/db";
import { users, sessions } from "../src/db/schema";

export { app, db };

export async function cleanDatabase() {
  await db.delete(sessions);
  await db.delete(users);
}

export async function createTestUser(userData = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
}) {
  const hashedPassword = await Bun.password.hash(userData.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  const [result] = await db.insert(users).values({
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
  });

  return {
    ...userData,
    id: result.insertId,
  };
}
