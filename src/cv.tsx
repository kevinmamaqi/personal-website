import type { JSX } from "react";
import { ThemeToggle } from "./theme-toggle.tsx";
import { EACHLABS, NINETY_POE, RETINAL_PAPER, NAV as SITE_NAV } from "./content/positioning.ts";

const LINKEDIN_URL = "https://www.linkedin.com/in/kevinmamaqi";
const MALT_URL = "https://www.malt.es/profile/kevinmamaqikapllani";

const NAV = SITE_NAV.map((item) => ({ ...item, href: item.href.startsWith("#") ? `/${item.href}` : item.href }));

type Entry = {
  company: string;
  role: string;
  dates: string;
  location?: string;
  focus?: string;
  stack?: string;
  bullets: string[];
};

const EXPERIENCE: Entry[] = [
  {
    company: "Eachlabs",
    role: EACHLABS.role,
    dates: EACHLABS.dates,
    location: "Remote · Barcelona",
    focus: "AI infrastructure",
    stack: "TypeScript · Go · AWS · workflow orchestration · AI agents",
    bullets: [
      "Lead the engineering team while remaining close to architecture and implementation: structured 1:1s, feedback loops, priorities, and clear expectations.",
      "Architect and build critical workflows, executors, APIs, backend services, and AWS infrastructure for an AI product platform.",
      "Drive technical clarity across teams and report engineering health, risks, and strategy directly to the CEO.",
      "Set the bar for maintainability through code review, system simplification, reliability work, and practical architectural decisions.",
      "Build AI agents and internal tools with security gates, keeping agent-assisted work useful without weakening product or data boundaries.",
    ],
  },
  {
    company: "Eachlabs",
    role: EACHLABS.earlierRole,
    dates: EACHLABS.earlierDates,
    location: "Remote · Barcelona",
    focus: "AI execution infrastructure",
    stack: "Go · TypeScript · AWS",
    bullets: [EACHLABS.earlierDescription],
  },
  {
    company: "Ninety Percent of Everything (90POE)",
    role: NINETY_POE.role,
    dates: NINETY_POE.dates,
    location: "Barcelona",
    focus: "Maritime software",
    stack: "Go · React · TypeScript · GraphQL · PostgreSQL · MongoDB · Redis · AWS · Docker · Kubernetes",
    bullets: [
      "Owned backend and frontend services for vessel planning, itinerary, port-call, and onboard workflows used in real maritime operations.",
      "Led a cross-functional engineering team through technical direction, code reviews, mentoring, delivery planning, and close work with product owners.",
      "Implemented APIs, database migrations, system optimisations, CI/CD improvements, and architecture changes that reduced operational friction and accelerated customer onboarding.",
      "Delivered interactive map-based planning tools and contributed to the migration to TypeScript, a new component system, and stronger Playwright/Jest test coverage.",
      "Upgraded and launched features across a group of 10 products, their frontends, and APIs while keeping delivery aligned with product and technical owners.",
    ],
  },
  {
    company: "Ninety Percent of Everything (90POE)",
    role: "Senior Software Engineer",
    dates: "Jul 2022 – Dec 2022",
    location: "Barcelona",
    focus: "Maritime software",
    bullets: ["Built backend and frontend services for maritime operations before moving into the Team Lead role."],
  },
  {
    company: "Robbie AI",
    role: "Front-end lead",
    dates: "Jun 2021 – Jun 2022",
    location: "Barcelona",
    focus: "Healthcare workflows",
    stack: "React · TypeScript · GraphQL · PostgreSQL · Jest · Cypress · Docker",
    bullets: [
      "Led frontend development for healthcare applications used by hospitals and nursing staff to support clinical workflows and patient safety.",
      "Built React and TypeScript interfaces and contributed across the stack with GraphQL APIs, PostGraphile, PostgreSQL row-level security, and automated tests.",
      "Worked with product and medical teams to translate healthcare requirements into clear, reliable, production-ready software.",
      "Kept the design system scalable across internal and external applications while coordinating priorities with the CEO and CTO.",
    ],
  },
  {
    company: "AI-O · Artificial Intelligence Orchestrator",
    role: "Full Stack Engineer",
    dates: "May 2020 – Jun 2021",
    location: "Barcelona",
    focus: "Digital health",
    stack: "React · React Native · Node.js · TypeScript · PostgreSQL · WebRTC · Docker",
    bullets: [
      "Developed healthcare products that helped doctors and hospital managers monitor COVID-19 evolution and make data-informed decisions.",
      "Worked across the PERN stack (PostgreSQL, Express, React, Node.js) and TypeScript, delivering interfaces, APIs, and internal back-office tools.",
      "Led development across senior and junior engineers, set the CI/CD and development environment, and translated business requests into executable technical work.",
    ],
  },
  {
    company: "HartCare",
    role: "Co-Founder",
    dates: "Nov 2019 – Dec 2021",
    location: "Barcelona",
    focus: "Digital health",
    stack: "Python · React · React Native · REST APIs",
    bullets: [
      "Co-founded a digital health startup focused on products, algorithms, and services for cardiovascular care.",
      "Led early platform architecture and development while collaborating with healthcare professionals on practical tools for patients and medical staff.",
    ],
  },
];

