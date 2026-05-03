import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const N8N_URL = "https://dseiji.app.n8n.cloud/webhook/ga4-cro-analysis";

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getLastMonthRange() {
  const now = new Date();

  const firstDayLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );

  const lastDayLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0
  );

  return {
    startDate: formatDate(firstDayLastMonth),
    endDate: formatDate(lastDayLastMonth)
  };
}

function resolveDates(args = {}) {
  const { startDate, endDate, period } = args;

  if (startDate && endDate) {
    return { startDate, endDate };
  }

  if (period === "last_month") {
    return getLastMonthRange();
  }

  if (period === "last_7_days") {
    return {
      startDate: "7daysAgo",
      endDate: "today"
    };
  }

  if (period === "last_30_days") {
    return {
      startDate: "30daysAgo",
      endDate: "today"
    };
  }

  return {
    startDate: "30daysAgo",
    endDate: "today"
  };
}

function createServer() {
  const server = new McpServer({
    name: "ga4-cro-mcp",
    version: "1.0.0"
  });

  server.registerTool(
    "get_ga4_cro_analysis",
    {
      title: "GA4 CRO Analysis",
      description:
        "Consulta o GA4 via n8n e retorna análise de CRO por período.",
      inputSchema: {
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        period: z
          .enum(["last_7_days", "last_30_days", "last_month"])
          .optional()
      }
    },
    async (args) => {
      const { startDate, endDate } = resolveDates(args);

      const response = await fetch(N8N_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          startDate,
          endDate
        })
      });

      const data = await response.json();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              status: "ok",
              requestedPeriod: args.period || null,
              startDate,
              endDate,
              data
            })
          }
        ]
      };
    }
  );

  return server;
}

app.get("/", (req, res) => {
  res.send("MCP Server Running");
});

app.post("/mcp", async (req, res) => {
  const server = createServer();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MCP Server running on port ${port}`);
});
