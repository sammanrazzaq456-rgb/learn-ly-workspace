/** Minimal markdown renderer: headings, bullets, numbered lists, bold and paragraphs. */
import { Fragment } from "react";

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let ordered = false;

  const flush = () => {
    if (list.length === 0) return;
    const items = list.map((item, index) => (
      <li key={index} className="ml-5 list-outside">
        {inline(item)}
      </li>
    ));
    blocks.push(
      ordered ? (
        <ol key={blocks.length} className="my-3 list-decimal space-y-1.5 text-sm">
          {items}
        </ol>
      ) : (
        <ul key={blocks.length} className="my-3 list-disc space-y-1.5 text-sm">
          {items}
        </ul>
      ),
    );
    list = [];
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^(#{1,4})\s+(.*)$/);

    if (bullet) {
      if (ordered) flush();
      ordered = false;
      list.push(bullet[1]);
      return;
    }
    if (numbered) {
      if (!ordered) flush();
      ordered = true;
      list.push(numbered[1]);
      return;
    }
    flush();

    if (heading) {
      const level = heading[1].length;
      const size =
        level === 1 ? "text-xl" : level === 2 ? "text-lg" : level === 3 ? "text-base" : "text-sm";
      blocks.push(
        <p key={blocks.length} className={`mt-5 mb-2 font-display font-bold ${size}`}>
          {inline(heading[2])}
        </p>,
      );
      return;
    }
    if (line.trim() === "") return;
    blocks.push(
      <p key={blocks.length} className="my-2 text-sm leading-relaxed">
        {inline(line)}
      </p>,
    );
  });
  flush();

  return <div className="text-foreground">{blocks}</div>;
}
