import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_services",
  title: "List Swan Hill Stables services",
  description:
    "Lists the services Swan Hill Stables offers with a short summary and starting price. Use `category` to filter to just boarding or lessons.",
  inputSchema: {
    category: z
      .enum(["boarding", "lessons", "all"])
      .default("all")
      .describe("Which service category to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ category }) => {
    const services = [
      {
        category: "boarding",
        name: "Full-Service Board",
        startingPriceUSD: 800,
        summary:
          "Stall board with daily turnout, feed, hay, stall cleaning, and blanket changes.",
      },
      {
        category: "boarding",
        name: "Pasture Board",
        startingPriceUSD: 500,
        summary: "24/7 pasture living with shelter, hay, and daily wellness checks.",
      },
      {
        category: "lessons",
        name: "Private Riding Lesson",
        startingPriceUSD: 50,
        summary:
          "One-on-one instruction for all levels. Payment via Venmo @swanhillstables.",
      },
    ];
    const filtered =
      category === "all" ? services : services.filter((s) => s.category === category);
    return {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      structuredContent: { services: filtered },
    };
  },
});