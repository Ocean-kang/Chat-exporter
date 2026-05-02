export function toMarkdown(conv: any) {
  let out = `# ${conv.title}\n\n`;

  const sep = "\n\n---\n\n";
  conv.messages.forEach((m: any, i: number) => {
    const ts = m.create_time
      ? new Date(m.create_time * 1000).toISOString().replace("T", " ").slice(0, 19)
      : "";

    out += `## ${m.role}${ts ? " — " + ts : ""}\n\n`;
    out += `${m.content}\n`;
    out += i < conv.messages.length - 1 ? sep : "\n";
  });

  return out;
}
