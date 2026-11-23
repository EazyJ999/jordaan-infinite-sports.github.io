import type { Sql } from "@/lib/db";
import { readDataFile, writeDataFile } from "@/lib/disk-store";

const PATH = "catalog/accounts.json";

type Row = Record<string, unknown>;

type Snapshot = {
  users: Row[];
  accounts: Row[];
  sessions: Row[];
  owners: Row[];
};

function asText(value: unknown) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asBool(value: unknown) {
  return value === true || value === "true" || value === "t";
}

async function readSnapshot(): Promise<Snapshot | null> {
  const local = await readDataFile(PATH);
  if (local) {
    try {
      const parsed = JSON.parse(local) as Partial<Snapshot>;
      if (parsed && Array.isArray(parsed.users)) {
        return {
          users: parsed.users,
          accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          owners: Array.isArray(parsed.owners) ? parsed.owners : [],
        };
      }
    } catch {
      // Fall through to the remote copy.
    }
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const { get } = await import("@vercel/blob");
  const result = await get(PATH, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const parsed = JSON.parse(await new Response(result.stream).text()) as Partial<Snapshot>;
  if (!parsed || !Array.isArray(parsed.users)) return null;
  const snapshot = {
    users: parsed.users,
    accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    owners: Array.isArray(parsed.owners) ? parsed.owners : [],
  };
  if (process.env.DATA_DIR) await writeDataFile(PATH, JSON.stringify(snapshot));
  return snapshot;
}

/** Put saved logins back before sign-in. A new server would otherwise forget them. */
export async function pullAccounts(sql: Sql) {
  try {
    const snap = await readSnapshot();
    if (!snap || snap.users.length === 0) return;
    for (const row of snap.users) {
      const id = asText(row.id);
      const email = asText(row.email);
      if (!id || !email) continue;
      await sql`
        insert into "user" ("id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt")
        values (
          ${id},
          ${asText(row.name) || "Admin"},
          ${email},
          ${asBool(row.emailVerified)},
          ${asText(row.image)},
          ${asText(row.createdAt) || new Date().toISOString()},
          ${asText(row.updatedAt) || new Date().toISOString()}
        )
        on conflict ("id") do update set
          "name" = excluded."name",
          "email" = excluded."email",
          "emailVerified" = excluded."emailVerified",
          "image" = excluded."image",
          "updatedAt" = excluded."updatedAt"
      `;
    }
    for (const row of snap.accounts) {
      const id = asText(row.id);
      const userId = asText(row.userId);
      if (!id || !userId) continue;
      await sql`
        insert into "account" (
          "id", "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken",
          "accessTokenExpiresAt", "refreshTokenExpiresAt", "scope", "password", "createdAt", "updatedAt"
        )
        values (
          ${id},
          ${asText(row.accountId) || id},
          ${asText(row.providerId) || "credential"},
          ${userId},
          ${asText(row.accessToken)},
          ${asText(row.refreshToken)},
          ${asText(row.idToken)},
          ${asText(row.accessTokenExpiresAt)},
          ${asText(row.refreshTokenExpiresAt)},
          ${asText(row.scope)},
          ${asText(row.password)},
          ${asText(row.createdAt) || new Date().toISOString()},
          ${asText(row.updatedAt) || new Date().toISOString()}
        )
        on conflict ("id") do update set
          "password" = excluded."password",
          "accountId" = excluded."accountId",
          "providerId" = excluded."providerId",
          "userId" = excluded."userId",
          "updatedAt" = excluded."updatedAt"
      `;
    }
    for (const row of snap.sessions) {
      const id = asText(row.id);
      const token = asText(row.token);
      const userId = asText(row.userId);
      if (!id || !token || !userId) continue;
      await sql`
        insert into "session" ("id", "expiresAt", "token", "createdAt", "updatedAt", "ipAddress", "userAgent", "userId")
        values (
          ${id},
          ${asText(row.expiresAt) || new Date(Date.now() + 7 * 86400000).toISOString()},
          ${token},
          ${asText(row.createdAt) || new Date().toISOString()},
          ${asText(row.updatedAt) || new Date().toISOString()},
          ${asText(row.ipAddress)},
          ${asText(row.userAgent)},
          ${userId}
        )
        on conflict ("id") do update set
          "expiresAt" = excluded."expiresAt",
          "token" = excluded."token",
          "updatedAt" = excluded."updatedAt"
      `;
    }
    for (const row of snap.owners) {
      const id = Number(row.id);
      if (!Number.isInteger(id)) continue;
      await sql`
        insert into shop_owner (id, user_id, seeded)
        values (${id}, ${asText(row.user_id)}, ${asBool(row.seeded)})
        on conflict (id) do update set
          user_id = excluded.user_id,
          seeded = shop_owner.seeded or excluded.seeded
      `;
    }
  } catch (err) {
    console.error("[accounts] restore failed", err);
  }
}

/** Keep the admin login so the next visit can use the same email and password. */
export async function pushAccounts(sql: Sql) {
  const users = await sql<Row>`select "id", "name", "email", "emailVerified", "image", "createdAt"::text, "updatedAt"::text from "user"`;
  const accounts = await sql<Row>`
    select "id", "accountId", "providerId", "userId", "password", "createdAt"::text, "updatedAt"::text
    from "account"
  `;
  const sessions = await sql<Row>`
    select "id", "expiresAt"::text, "token", "createdAt"::text, "updatedAt"::text, "ipAddress", "userAgent", "userId"
    from "session"
  `;
  const owners = await sql<Row>`select id, user_id, seeded from shop_owner`;
  if (users.length === 0) return;
  const body: Snapshot = { users, accounts, sessions, owners };
  if (process.env.DATA_DIR) {
    await writeDataFile(PATH, JSON.stringify(body));
    return;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  const { put } = await import("@vercel/blob");
  await put(PATH, JSON.stringify(body), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}
