function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (err) {
    return null;
  }
}

async function ensureSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function requireDatabase(context) {
  if (!context.env || !context.env.DB) {
    return "Missing D1 binding named DB. In Cloudflare Pages, create a D1 database and bind it to this Pages project with variable name DB.";
  }

  return null;
}

export async function onRequest(context) {
  const missingDbError = requireDatabase(context);
  if (missingDbError) {
    return json({
      ok: false,
      error: missingDbError
    }, 500);
  }

  const request = context.request;
  const db = context.env.DB;
  const url = new URL(request.url);

  try {
    await ensureSchema(db);

    if (request.method === "GET") {
      const result = await db
        .prepare("SELECT id, text, completed, created_at FROM todos ORDER BY id DESC")
        .all();

      return json({
        ok: true,
        todos: result.results || []
      }, 200);
    }

    if (request.method === "POST") {
      const body = await readJson(request);

      if (!body || !body.text || !body.text.trim()) {
        return json({
          ok: false,
          error: "Todo text is required"
        }, 400);
      }

      const text = body.text.trim().slice(0, 300);

      const inserted = await db
        .prepare("INSERT INTO todos (text, completed) VALUES (?, 0) RETURNING id, text, completed, created_at")
        .bind(text)
        .first();

      return json({
        ok: true,
        todo: inserted
      }, 201);
    }

    if (request.method === "PATCH") {
      const body = await readJson(request);

      if (!body || !body.id) {
        return json({
          ok: false,
          error: "Todo id is required"
        }, 400);
      }

      const id = Number(body.id);
      const completed = body.completed ? 1 : 0;

      if (!Number.isInteger(id) || id < 1) {
        return json({
          ok: false,
          error: "Todo id is invalid"
        }, 400);
      }

      const updated = await db
        .prepare("UPDATE todos SET completed = ? WHERE id = ? RETURNING id, text, completed, created_at")
        .bind(completed, id)
        .first();

      if (!updated) {
        return json({
          ok: false,
          error: "Todo not found"
        }, 404);
      }

      return json({
        ok: true,
        todo: updated
      }, 200);
    }

    if (request.method === "DELETE") {
      const id = Number(url.searchParams.get("id"));

      if (!Number.isInteger(id) || id < 1) {
        return json({
          ok: false,
          error: "Todo id is required"
        }, 400);
      }

      await db
        .prepare("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .run();

      return json({
        ok: true
      }, 200);
    }

    return json({
      ok: false,
      error: "Method not allowed"
    }, 405);
  } catch (err) {
    return json({
      ok: false,
      error: err && err.message ? err.message : "Server error"
    }, 500);
  }
}
