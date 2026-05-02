export function toMarkdown(conv: any) {
  let out = `# ${conv.title}\n\n`;
  conv.messages.forEach((m: any) => {
    out += `## ${m.role}\n\n${m.content}\n\n`;
  });
  return out;
}
