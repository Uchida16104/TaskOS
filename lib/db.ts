import { Pool } from "pg";

export type TaskStatus = "todo" | "doing" | "done";

export type TaskRow = {
  id: number;
  title: string;
  details: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __taskOsPool: Pool | undefined;
}

function getPool(): Pool {
  if (globalThis.__taskOsPool) {
    return globalThis.__taskOsPool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const pool = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : undefined,
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__taskOsPool = pool;
  }

  return pool;
}

export async function ensureSchema(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL CHECK (length(trim(title)) > 0),
      details TEXT,
      status TEXT NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo','doing','done')),
      priority INTEGER NOT NULL DEFAULT 2
        CHECK (priority BETWEEN 1 AND 5),
      due_date DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS tasks_status_idx
    ON tasks(status);
  `);
}

export async function listTasks(): Promise<TaskRow[]> {
  await ensureSchema();

  const result = await getPool().query<TaskRow>(`
    SELECT
      id,
      title,
      details,
      status,
      priority,
      due_date,
      created_at,
      updated_at
    FROM tasks
    ORDER BY updated_at DESC,id DESC;
  `);

  return result.rows;
}

export async function createTask(input: {
  title: string;
  details?: string;
  status?: TaskStatus;
  priority?: number;
  dueDate?: string |null;
}): Promise<TaskRow> {

  await ensureSchema();

  const title = input.title.trim();

  if (!title) {
    throw new Error("title is required");
  }

  const result = await getPool().query<TaskRow>(
    `
    INSERT INTO tasks
    (
      title,
      details,
      status,
      priority,
      due_date
    )
    VALUES
    (
      $1,$2,$3,$4,$5
    )
    RETURNING
      id,
      title,
      details,
      status,
      priority,
      due_date,
      created_at,
      updated_at;
    `,
    [
      title,
      input.details?.trim() || null,
      input.status ?? "todo",
      normalizePriority(input.priority ?? 2),
      input.dueDate ?? null,
    ]
  );

  return result.rows[0];
}

export async function updateTask(
  id: number,
  input: Partial<{
    title: string;
    details: string;
    status: TaskStatus;
    priority: number;
    dueDate: string | null;
  }>
): Promise<TaskRow | null> {

  await ensureSchema();

  const fields: string[] = [];
  const values: Array<string | number | null> = [];

  const push = (
    column: string,
    value: string | number | null
  ) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (typeof input.title === "string") {
    const title = input.title.trim();

    if (!title) {
      throw new Error("title is required");
    }

    push("title", title);
  }

  if (typeof input.details === "string") {
    push("details", input.details.trim() || null);
  }

  if (input.status) {
    push("status", input.status);
  }

  if (typeof input.priority === "number") {
    push("priority", normalizePriority(input.priority));
  }

  if (Object.prototype.hasOwnProperty.call(input, "dueDate")) {
    push("due_date", input.dueDate ?? null);
  }

  if (fields.length === 0) {

    const existing = await getPool().query<TaskRow>(
      `
      SELECT
        id,
        title,
        details,
        status,
        priority,
        due_date,
        created_at,
        updated_at
      FROM tasks
      WHERE id = $1
      `,
      [id]
    );

    return existing.rows[0] ?? null;
  }

  values.push(id);

  const sql = `
    UPDATE tasks
    SET
      ${fields.join(", ")},
      updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING
      id,
      title,
      details,
      status,
      priority,
      due_date,
      created_at,
      updated_at;
  `;

  const result = await getPool().query<TaskRow>(
    sql,
    values
  );

  return result.rows[0] ?? null;
}

export async function deleteTask(
  id: number
): Promise<boolean> {

  await ensureSchema();

  const result = await getPool().query(
    `
    DELETE FROM tasks
    WHERE id = $1
    `,
    [id]
  );

  return (result.rowCount ?? 0) > 0;
}

function normalizePriority(value: number): number {
  if (!Number.isFinite(value)) {
    return 2;
  }

  return Math.min(
    5,
    Math.max(
      1,
      Math.round(value)
    )
  );
}
