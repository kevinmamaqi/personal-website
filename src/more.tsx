import type { JSX } from "react";
import { LINKS, RETINAL_PAPER } from "./content/positioning.ts";
import NOTES from "./content/writing.json";
import { Arrow, Footer, Header, NoteItem, SectionHead, byDate } from "./page.tsx";

// Moved off the homepage by the 30 October 2026 simplification brief:
// the full writing list, talks and papers, and skills.
const SKILLS = [
  {
    area: "Languages & APIs",
    items: ["TypeScript", "Node.js", "Golang", "Python", "React", "GraphQL", "gRPC", "REST"],
  },
  {
    area: "Cloud & data",
    items: ["AWS", "GCP", "PostgreSQL", "DynamoDB & NoSQL", "CI/CD pipelines", "Observability"],
  },
  {
    area: "Systems & AI",
    items: [
      "AI infrastructure & orchestration",
      "Model routing across providers",
      "Distributed systems",
      "Event-driven architecture",
      "DDD & hexagonal architecture",
      "Reliability & idempotency",
    ],
  },
  {
    area: "Leadership",
    items: [
      "Engineering management",
      "Team leadership & delivery",
      "Mentoring & technical teaching",
      "Product & stakeholder collaboration",
      "Architecture decisions & technical writing",
    ],
  },
];

function Writing() {
  return (
    <section id="writing" className="section">
      <SectionHead label="Writing" title="All writing" />
      {([['technical', 'Technical'], ['off-topic', 'Off-topic']] as const).map(([category, label]) => (
        <div className="writing-group" key={category}>
          <h3 className="writing-label">{label}</h3>
          <div className="note-list">{NOTES.filter((note) => note.category === category).sort(byDate).map((note) => <NoteItem key={note.href} note={note} />)}</div>
        </div>
      ))}
    </section>
  );
}

function Speaking() {
  return (
    <section id="speaking" className="section">
      <SectionHead label="Speaking & research" title="Talks and papers" />
      <div className="note-list">
        <a className="note-item" href="/notes/ace-technical-interview-mwc-2024/"><span>MWC Barcelona 2024 · Talent Arena</span><strong>Ace the Technical Interview with AI</strong><p>A practical workshop on using AI to prepare for technical interviews.</p><Arrow /></a>
        <a className="note-item" href={RETINAL_PAPER.url}><span>Paper · {RETINAL_PAPER.journal}, {RETINAL_PAPER.year}</span><strong>{RETINAL_PAPER.title}</strong><p>A Bi-LSTM approach to segmenting blood vessels in retinal images.</p><Arrow /></a>
        <div className="note-item note-item--plain"><span>Research · Manuscripts, 2026</span><strong>Retinal vessel segmentation</strong><p>Evaluation-policy stability; active domain adaptation.</p></div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills" className="section">
      <SectionHead label="Skills" title="What I work with" />
      <div className="skill-list">{SKILLS.map((group) => <div className="skill-row" key={group.area}><h3>{group.area}</h3><ul className="skill-tags">{group.items.map((item) => <li key={item}>{item}</li>)}</ul></div>)}</div>
    </section>
  );
}

export default function MorePage(): JSX.Element {
  return <><a className="skip-link" href="#main-content">Skip to content</a><div className="page"><Header current={LINKS.more} /><main id="main-content" tabIndex={-1}><section className="more-intro"><p className="eyebrow">More</p><h1>Writing, talks and skills</h1></section><Writing /><Speaking /><Skills /></main><Footer /></div></>;
}
