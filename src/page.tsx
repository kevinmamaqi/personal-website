import type { JSX } from "react";

const LINKEDIN_URL = "https://www.linkedin.com/in/kevinmamaqi";
const MALT_URL = "https://www.malt.es/profile/kevinmamaqikapllani";

const NAV = [
  { label: "Skills", href: "#skills" },
  { label: "Work", href: "#work" },
  { label: "Notes", href: "#notes" },
  { label: "Contact", href: "#contact" },
];

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

const ORGANIZATIONS = [
  { name: "Eachlabs" },
  { name: "90POE" },
  { name: "Robbie AI" },
  { name: "TU Delft", detail: "Medisign" },
  { name: "LUMC" },
  { name: "Amsterdam UMC" },
  { name: "IT Academy", detail: "Barcelona Activa" },
  { name: "Imagina Formacion" },
  { name: "UOC", detail: "Universitat Oberta de Catalunya" },
  { name: "Teldat" },
  { name: "Inbonis Rating" },
  { name: "Alten" },
];

type Project = {
  period: string;
  name: string;
  tag: string;
  summary: string;
  points: string[];
};

const PROJECTS: Project[] = [
  {
    period: "2025 - now",
    name: "Eachlabs",
    tag: "AI infrastructure",
    summary:
      "Engineering manager, hands-on. I work on execution infrastructure for AI products: orchestration, model routing, retries, observability, and the practical pieces that make model calls usable in production.",
    points: [
      "Execution workflows for AI products",
      "Reliability, timeouts, retries, and recovery",
      "Operational visibility across providers and jobs",
    ],
  },
  {
    period: "2022 - 2025",
    name: "90POE",
    tag: "Maritime software",
    summary:
      "Led product engineering work across vessel planning, itinerary, port-call, and onboard workflows. The work sat between product decisions, backend services, frontend delivery, and team execution.",
    points: [
      "Team leadership across product and engineering",
      "GraphQL, services, repositories, and tests",
      "Operational software for complex maritime workflows",
    ],
  },
  {
    period: "2021 - 2022",
    name: "Robbie AI",
    tag: "Healthcare workflows",
    summary:
      "Built healthcare interfaces for nurse-facing and operating-room workflows, where clear information, timing, and data boundaries mattered more than visual noise.",
    points: [
      "React and TypeScript product interfaces",
      "GraphQL and PostgreSQL-backed workflows",
      "Healthcare UI work under real operational constraints",
    ],
  },
];

const NOTES = [
  {
    title: "An agent-first macOS workbench",
    source: "Open-source setup",
    date: "2026-07-13",
    dateLabel: "13 Jul 2026",
    href: "https://github.com/kevinmamaqi/agent-first-workbench",
    external: true,
    summary:
      "The sanitized macOS setup I use for agent-first development: cmux and Ghostty for visible agent work, terminal-native review and navigation tools, deterministic output for agents, and a safe installer with privacy checks.",
  },
  {
    title: "Agent Harness at each::labs",
    source: "Internal presentation",
    date: "2026-07-13",
    dateLabel: "13 Jul 2026",
    href: "/notes/agent-harness-at-eachlabs/",
    external: false,
    summary:
      "How I use ergonomics, fast tools, specifications, sequential implementation, independent verification, and measurement to improve daily agent-assisted engineering work.",
  },
  {
    title: "We timed our coding agents",
    source: "LinkedIn article",
    date: "2026-06-30",
    dateLabel: "30 Jun 2026",
    href: "https://www.linkedin.com/pulse/we-timed-our-coding-agents-92-work-happened-before-mamaqi-kapllani-f3icf/",
    external: true,
    summary:
      "A measured look at where coding-agent work actually happens: framing, verification, and review before the implementation step.",
  },
  {
    title: "Making fifty AI providers behave like one product",
    source: "LinkedIn article",
    date: "2026-06-15",
    dateLabel: "15 Jun 2026",
    href: "https://www.linkedin.com/pulse/making-fifty-ai-providers-behave-like-one-product-mamaqi-kapllani-n5jpe/",
    external: true,
    summary:
      "A practical note on reducing many AI providers into one product surface without hiding the operational differences that matter.",
  },
  {
    title: "Ace the Technical Interview with AI",
    source: "MWC Barcelona 2024",
    date: "2024-02-26",
    dateLabel: "26 Feb 2024",
    href: "/notes/ace-technical-interview-mwc-2024/",
    external: false,
    summary:
      "A practical workshop from Talent Arena on using language models to prepare for technical interviews, practise with feedback, understand code, and verify the result.",
  },
];

