// Work lines, method and contact copy follow Kevin's 30 October 2026
// simplification brief, which supersedes the 15 October brief: plain first
// person, no jargon above the fold, at most two public numbers. Kevin then
// asked for a hero that opens with his role and introduces him in his own
// voice, tied to the harness and inference themes in his SF Tech Week note.
// The earlier Eachlabs dates and contract framing were confirmed in chat.
// Public scale uses Kevin's approved monthly execution and catalog figures
// (catalog updated to 800+ models on 30 October 2026).
// Keep internal migration and test measurements qualitative.
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
  { label: "CV", href: LINKS.cv },
  { label: "Contact", href: "#contact" },
];

export const HEADLINE = "Hi, I’m Kevin. I work on the engineering around AI models.";
export const DESCRIPTION = "Hi, I’m Kevin. I work on the engineering around AI models: engineering manager at Eachlabs, where my team builds the APIs behind 800+ AI models.";
export const TITLE = "Kevin Mamaqi Kapllani — Engineering Manager / Tech Lead · Barcelona";
export const REVIEW_NOTES = [
  "paper links for the 2026 research manuscripts",
  "Local copies of the two LinkedIn articles require source Markdown; retain their existing links until supplied.",
];

export const RETINAL_PAPER = {
  title: "A Novel Approach to Retinal Blood Vessel Segmentation Using Bi-LSTM-Based Networks",
  year: 2025,
  journal: "Mathematics",
  url: "https://www.mdpi.com/2227-7390/13/13/2043",
};

export const EACHLABS = {
  role: "Engineering Manager (Hands-On)",
  dates: "Nov 2025 – present",
  earlierRole: "Part-time Tech Lead (contract)",
  earlierDates: "Mar 2025 – Nov 2025",
  earlierSummary: "built the new backend foundation",
  earlierDescription: "Led the design and build of Eachlabs' new backend foundation while still at 90POE: service architecture, AWS CDK platform, CI, and the first production services the current platform runs on.",
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
    earlier: `${EACHLABS.earlierRole} · ${EACHLABS.earlierDates} — ${EACHLABS.earlierSummary}`,
    summary: "I lead a team of five and own the systems that run millions of AI jobs a month.",
    points: [
      "Execution & Routing Engines, handling dozens of millions of executions/month, with peaks of thousands per minute, across 800+ models and dozens of providers",
      "Exactly-once dispatch through a versioned gRPC handshake and idempotent request handling, verified with concurrent calls and failure-injection tests",
      "Migrated a large execution store to Aurora through a controlled production cutover, preserving data integrity while improving reliability and throughput",
      "Resilience layer — bulkheads, circuit breakers, graceful drain and automatic multi-provider fallback to recover from provider and edge failures",
      "Built the new backend foundation: backend services and the AWS CDK platform, with production alerts and dashboards managed as code",
      "Spec → execute → verify delivery system with reusable validation contracts and production Slack agents; increased team delivery throughput and deployment frequency",
    ],
    stack: "Go · TypeScript · gRPC · GraphQL · PostgreSQL/Aurora · Redis · SQS · AWS CDK · Grafana · OpenTelemetry",
  },
  {
    name: "90POE",
    tag: "Maritime software",
    role: NINETY_POE.role,
    period: NINETY_POE.dates,
    summary: "I led a cross-functional team building vessel-planning software, end to end.",
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
    summary: "I led the front-end for nurse and operating-room tools.",
    points: [
      "React and TypeScript product interfaces",
      "GraphQL and PostgreSQL-backed workflows",
      "Healthcare UI work under real operational constraints",
    ],
  },
];
