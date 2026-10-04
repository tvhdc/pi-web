import { hasJsonContentType, isApiRequestAllowed } from "@/lib/request-security";
import {
  createAgentStyle,
  deleteAgentStyle,
  listAgentStyles,
  updateAgentStyle,
} from "@/lib/agent-styles";

// GET /api/agent-styles — stored styles (id, name, content)
export async function GET(req: Request) {
  if (!isApiRequestAllowed(req)) {
    return Response.json({ error: "Untrusted API request" }, { status: 403 });
  }
  try {
    return Response.json({ styles: listAgentStyles() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// POST /api/agent-styles — { name: string, content: string }
export async function POST(req: Request) {
  if (!isApiRequestAllowed(req)) {
    return Response.json({ error: "Untrusted API request" }, { status: 403 });
  }
  if (!hasJsonContentType(req)) {
    return Response.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  try {
    const raw: unknown = await req.json().catch(() => null);
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
    }
    const body = raw as { name?: unknown; content?: unknown };
    const style = createAgentStyle(body.name, body.content);
    return Response.json({ style }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

// PUT /api/agent-styles — { id: string, name?: string, content?: string }
export async function PUT(req: Request) {
  if (!isApiRequestAllowed(req)) {
    return Response.json({ error: "Untrusted API request" }, { status: 403 });
  }
  if (!hasJsonContentType(req)) {
    return Response.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  try {
    const raw: unknown = await req.json().catch(() => null);
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
    }
    const body = raw as { id?: unknown; name?: unknown; content?: unknown };
    if (typeof body.id !== "string" || body.id.length === 0) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }
    const style = updateAgentStyle(body.id, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
    });
    return Response.json({ style });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 404 });
  }
}

// DELETE /api/agent-styles — { id: string }
export async function DELETE(req: Request) {
  if (!isApiRequestAllowed(req)) {
    return Response.json({ error: "Untrusted API request" }, { status: 403 });
  }
  if (!hasJsonContentType(req)) {
    return Response.json({ error: "Content-Type must be application/json" }, { status: 415 });
  }
  try {
    const raw: unknown = await req.json().catch(() => null);
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
    }
    const body = raw as { id?: unknown };
    if (typeof body.id !== "string" || body.id.length === 0) {
      return Response.json({ error: "id is required" }, { status: 400 });
    }
    deleteAgentStyle(body.id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 404 });
  }
}