const FOUNDER_WORK: Entry[] = [
  {
    company: "Euroviajar.com",
    role: "Founder",
    dates: "Apr 2010 – Present",
    location: "Barcelona",
    focus: "Travel platform",
    bullets: [
      "Own and grow an international travel platform across product design, application development, SEO/SMO, content, and business operations.",
      "Built the product through hands-on engineering and coordinated writers, marketers, and other contributors as the platform evolved.",
      "Turned a long-running product into a durable operating business by adapting its technology, content, and audience strategy over more than 15 years.",
    ],
  },
  {
    company: "Teldat S.A.",
    role: "Software Engineer",
    dates: "2019",
    location: "Spain",
    focus: "Banking dashboards",
    stack: "React · Redux · Puppeteer · Node.js",
    bullets: [
      "Built dashboards for monitoring banking-sector data consumption in real time, combining a React interface with Node.js services and Puppeteer-generated views.",
    ],
  },
  {
    company: "HartCare Algorithms · LUMC",
    role: "Software Engineer · Research",
    dates: "2018 – 2020",
    location: "Leiden · Barcelona",
    focus: "Health data",
    stack: "Python · kNN · React · React Native · REST APIs",
    bullets: [
      "Developed a Python algorithm for heart-arrhythmia detection using k-nearest-neighbour methods and contributed to its clinical research context at LUMC.",
      "Built cross-platform interfaces and REST APIs to make the algorithm and its results usable across web and native applications.",
    ],
  },
  {
    company: "TU Delft · Medisign",
    role: "Student Assistant · Medical design",
    dates: "2017 – 2019",
    location: "Delft, Netherlands",
    focus: "Medical innovation",
    bullets: [
      "Assisted with the coordination of the Medisign specialisation, including the Capita Selecta programme and collaboration across medical-design courses.",
      "Connected design, research, and technology perspectives for students working on complex healthcare problems.",
    ],
  },
  {
    company: "Selected client work",
    role: "Software engineer · consultant",
    dates: "2011 – 2019",
    location: "Spain · Netherlands",
    focus: "Product engineering",
    stack: "React · Node.js · Python · OpenCV · Leaflet · ECharts · Highcharts",
    bullets: [
      "Built APIs, eCommerce systems, interactive maps, and research tools for Desguaces Aeropuerto, Zaragoza Dinámica, Bazus, Siwell, Toldos Serrano, Biopyc, Inbonis Rating, Alten, and other organisations.",
      "Created a statistical market-analysis tool with JSON/Node.js data, ECharts and Highcharts visualisations, atypical-product detection, and on-the-fly graphics generation.",
      "Developed an OpenCV system for tracking surgical tools in knee arthroplasty and Leaflet/React itineraries connected to WordPress APIs.",
    ],
  },
];

const TEACHING: Entry[] = [
  {
    company: "IT Academy · Barcelona Activa",
    role: "Coding Mentor",
    dates: "Jan 2021 – Dec 2024",
    location: "Barcelona",
    focus: "Mentoring",
    bullets: [
      "Mentored hundreds of students through React, Node.js, and Data Science projects, technical assessments, and career preparation.",
      "Designed advanced courses and helped evolve the curriculum towards current industry practices.",
    ],
  },
  {
    company: "Eurecat · Ceina Formació",
    role: "Software development mentor · teacher",
    dates: "2020 – 2024",
    location: "Barcelona",
    focus: "Teaching",
    bullets: [
      "Taught full-stack web and app development, including frontend, backend, networks, deployment, accessibility, security, and testing.",
      "Mentored Node.js, React, and Data Science projects and delivered advanced React, coding, and testing training for professional teams.",
    ],
  },
];

