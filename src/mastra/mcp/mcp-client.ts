import { MCPClient } from "@mastra/mcp";

export const cheqdMcpClient = new MCPClient({
  id: "cheqd-mcp-client",
  servers: {
    cheqd: {
      url: new URL(
        `https://remote-mcp-staging.cheqd.io/mcp`,
      ),
    },
  },
});