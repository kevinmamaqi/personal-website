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
    step: "Open the local runner",
    actor: "You",
    machine: false,
    text: "Run one small Bun server and open PatchQuest in your browser. Every seeded course, its sections, sources, and question prompts are visible from the first screen.",
  },
  {
    step: "Choose a course and path",
    actor: "You",
    machine: false,
    text: "Pick a seeded course, then its path and workspace or learning context. Progress is local and stays separated by that course and path.",
  },
  {
    step: "Check the workspace",
    actor: "Agent",
    machine: true,
    text: "For a coding course, the agent checks only the documented runtime and project dependencies. It reports what is present or missing, then suggests—never starts—the development command.",
  },
  {
    step: "Build, answer, return",
    actor: "You + agent",
    machine: true,
    text: "Each section gives one bounded action and a question. You submit in the UI; the browser refreshes with source-linked MCP feedback and progress when the agent evaluates it.",
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
bun install
bun run dev
# Open http://127.0.0.1:3030`;

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
      <p className="eyebrow">Open source · Local course tracker</p>
      <h1>
        Make learning progress <em>visible, local, and agent-guided</em>.
      </h1>
      <div className="hero-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="hero-copy">
        PatchQuest is a small local course tracker with a browser UI, SQLite
        progress, and MCP. Fork it, seed a course for any subject, and let a
        coding agent guide and evaluate the answers a learner submits in the UI.
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
        A course can use retrieval before rereading, small worked exercises,
        source-linked feedback, and related recall on a later session. That
        combination helps expose gaps, turns correction into a concrete next
        action, and makes the architecture something you can use rather than
        merely recognise.
      </p>
      <div className="pq-status">
        <div>
          <p className="tag pq-tag--done">Fork and seed</p>
          <p>
            The runner loads simple JSON course manifests. A fork can add a new
            course with one seed command, then define its own paths, sections,
            sources, and questions.
          </p>
        </div>
        <div>
          <p className="tag pq-tag--planned">Local by design</p>
          <p>
            A dependency-light Bun server renders the course UI. The selected
            workspace, answers, feedback, and section progress stay in a local
            SQLite database—nothing is hosted or collected by PatchQuest.
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
        The UI is the shared learning record. An MCP-connected agent can read
        the next activity, record evidence, and evaluate submitted answers; you
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
        <h2>The included DDD seed: eight steps from model to runbook</h2>
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
        <h2>Open the course. Then make progress visible.</h2>
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
            Clone the tracker, install its two small local dependencies, and
            start the Bun server. The browser becomes the place to choose a
            course, select a path, see the next section, and submit answers.
          </p>
          <pre className="pq-code">
            <code>{TRY_CODE}</code>
          </pre>
        </div>
        <div className="pq-way">
          <h3>2 · Keep the work yours</h3>
          <p>
            Connect a coding agent through the included MCP server. It lists
            seeded courses, reads the same local SQLite progress as the browser,
            guides one next action, then evaluates the submitted answer against
            the course sources.
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
        <h2>A lightweight tracker, not another learning platform.</h2>
        <p className="pq-cta-copy">
          The repository includes the Bun runner, MCP bridge, generic course
          format, seed command, and a complete DDD example. Your course still
          owns its sources and the work a learner produces.
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
