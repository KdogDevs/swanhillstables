import { defineMcp } from "@lovable.dev/mcp-js";
import getStableInfoTool from "./tools/get-stable-info";
import listServicesTool from "./tools/list-services";

export default defineMcp({
  name: "swan-hill-stables-mcp",
  title: "Swan Hill Stables",
  version: "0.1.0",
  instructions:
    "Tools for Swan Hill Stables — a premium horse boarding and riding lesson facility. Use `get_stable_info` for contact/address details, and `list_services` for boarding and lesson offerings with starting prices.",
  tools: [getStableInfoTool, listServicesTool],
});