function CvSiteHeader() {
  return (
    <header className="site-header cv-site-header">
      <a className="site-name" href="/" aria-label="Kevin Mamaqi home">Kevin Mamaqi</a>
      <nav id="site-navigation" className="nav" aria-label="Primary">
        {NAV.map((item) => (
          <a key={item.label} href={item.href} aria-current={item.href === "/cv/" ? "page" : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="site-header-actions">
        <ThemeToggle />
        <button className="menu-toggle" type="button" data-menu-toggle aria-controls="site-navigation" aria-expanded="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          <span className="sr-only">Open navigation menu</span>
        </button>
      </div>
    </header>
  );
}

function CvHeader() {
  return (
    <header className="cv-header">
      <h1>Kevin Mamaqi Kapllani</h1>
      <p className="cv-title">Engineering Manager (Hands-On) · Barcelona, Spain · Updated October 2026</p>
      <div className="cv-contact">
        <a href={LINKEDIN_URL}>LinkedIn</a>
        <span className="cv-contact-divider" aria-hidden>·</span>
        <a href={MALT_URL}>Malt reviews</a>
        <span className="cv-contact-divider cv-download-divider" aria-hidden>·</span>
        <a className="cv-download" href="/cv.pdf" target="_blank" rel="noopener noreferrer" aria-label="Download CV as a PDF (opens in a new tab)">
          Download CV
        </a>
      </div>
    </header>
  );
}

function CvSection({ label, children, className = "" }: { label: string; children: JSX.Element | JSX.Element[]; className?: string }) {
  return (
    <section className={`cv-section ${className}`}>
      <h2>{label}</h2>
      <div className="cv-section-content">{children}</div>
    </section>
  );
}

function CvEntry({ entry }: { entry: Entry }) {
  return (
    <article className="cv-entry">
      <div className="cv-entry-meta">
        <strong>{entry.dates}</strong>
        {entry.location ? <span>{entry.location}</span> : null}
      </div>
      <div className="cv-entry-body">
        <div className="cv-entry-heading">
          <div>
            <h3>{entry.company}</h3>
            <p>{entry.role}</p>
          </div>
          {entry.focus ? <span className="cv-focus">{entry.focus}</span> : null}
        </div>
        {entry.stack ? <p className="cv-stack"><strong>Stack</strong>{entry.stack}</p> : null}
        <ul>
          {entry.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      </div>
    </article>
  );
}

function CvEntries({ entries }: { entries: Entry[] }) {
  return <div className="cv-entries">{entries.map((entry) => <CvEntry key={`${entry.company}-${entry.role}`} entry={entry} />)}</div>;
}

function Skills() {
  const groups = [
    ["Languages & product", "TypeScript · Go · Python · React · Node.js · Svelte · GraphQL · gRPC · REST"],
    ["Cloud & data", "AWS · GCP · PostgreSQL · MongoDB · DynamoDB · Redis · Docker · Kubernetes · CI/CD"],
    ["Systems", "AI infrastructure · workflow orchestration · distributed systems · event-driven architecture · observability"],
    ["Ways of working", "DDD · hexagonal architecture · TDD · reliability · technical direction · mentoring · product collaboration"],
  ];

  return (
    <div className="cv-skill-list">
      {groups.map(([label, items]) => (
        <div className="cv-skill-row" key={label}>
          <strong>{label}</strong>
          <span>{items}</span>
        </div>
      ))}
    </div>
  );
}

function Education() {
  return (
    <div className="cv-education">
      <div className="cv-education-row">
        <div><strong>2017 – 2019</strong><span>Delft, Netherlands</span></div>
        <div><h3>TU Delft</h3><p>MSc Integrated Product Design · Medisign specialisation</p></div>
      </div>
      <div className="cv-education-row">
        <div><strong>2010 – 2015</strong><span>Zaragoza, Spain</span></div>
        <div><h3>University of Zaragoza</h3><p>Degree in Industrial Design Engineering and Product Development</p></div>
      </div>
    </div>
  );
}

function PublicWork() {
  return (
    <div className="cv-public-work">
      <p><strong>{RETINAL_PAPER.year}</strong> · <a href={RETINAL_PAPER.url}><em>{RETINAL_PAPER.title}</em></a>, {RETINAL_PAPER.journal}.</p>
      <p><strong>2020</strong> · <em>Perspectives of Patients and Professionals on Information and Education After Myocardial Infarction</em>, JMIR Human Factors.</p>
      <p><strong>2024</strong> · <em>Ace the Technical Interview with AI</em>, practical workshop at Talent Arena / MWC Barcelona.</p>
    </div>
  );
}

export default function CvPage(): JSX.Element {
  return (
    <main className="cv-shell">
      <CvSiteHeader />
      <article id="cv-document" className="cv-document">
        <CvHeader />
        <CvSection label="Profile" className="cv-profile">
          <p className="cv-summary">
            I build execution infrastructure for AI agents — dispatch, routing, state and verification — and lead the team that runs it. Fifteen years building software, still writing code. At Eachlabs I lead a team of 5 engineers and own the execution engine, dispatch, LLM router and AWS platform behind 10M+ executions a month across 800+ models. Earlier work spans maritime operations at 90POE and hospital-facing healthcare products.
          </p>
        </CvSection>
        <CvSection label="Core skills">
          <Skills />
        </CvSection>
        <CvSection label="Experience">
          <CvEntries entries={EXPERIENCE} />
        </CvSection>
        <CvSection label="Founder & earlier work">
          <CvEntries entries={FOUNDER_WORK} />
        </CvSection>
        <CvSection label="Teaching & mentoring">
          <CvEntries entries={TEACHING} />
        </CvSection>
        <CvSection label="Education">
          <Education />
        </CvSection>
        <CvSection label="Selected public work" className="cv-last-section">
          <PublicWork />
          <div className="cv-languages"><strong>Languages</strong><span>Spanish · Albanian · English</span></div>
        </CvSection>
      </article>
      <p className="cv-footnote">Kevin Mamaqi Kapllani · Engineering Manager (Hands-On) · Barcelona</p>
    </main>
  );
}
