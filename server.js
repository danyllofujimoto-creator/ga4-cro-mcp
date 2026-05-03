import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const N8N_URL = "https://dseiji.app.n8n.cloud/webhook/ga4-cro-analysis";

function normalizeDates(args = {}) {
  if (args.startDate && args.endDate) {
    return {
      startDate: args.startDate,
      endDate: args.endDate
    };
  }

  const periodo = args.periodo || args.period || "";

  if (
    periodo === "ultimos_7_dias" ||
    periodo === "últimos_7_dias" ||
    periodo === "last_7_days"
  ) {
    return {
      startDate: "7daysAgo",
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
      description: "Consulta o GA4 via n8n e retorna análise de CRO.",
      inputSchema: {
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        periodo: z.string().optional(),
        period: z.string().optional(),
        analise: z.string().optional()
      }
    },
    async (args) => {
      const { startDate, endDate } = normalizeDates(args);

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
            text: JSON.stringify(data)
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
