import type { JSX } from "react";
import { ThemeToggle } from "./theme-toggle.tsx";
import { HEADLINE, LINKS, NAV, PROJECTS, RETINAL_PAPER } from "./content/positioning.ts";
import NOTES from "./content/writing.json";

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

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7M7 7h10v10" />
  </svg>
);

function Motif() {
  return <div className="section-motif" aria-hidden="true"><span /><span /><span /></div>;
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return <><div className="section-head"><p className="eyebrow">{label}</p><h2>{title}</h2></div><Motif /></>;
}

function Header() {
  return (
    <header className="site-header">
      <a className="site-name" href="#top" aria-label="Kevin Mamaqi home">Kevin Mamaqi</a>
      <nav id="site-navigation" className="nav" aria-label="Primary">
        {NAV.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
      </nav>
      <div className="site-header-actions">
        <ThemeToggle />
        <button className="menu-toggle" type="button" data-menu-toggle aria-controls="site-navigation" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          <span className="sr-only">Open navigation menu</span>
        </button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <img className="hero-photo" src="/notes/ace-technical-interview-mwc-2024/images/kevin-speaking-to-audience.webp" width="1800" height="1200" alt="Kevin Mamaqi speaking at MWC Barcelona 2024" fetchPriority="high" />
      <div className="hero-intro">
        <p className="eyebrow">Engineering Manager &amp; Tech Lead · Barcelona</p>
        <h1>{HEADLINE}</h1>
        <div className="hero-motif" aria-hidden="true"><span /><span /><span /></div>
        <p className="hero-copy">At Eachlabs I run a team of five building the APIs behind 700+ AI models. Before that I led teams in maritime and healthcare software.</p>
        <div className="hero-actions">
          <a className="text-link" href={LINKS.cv}>Read my CV <Arrow /></a>
          <a className="text-link" href="#contact">Get in touch</a>
        </div>
      </div>
    </section>
  );
}

function Work() {
  return (
    <section id="work" className="section">
      <SectionHead label="Work" title="Selected work" />
      <div className="work-list">
        {PROJECTS.map((project) => (
          <article className="work-item" key={project.name}>
            <div className="work-meta"><span>{project.period}</span></div>
            <div className="work-main">
              <p className="tag">{project.tag}</p>
              <h3>{project.name}</h3>
              <p className="work-role">{project.role} · {project.period}</p>
              {"earlier" in project ? <p className="work-earlier">{project.earlier}</p> : null}
              <p className="work-summary">{project.summary}</p>
              <details className="work-details">
                <summary>Details</summary>
                <ul className="work-points">{project.points.map((point) => <li key={point}>{point}</li>)}</ul>
                {"stack" in project ? <p className="work-stack">{project.stack}</p> : null}
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Method() {
  const steps = [
    ["AGENT", "proposes the change", "→", "change"],
    ["VERIFIER", "hunts the failure mode", "→", "finding"],
    ["HARNESS", "encodes it as a check", "↺", "a repeatable check"],
  ];
  return (
    <section id="method" className="section">
      <SectionHead label="Method" title="How I work with AI" />
      <p className="method-copy">The same loop runs the platform and the team. In the platform: an executor dispatches a step, a verifier checks the outcome (exactly-once, idempotent retry, fallback), and the result is committed before anything is billed. In the team: an agent proposes a change, a verifier hunts for the failure mode, and a harness turns the finding into a repeatable check — using reusable validation contracts and skills, independent verifier passes and explicit human gates throughout production migrations. People stay in charge of what ships.</p>
      <ol className="method-steps" aria-label="Agent, verifier and harness loop">
        {steps.map(([role, action, arrow, result]) => (
          <li key={role}><strong>{role}</strong><span>{action}</span><span className="method-result"><span aria-hidden="true">{arrow}</span> {result}</span></li>
        ))}
      </ol>
      <p className="method-links"><a href="/notes/agent-harness-at-eachlabs/">The harness presentation</a><span aria-hidden="true"> · </span><a href="https://github.com/kevinmamaqi/agent-first-workbench" target="_blank" rel="noreferrer">The workbench setup <Arrow /></a></p>
    </section>
  );
}

type Note = (typeof NOTES)[number] & { linkedin?: string };
const dateLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

function NoteItem({ note }: { note: Note }) {
  return (
    <article className="writing-entry">
      <a className="note-item" href={note.href} target={note.external ? "_blank" : undefined} rel={note.external ? "noreferrer" : undefined}>
        <span><time dateTime={note.date}>{dateLabel(note.date)}</time> · {note.source}</span>
        <strong>{note.title}</strong>
        <p>{note.summary}</p>
        <Arrow />
      </a>
      {note.linkedin ? <a className="note-syndication" href={note.linkedin} target="_blank" rel="noreferrer">Also on LinkedIn <Arrow /></a> : null}
    </article>
  );
}

function Writing() {
  return (
    <section id="notes" className="section">
      <SectionHead label="Writing" title="Writing" />
      {([['technical', 'Technical'], ['off-topic', 'Off-topic']] as const).map(([category, label]) => (
        <div className="writing-group" key={category}>
          <h3 className="writing-label">{label}</h3>
          <div className="note-list">{NOTES.filter((note) => note.category === category).sort((a, b) => b.date.localeCompare(a.date)).map((note) => <NoteItem key={note.href} note={note} />)}</div>
        </div>
      ))}
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

function Contact() {
  return (
    <section id="contact" className="section contact">
      <div><p className="eyebrow">Contact</p><h2>Best place to reach me is LinkedIn.</h2><p className="contact-copy">Short context, practical questions, and real work are welcome. Happy to talk about hands-on tech lead roles at companies building runtimes, state and tooling for AI agents.</p><p className="contact-location">Barcelona · Europe/Madrid · Remote-friendly · US-overlap</p></div>
      <div className="contact-actions"><a className="button" href={LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a className="button" href={LINKS.github} target="_blank" rel="noreferrer">GitHub <Arrow /></a></div>
    </section>
  );
}

function Footer() {
  return <footer className="footer"><p>Kevin Mamaqi Kapllani · Barcelona</p><a href={LINKS.malt} target="_blank" rel="noreferrer">Freelance reviews on Malt</a></footer>;
}

export default function Page(): JSX.Element {
  return <><a className="skip-link" href="#main-content">Skip to content</a><div className="page"><Header /><main id="main-content" tabIndex={-1}><Hero /><Work /><Method /><Writing /><Skills /><Speaking /><Contact /></main><Footer /></div></>;
}
