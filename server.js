import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const N8N_URL = "https://dseiji.app.n8n.cloud/webhook/ga4-cro-analysis";

app.post("/mcp", async (req, res) => {
  const { method, params, id } = req.body;

  // 🔹 LISTA DE TOOLS
  if (method === "tools/list") {
    return res.json({
      jsonrpc: "2.0",
      id,
      result: {
        tools: [
          {
            name: "get_ga4_cro_analysis",
            description: "Consulta GA4 via n8n",
            inputSchema: {
              type: "object",
              properties: {
                startDate: { type: "string" },
                endDate: { type: "string" }
              },
              required: ["startDate", "endDate"]
            }
          }
        ]
      }
    });
  }

  // 🔹 EXECUTA TOOL
  if (method === "tools/call") {
    const { name, arguments: args } = params;

    if (name === "get_ga4_cro_analysis") {
      try {
        const response = await fetch(N8N_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(args)
        });

        const data = await response.json();

        return res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(data)
              }
            ]
          }
        });
      } catch (error) {
        return res.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32000,
            message: error.message
          }
        });
      }
    }
  }

  return res.status(400).json({
    jsonrpc: "2.0",
    id,
    error: {
      code: -32601,
      message: "Method not found"
    }
  });
});

app.get("/", (req, res) => {
  res.send("MCP Server Running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("MCP Server rodando");
});
