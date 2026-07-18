import type { JSX } from "react";

const REPO_URL = "https://github.com/kevinmamaqi/patchquest";

const I = {
  arrowUpRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  github: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  ),
};

const START_STEPS = [
  {
    step: "Choose a path",
    actor: "You",
    machine: false,
    text: "Say “Let’s start.” The agent asks which path you want: Node.js + TypeScript, Go, or Bun + TypeScript. It waits for your choice instead of guessing.",
  },
  {
    step: "Check the workspace",
    actor: "Agent",
    machine: true,
    text: "You confirm a code workspace. The agent checks that path’s runtime and project dependencies, opens its private local progress database, and suggests—never starts—the development server command.",
  },
  {
    step: "Build one small thing",
    actor: "You + agent",
    machine: true,
    text: "Each step gives one bounded action in your own folder, then asks a question. You submit your explanation; the agent evaluates it against the named source and records the result locally.",
  },
  {
    step: "Return with evidence",
    actor: "You",
    machine: false,
    text: "Your workspace owns its progress. When you return, the agent continues the unfinished step or asks a related recall question before moving on.",
  },
];

const MODULES = [
  ["00", "Start a path", "Choose language, workspace, local progress, and a visible development loop."],
  ["01", "Model the domain", "Name rules and invariants before routes or tables."],
  ["02", "Draw the hexagon", "Keep domain, application, ports, and adapters distinct."],
  ["03", "Make an API useful", "Create a thin HTTP boundary and a clear status surface."],
  ["04", "Persist through a port", "Replace in-memory storage without leaking it into the model."],
  ["05", "Prove behaviour", "Protect rules with focused domain, use-case, and boundary tests."],
  ["06", "Handle failure deliberately", "Separate rejection, transient failure, duplicates, and safe retries."],
  ["07", "Observe and ship", "Add useful signals, a health check, and a small runbook."],
];

const TRY_CODE = `git clone https://github.com/kevinmamaqi/patchquest
cd patchquest
# Open this folder in a coding agent, then say:
Let's start.`;

function Header(): JSX.Element {
  return (
    <header className="site-header">
      <a className="site-name" href="/" aria-label="Kevin Mamaqi home">
        Kevin Mamaqi
      </a>
      <nav className="nav" aria-label="Primary">
        <a href="/">Home</a>
        <a href="/#work">Work</a>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          Repository
        </a>
      </nav>
    </header>
  );
}

function Hero(): JSX.Element {
  return (
    <section id="top" className="hero">
      <p className="eyebrow">Open source · Self-learn course</p>
      <h1>
        Self-learn backend development with <em>DDD and hexagonal architecture</em>.
      </h1>
      <div className="hero-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="hero-copy">
        PatchQuest is a practical course for building a small backend in Node.js,
        Go, or Bun. You choose a language, work in your own folder, and learn
        the same architectural decisions through short code exercises, questions,
        feedback, and later review.
      </p>
      <div className="hero-actions">
        <a className="button" href={REPO_URL} target="_blank" rel="noreferrer">
          <I.github />
          View on GitHub
        </a>
        <a className="text-link" href="#start">
          How it starts
        </a>
      </div>
    </section>
  );
}

function What(): JSX.Element {
  return (
    <section id="what" className="section">
      <div className="section-head">
        <p className="eyebrow">How it works</p>
        <h2>Learn by building, explaining, and returning.</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="pq-lede">
        The course uses retrieval before rereading, small worked exercises,
        source-linked feedback, and related recall on a later session. That
        combination helps expose gaps, turns correction into a concrete next
        action, and makes the architecture something you can use rather than
        merely recognise.
      </p>
      <div className="pq-status">
        <div>
          <p className="tag pq-tag--done">One course, three paths</p>
          <p>
            The starting choice is explicit: Node.js + TypeScript, Go, or Bun +
            TypeScript. The concepts stay stable while the commands and project
            structure fit the selected language.
          </p>
        </div>
        <div>
          <p className="tag pq-tag--planned">Local by design</p>
          <p>
            Course material is Markdown and references only. Code and a private
            SQLite progress record live in your own workspace, one database per
            path—nothing is hosted or collected by PatchQuest.
          </p>
        </div>
      </div>
    </section>
  );
}

function Start(): JSX.Element {
  return (
    <section id="start" className="section">
      <div className="section-head">
        <p className="eyebrow">Your first session</p>
        <h2>One clear step at a time</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <ol className="pq-loop">
        {START_STEPS.map((item, index) => (
          <li className="pq-step" key={item.step}>
            <span className="pq-step-index" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="pq-step-main">
              <p className={`pq-role ${item.machine ? "pq-role--machine" : "pq-role--human"}`}>
                {item.actor}
              </p>
              <h3>{item.step}</h3>
              <p>{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="section-note">
        The agent checks dependencies and suggests the development command; you
        keep control of installs, server launches, and every code change.
      </p>
    </section>
  );
}

function Modules(): JSX.Element {
  return (
    <section id="modules" className="section">
      <div className="section-head">
        <p className="eyebrow">The course</p>
        <h2>Eight steps from model to runbook</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <ol className="pq-modules">
        {MODULES.map(([number, title, description]) => (
          <li key={number}>
            <span>{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Try(): JSX.Element {
  return (
    <section id="try" className="section">
      <div className="section-head">
        <p className="eyebrow">Start here</p>
        <h2>Open the course. Then say the words.</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="pq-ways">
        <div className="pq-way">
          <h3>1 · Open it locally</h3>
          <p>
            Clone the Markdown course and open that folder with a coding agent
            that reads repository instructions. There is no starter service to
            install in the course itself.
          </p>
          <pre className="pq-code">
            <code>{TRY_CODE}</code>
          </pre>
        </div>
        <div className="pq-way">
          <h3>2 · Keep the work yours</h3>
          <p>
            The agent will ask for a separate workspace, check its dependencies,
            and keep question attempts, paths, and evidence in its local SQLite
            progress database. Each step ends with a question the agent evaluates
            against the course references.
          </p>
          <a className="text-link" href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer">
            Read the course README <I.arrowUpRight />
          </a>
        </div>
      </div>
    </section>
  );
}

function Cta(): JSX.Element {
  return (
    <section className="section pq-cta">
      <div>
        <p className="eyebrow">Source</p>
        <h2>A lightweight course, not another framework.</h2>
        <p className="pq-cta-copy">
          The repository holds the steps, research sources, and agent protocol.
          Your chosen language path holds the application.
        </p>
      </div>
      <a className="button" href={REPO_URL} target="_blank" rel="noreferrer">
        <I.github />
        kevinmamaqi/patchquest
      </a>
    </section>
  );
}

function Footer(): JSX.Element {
  return (
    <footer className="footer">
      <p>
        <a href="/">Kevin Mamaqi Kapllani</a>
      </p>
      <p>Barcelona</p>
    </footer>
  );
}

export default function PatchQuestPage(): JSX.Element {
  return (
    <main className="page patchquest">
      <Header />
      <Hero />
      <What />
      <Start />
      <Modules />
      <Try />
      <Cta />
      <Footer />
    </main>
  );
}
