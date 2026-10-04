import { createFileRoute } from "@tanstack/react-router";
import {
  GET as getAgentStyles,
  POST as postAgentStyles,
  PUT as putAgentStyles,
  DELETE as deleteAgentStyles,
} from "@/app/api/agent-styles/route";

export const Route = createFileRoute("/api/agent-styles")({
  server: {
    handlers: {
      GET: ({ request }) => getAgentStyles(request),
      POST: ({ request }) => postAgentStyles(request),
      PUT: ({ request }) => putAgentStyles(request),
      DELETE: ({ request }) => deleteAgentStyles(request),
    },
  },
});
