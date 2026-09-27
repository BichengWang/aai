import type { ReactNode } from "react";

export function SectionCard(props: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="section-card">
      <header className="section-header">
        <div>
          <h2>{props.title}</h2>
          <p>{props.subtitle}</p>
        </div>
      </header>
      <div className="section-content">{props.children}</div>
    </section>
  );
}
