// Public copy supplied in Kevin's 15 October 2026 implementation brief.
// The earlier Eachlabs dates and contract framing were confirmed in chat.
// Public operating figures intentionally use generic magnitudes, per Kevin.
export const LINKS = {
  linkedin: "https://www.linkedin.com/in/kevinmamaqi",
  github: "https://github.com/kevinmamaqi",
  malt: "https://www.malt.es/profile/kevinmamaqikapllani",
  cv: "/cv/",
};

export const NAV = [
  { label: "Work", href: "#work" },
  { label: "Method", href: "#method" },
  { label: "Writing", href: "#notes" },
  { label: "Skills", href: "#skills" },
  { label: "CV", href: LINKS.cv },
  { label: "Contact", href: "#contact" },
];

export const HEADLINE = "I build the infrastructure that runs AI agents reliably at scale — and lead the team that runs it.";
export const DESCRIPTION = "Hands-on Tech Lead and Engineering Manager building execution infrastructure for AI agents: dispatch, routing, state and verification. Barcelona, remote-friendly, US-overlap.";
export const TITLE = "Kevin Mamaqi Kapllani — Tech Lead & Engineering Manager · AI Agent Infrastructure";
export const REVIEW_NOTES = [
  "paper links",
  "Local copies of the two LinkedIn articles require source Markdown; retain their existing links until supplied.",
];

export const EACHLABS = {
  role: "Engineering Manager (Hands-On)",
  dates: "Nov 2025 – present",
  earlierRole: "Founding backend engineer (contract / part-time)",
  earlierDates: "Mar 2025 – Nov 2025",
};

export const NINETY_POE = {
  role: "Senior Software Engineer / Team Lead",
  dates: "Dec 2022 – Nov 2025",
};

export const PROJECTS = [
  {
    name: "Eachlabs",
    tag: "AI infrastructure",
    role: EACHLABS.role,
    period: EACHLABS.dates,
    earlier: `${EACHLABS.earlierRole} · ${EACHLABS.earlierDates}`,
    summary: "Lead a small engineering team building an AI Models API and Workflows API — the execution layer under AI apps and agents. I set technical direction and personally own the execution engine, dispatch, the LLM router and the AWS platform they run on. Wrote the first commit of the backend platform in March 2025 and still ship daily.",
    points: [
      "Execution engine, dispatch and LLM router handling millions of executions a month, with peaks of thousands per minute, across hundreds of models and dozens of providers",
      "Exactly-once dispatch through a versioned gRPC handshake and idempotent request handling, verified with concurrent calls and failure-injection tests",
      "Migrated a large execution store to Aurora through a controlled production cutover, preserving data integrity while improving reliability and throughput",
      "Resilience layer — bulkheads, circuit breakers, graceful drain and automatic multi-provider fallback to recover from provider and edge failures",
      "Built backend services and the AWS CDK platform, with production alerts and dashboards managed as code",
      "Spec → execute → verify delivery system with reusable validation contracts and production Slack agents; increased team delivery throughput and deployment frequency",
    ],
    stack: "Go · TypeScript · gRPC · GraphQL · PostgreSQL/Aurora · Redis · SQS · AWS CDK · Grafana · OpenTelemetry",
  },
  {
    name: "90POE",
    tag: "Maritime software",
    role: NINETY_POE.role,
    period: NINETY_POE.dates,
    summary: "Led a cross-functional team building onboard and shore-side services for vessel planning, itineraries, port calls and onboard workflows, used by leading maritime operators. Owned backend and frontend services end to end.",
    points: [
      "Team leadership across product and engineering: priorities, 1:1s, code review as teaching",
      "APIs, database migrations, performance work and CI/CD across Go and GraphQL services",
      "Operational software under real maritime constraints: offline-tolerant, auditable, long-lived",
    ],
    stack: "Go · PostgreSQL · MongoDB · Redis · Docker · AWS",
  },
  {
    name: "Robbie AI",
    tag: "Healthcare workflows",
    role: "Front-end lead",
    period: "2021 – 2022",
    summary: "Built healthcare interfaces for nurse-facing and operating-room workflows, where clear information, timing, and data boundaries mattered more than visual noise.",
    points: [
      "React and TypeScript product interfaces",
      "GraphQL and PostgreSQL-backed workflows",
      "Healthcare UI work under real operational constraints",
    ],
  },
];
