// Public copy supplied in Kevin's 15 October 2026 implementation brief.
// The earlier Eachlabs dates and contract framing were confirmed in chat.
// Kevin also confirmed 700+ models and 75 providers for public copy in chat.
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
    summary: "Lead a team of 5 engineers building an AI Models API and Workflows API — the execution layer under AI apps and agents. I set technical direction and personally own the execution engine, dispatch, the LLM router and the AWS platform they run on. Wrote the first commit of the backend platform in March 2025 and still ship daily.",
    points: [
      "Execution engine, dispatch and LLM router for ~12M executions/month (peak ~2,100/min) across 700+ models and 75 providers",
      "Exactly-once dispatch: versioned gRPC handshake, 8 concurrent same-ID creates → 1 commit; 0 lost / 0 duplicate-billed across a 4,400-execution failure-injection series",
      "Migrated the execution store (52M rows, 563 GB) off an ERP-hosted database to Aurora with zero data loss and a 6-minute write freeze; same customer load went from 56% to 100% success, +47% throughput",
      "Resilience layer — bulkheads, circuit breakers, graceful drain, multi-provider fallback (successor dispatched 287 ms after failure); edge failures at 180 RPS from 2,322 to 12",
      "Founded 11 backend services and the AWS CDK platform: 211 production alerts and 23 dashboards as code",
      "Spec → execute → verify delivery system (~480 validation contracts) and 6 production Slack agents; team output 297 → 338 PRs/month, deploys 25 → 51/week",
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
