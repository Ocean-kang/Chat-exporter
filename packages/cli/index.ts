import * as fs from "fs";
import { parseFromNextData } from "../parsers/chatgpt/parseFromNextData";
import { buildOrderedMessages } from "../parsers/chatgpt/buildOrderedMessages";
import { toMarkdown } from "../exporters/markdown";

const raw = JSON.parse(fs.readFileSync("chat.json", "utf-8"));
const conv = parseFromNextData(raw);

if (!conv) {
  console.error("Failed to parse conversation from chat.json");
  process.exit(1);
}

conv.messages = buildOrderedMessages(conv.messages);
fs.writeFileSync("out.md", toMarkdown(conv), "utf-8");
console.log("Exported to out.md");