const I = {
  linkedin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  arrowUpRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
};

function Header() {
  return (
    <header className="site-header">
      <a className="site-name" href="#top" aria-label="Kevin Mamaqi home">
        Kevin Mamaqi
      </a>
      <nav className="nav" aria-label="Primary">
        {NAV.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <p className="eyebrow">Engineering Manager · 15 years · Barcelona</p>
      <h1>Hands-on engineering leadership for <em>real systems</em>.</h1>
      <div className="hero-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="hero-copy">
        Fifteen years building software, still writing code. I lead teams shipping reliable systems across AI infrastructure, maritime operations, and healthcare — clear product decisions, understandable architecture, and code that survives production.
      </p>
      <div className="hero-actions">
        <a className="text-link" href="#work">
          Selected work
        </a>
        <a className="text-link" href={MALT_URL} target="_blank" rel="noreferrer">
          Malt reviews <I.arrowUpRight />
        </a>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills" className="section">
      <div className="section-head">
        <p className="eyebrow">Skills</p>
        <h2>What I work with</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="skill-list">
        {SKILLS.map((group) => (
          <div className="skill-row" key={group.area}>
            <h3>{group.area}</h3>
            <ul className="skill-tags">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="section-note">Same skills, same words as my LinkedIn profile — the work below is the evidence.</p>
    </section>
  );
}

function Work() {
  return (
    <section id="work" className="section">
      <div className="section-head">
        <p className="eyebrow">Work</p>
        <h2>Selected work</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="work-list">
        {PROJECTS.map((project, index) => (
          <article className="work-item" key={project.name}>
            <div className="work-meta">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{project.period}</span>
            </div>
            <div className="work-main">
              <p className="tag">{project.tag}</p>
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
            </div>
            <ul className="work-points">
              {project.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function Notes() {
  return (
    <section id="notes" className="section">
      <div className="section-head">
        <p className="eyebrow">Notes</p>
        <h2>Writing</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="note-list">
        {[...NOTES].sort((a, b) => b.date.localeCompare(a.date)).map((note) => (
          <NoteItem key={note.title} note={note} />
        ))}
      </div>
      <p className="section-note">More notes will be added when they are useful.</p>
    </section>
  );
}

function NoteItem({ note }: { note: (typeof NOTES)[number] }) {
  const content = (
    <>
      <span><time dateTime={note.date}>{note.dateLabel}</time> · {note.source}</span>
      <strong>{note.title}</strong>
      <p>{note.summary}</p>
      {"href" in note ? <I.arrowUpRight /> : null}
    </>
  );

  if (note.external) {
    return (
      <a className="note-item" href={note.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return <a className="note-item" href={note.href}>{content}</a>;
}

const METHOD_SCRIPT = `
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var mq = window.matchMedia("(max-width: 640px)");
  var COLORS = ["#23395B", "#8F5B3E", "#171717"];
  var state = null, seg = 0, phase = "rest", start = null;
  function setup(prefix) {
    var paths = [0, 1, 2].map(function (i) { return document.getElementById(prefix + "path-" + i); });
    if (!paths[0]) return null;
    return {
      paths: paths,
      nodes: [0, 1, 2].map(function (i) { return document.getElementById(prefix + "node-" + i); }),
      labels: [0, 1, 2].map(function (i) { return document.getElementById(prefix + "label-" + i); }),
      token: document.getElementById(prefix + "token"),
      trail: document.getElementById(prefix + "trail"),
      lens: paths.map(function (p) { return p.getTotalLength(); })
    };
  }
  function clearAll(s) {
    if (!s) return;
    s.nodes.forEach(function (n) { n.classList.remove("hot"); });
    s.labels.forEach(function (l) { l.classList.remove("hot"); });
    s.token.setAttribute("visibility", "hidden");
    s.trail.setAttribute("opacity", "0");
  }
  function activate() {
    clearAll(state);
    state = setup(mq.matches ? "mv-" : "m-");
    seg = 0; phase = "rest"; start = null;
  }
  if (mq.addEventListener) { mq.addEventListener("change", activate); } else { mq.addListener(activate); }
  activate();
  if (!state) return;
  function travelMs(i) { return Math.min(1100, Math.max(380, state.lens[i] * 2.2)); }
  function frame(ts) {
    if (state) {
      if (start === null) start = ts;
      var dt = ts - start;
      if (phase === "rest") {
        state.nodes[seg].classList.add("hot");
        state.token.setAttribute("visibility", "hidden");
        state.trail.setAttribute("opacity", "0");
        if (dt >= 850) {
          phase = "travel"; start = ts;
          state.nodes.forEach(function (n) { n.classList.remove("hot"); });
          state.labels[seg].classList.add("hot");
          state.token.setAttribute("fill", COLORS[seg]);
          state.trail.setAttribute("fill", COLORS[seg]);
          state.token.setAttribute("visibility", "visible");
        }
      } else {
        var T = travelMs(seg), p = Math.min(dt / T, 1);
        var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        var pt = state.paths[seg].getPointAtLength(e * state.lens[seg]);
        state.token.setAttribute("cx", pt.x); state.token.setAttribute("cy", pt.y);
        var tp = Math.max(e - 0.08, 0);
        var t2 = state.paths[seg].getPointAtLength(tp * state.lens[seg]);
        state.trail.setAttribute("cx", t2.x); state.trail.setAttribute("cy", t2.y);
        state.trail.setAttribute("opacity", tp > 0 ? "0.3" : "0");
        if (p >= 1) {
          state.nodes.forEach(function (n) { n.classList.remove("hot"); });
          state.labels.forEach(function (l) { l.classList.remove("hot"); });
          seg = (seg + 1) % 3; phase = "rest"; start = ts;
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
`;

function Method() {
  return (
    <section id="method" className="section">
      <div className="section-head">
        <p className="eyebrow">Method</p>
        <h2>How I work with AI</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <p className="method-copy">
        The pattern behind my AI work and the notes above: an agent proposes a change, a verifier hunts for the failure mode, and a harness turns the finding into a repeatable check. People stay in charge of what ships.
      </p>
      <figure className="method-fig">
        <svg
          id="methodSvg"
          className="m-horizontal"
          viewBox="0 0 660 142"
          role="img"
          aria-label="Agent proposes a change, verifier hunts the failure mode, harness encodes it as a repeatable check that feeds back to the agent."
        >
          <defs>
            <marker id="mAh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#8B857A" />
            </marker>
          </defs>
          <g fontFamily="Inter, system-ui, sans-serif">
            <g className="m-node" id="m-node-0">
              <rect x="15" y="18" width="185" height="56" fill="#F7F3EC" stroke="#23395B" strokeWidth="1.3" />
              <text x="33" y="41" fontSize="10.5" fontWeight="700" fill="#23395B" letterSpacing="1.5">AGENT</text>
              <text x="33" y="62" fontSize="14" fill="#171717">Proposes the change</text>
            </g>
            <g className="m-node" id="m-node-1">
              <rect x="237" y="18" width="185" height="56" fill="#F7F3EC" stroke="#8F5B3E" strokeWidth="1.3" />
              <text x="255" y="41" fontSize="10.5" fontWeight="700" fill="#8F5B3E" letterSpacing="1.5">VERIFIER</text>
              <text x="255" y="62" fontSize="14" fill="#171717">Hunts the failure mode</text>
            </g>
            <g className="m-node" id="m-node-2">
              <rect x="459" y="18" width="186" height="56" fill="#F7F3EC" stroke="#171717" strokeWidth="1.3" />
              <text x="477" y="41" fontSize="10.5" fontWeight="700" fill="#171717" letterSpacing="1.5">HARNESS</text>
              <text x="477" y="62" fontSize="14" fill="#171717">Encodes it as a check</text>
            </g>
          </g>
          <g fill="none" stroke="#8B857A" strokeWidth="1.4" markerEnd="url(#mAh)">
            <path id="m-path-0" strokeDasharray="5 6" d="M204 46 H 231" />
            <path id="m-path-1" strokeDasharray="5 6" d="M426 46 H 453" />
            <path id="m-path-2" strokeDasharray="5 6" d="M552 78 v 26 a8 8 0 0 1 -8 8 H 116 a8 8 0 0 1 -8 -8 v -22" />
          </g>
          <g fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#5F5B54" stroke="#F7F3EC" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round">
            <text className="m-label" id="m-label-0" x="217" y="36" textAnchor="middle">change</text>
            <text className="m-label" id="m-label-1" x="439" y="36" textAnchor="middle">finding</text>
            <text className="m-label" id="m-label-2" x="330" y="130" textAnchor="middle">a repeatable check</text>
          </g>
          <circle id="m-trail" r="3" fill="#23395B" opacity="0" />
          <circle id="m-token" r="5.5" fill="#23395B" stroke="#F7F3EC" strokeWidth="1.4" visibility="hidden" />
        </svg>
        <svg
          className="m-vertical"
          viewBox="0 0 360 302"
          role="img"
          aria-label="Agent proposes a change, verifier hunts the failure mode, harness encodes it as a repeatable check that feeds back to the agent."
        >
          <defs>
            <marker id="mvAh" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#8B857A" />
            </marker>
          </defs>
          <g fontFamily="Inter, system-ui, sans-serif">
            <g className="m-node" id="mv-node-0">
              <rect x="20" y="15" width="240" height="56" fill="#F7F3EC" stroke="#23395B" strokeWidth="1.3" />
              <text x="38" y="38" fontSize="10.5" fontWeight="700" fill="#23395B" letterSpacing="1.5">AGENT</text>
              <text x="38" y="59" fontSize="14" fill="#171717">Proposes the change</text>
            </g>
            <g className="m-node" id="mv-node-1">
              <rect x="20" y="125" width="240" height="56" fill="#F7F3EC" stroke="#8F5B3E" strokeWidth="1.3" />
              <text x="38" y="148" fontSize="10.5" fontWeight="700" fill="#8F5B3E" letterSpacing="1.5">VERIFIER</text>
              <text x="38" y="169" fontSize="14" fill="#171717">Hunts the failure mode</text>
            </g>
            <g className="m-node" id="mv-node-2">
              <rect x="20" y="235" width="240" height="56" fill="#F7F3EC" stroke="#171717" strokeWidth="1.3" />
              <text x="38" y="258" fontSize="10.5" fontWeight="700" fill="#171717" letterSpacing="1.5">HARNESS</text>
              <text x="38" y="279" fontSize="14" fill="#171717">Encodes it as a check</text>
            </g>
          </g>
          <g fill="none" stroke="#8B857A" strokeWidth="1.4" markerEnd="url(#mvAh)">
            <path id="mv-path-0" strokeDasharray="5 6" d="M140 75 V 118" />
            <path id="mv-path-1" strokeDasharray="5 6" d="M140 185 V 228" />
            <path id="mv-path-2" strokeDasharray="5 6" d="M260 263 h 32 a8 8 0 0 0 8 -8 V 51 a8 8 0 0 0 -8 -8 h -24" />
          </g>
          <g fontFamily="Inter, system-ui, sans-serif" fontSize="11" fill="#5F5B54" stroke="#F7F3EC" strokeWidth="3.5" paintOrder="stroke" strokeLinejoin="round">
            <text className="m-label" id="mv-label-0" x="152" y="100">change</text>
            <text className="m-label" id="mv-label-1" x="152" y="210">finding</text>
            <text className="m-label" id="mv-label-2" x="322" y="157" textAnchor="middle" transform="rotate(90 322 157)">a repeatable check</text>
          </g>
          <circle id="mv-trail" r="3" fill="#23395B" opacity="0" />
          <circle id="mv-token" r="5.5" fill="#23395B" stroke="#F7F3EC" strokeWidth="1.4" visibility="hidden" />
        </svg>
        <figcaption>
          agent · verifier · harness — <a href="/notes/agent-harness-at-eachlabs/">the harness presentation</a> ·{" "}
          <a href="https://github.com/kevinmamaqi/agent-first-workbench" target="_blank" rel="noreferrer">the workbench setup</a>
        </figcaption>
      </figure>
      <script dangerouslySetInnerHTML={{ __html: METHOD_SCRIPT }} />
    </section>
  );
}

function WorkedWith() {
  return (
    <section className="section worked-with" aria-labelledby="worked-with-title">
      <div className="section-head">
        <p className="eyebrow">Worked with</p>
        <h2 id="worked-with-title">Selected organizations</h2>
      </div>
      <div className="section-motif" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <ul className="company-list">
        {ORGANIZATIONS.map((organization) => (
          <li key={organization.name}>
            <strong>{organization.name}</strong>
            {"detail" in organization ? <span>{organization.detail}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section contact">
      <div>
        <p className="eyebrow">Contact</p>
        <h2>Best place to reach me is LinkedIn.</h2>
        <p className="contact-copy">Short context, practical questions, and real work are welcome.</p>
      </div>
      <a className="button" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
        <I.linkedin />
        LinkedIn
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <p>Kevin Mamaqi Kapllani</p>
      <p>Barcelona</p>
    </footer>
  );
}

export default function Page(): JSX.Element {
  return (
    <main className="page">
      <Header />
      <Hero />
      <Skills />
      <Work />
      <Notes />
      <Method />
      <WorkedWith />
      <Contact />
      <Footer />
    </main>
  );
}
