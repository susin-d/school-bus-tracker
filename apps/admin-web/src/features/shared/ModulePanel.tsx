type ModulePanelProps = {
  title: string;
  summary?: string;
  bullets?: string[];
};

export function ModulePanel({ title, summary, bullets }: ModulePanelProps) {
  return (
    <article className="panel">
      <h2>{title}</h2>
      {summary ? <p className="panel-summary">{summary}</p> : null}
      {bullets && bullets.length > 0 ? (
        <ul className="stack-list">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
