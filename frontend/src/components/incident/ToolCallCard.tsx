import type { ToolCall } from "@/types/agent-event";

interface Props {
  tool: ToolCall;
  durationMs?: number;
}

/**
 * ToolCallCard — renders one MCP tool call as input/output pair.
 * Uses Fraunces small-caps for the section eyebrow and JetBrains Mono
 * for the data. Indented +1px hairline for the boundary.
 */
export function ToolCallCard({ tool, durationMs }: Props) {
  return (
    <div className="surface bg-[color:var(--ink-elevated)] mt-3">
      <div className="px-4 pt-3 pb-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] text-[color:var(--ember-400)]">
          ▸ {tool.name}
        </span>
        {durationMs !== undefined && (
          <span className="font-mono text-[10.5px] text-[color:var(--grave)] num">
            {durationMs}ms
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-x-4 px-4 pb-3 pt-1 text-[12px]">
        <div className="eyebrow !text-[10px] mb-1 sm:mb-0">input</div>
        <pre className="font-mono whitespace-pre-wrap text-[color:var(--oyster)] mb-2 sm:mb-0">
          {JSON.stringify(tool.input, null, 2)}
        </pre>
        <div className="eyebrow !text-[10px] mb-1 sm:mb-0">output</div>
        <pre className="font-mono whitespace-pre-wrap text-[color:var(--bone)]">
          {JSON.stringify(tool.output, null, 2)}
        </pre>
      </div>
    </div>
  );
}
