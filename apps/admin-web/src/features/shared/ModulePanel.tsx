import type { ModuleCard } from "./types";

export function ModulePanel({ title, summary, bullets }: ModuleCard) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      <p className="panel-summary">{summary}</p>
      <ul className="stack-list">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  );
}
