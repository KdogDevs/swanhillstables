import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_stable_info",
  title: "Get Swan Hill Stables info",
  description:
    "Returns basic public info about Swan Hill Stables: address, phone, email, hours, and social links.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const info = {
      name: "Swan Hill Stables",
      tagline:
        "Premium horse boarding, expert riding lessons, and a welcoming equestrian community.",
      address: "3550 Skipper Rd, Northport, Alabama",
      phone: "+1 (617) 513-7262",
      email: "stables@swanhillstables.com",
      website: "https://swanhillstables.com",
      social: {
        instagram:
          "https://www.instagram.com/swan.hill.stables",
      },
    };
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
      structuredContent: info,
    };
  },
});

// zod is imported to keep the tool file inputSchema-consistent even when empty;
// remove the import if you add typed input fields.
void z;