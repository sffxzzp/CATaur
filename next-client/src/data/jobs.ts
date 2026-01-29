export type Job = {
  slug: string;
  title: string;
  company: string;
  location: string;
  workType: "remote" | "hybrid" | "onsite";
  salaryMin: number;
  salaryMax: number;
  salaryRange: string;
  summary: string;
  tags: string[];
  responsibilities: string[];
  requirements: string[];
  about: string;
};

export const JOBS: Job[] = [
  {
    slug: "senior-product-designer",
    title: "Senior Product Designer",
    company: "Northwind Intelligence",
    location: "San Francisco, CA",
    workType: "hybrid",
    salaryMin: 145000,
    salaryMax: 185000,
    salaryRange: "$145k – $185k",
    summary:
      "Lead the experience design for AI-first workflow tools that help global operations teams make faster decisions.",
    tags: ["design", "saas", "ai tooling", "figma"],
    responsibilities: [
      "Own discovery-to-delivery design work across a complex enterprise product surface",
      "Translate ambiguous problem statements into clear flows, prototypes, and visual systems",
      "Partner with product and data science to define north-star experience metrics",
      "Mentor designers across product squads and mature design ops rituals",
    ],
    requirements: [
      "7+ years designing end-to-end product experiences in fast-paced teams",
      "A portfolio that demonstrates systems thinking and delightful execution",
      "Strong interaction design skills across responsive web and native surfaces",
      "Comfort running mixed-methods research and turning insight into action",
    ],
    about:
      "Northwind Intelligence builds adaptive planning software for global supply chains. The design team partners closely with data and engineering to ship thoughtful experiences that deliver measurable outcomes for operators around the world.",
  },
  {
    slug: "staff-ml-engineer",
    title: "Staff Machine Learning Engineer",
    company: "Helios Labs",
    location: "New York, NY",
    workType: "onsite",
    salaryMin: 175000,
    salaryMax: 220000,
    salaryRange: "$175k – $220k",
    summary:
      "Scale Helios's experimentation platform and production models that power personalization across the product suite.",
    tags: ["ml", "python", "ml ops", "personalization"],
    responsibilities: [
      "Design, deploy, and maintain distributed training pipelines",
      "Collaborate with product to scope experiments that improve key engagement metrics",
      "Improve observability and reliability of model serving infrastructure",
      "Guide a cross-functional pod on ML best practices and technical strategy",
    ],
    requirements: [
      "8+ years shipping ML systems with measurable business impact",
      "Deep experience with Python, modern ML frameworks, and streaming data",
      "Comfort navigating regulatory and data privacy constraints",
      "Ability to translate complex technical concepts to product stakeholders",
    ],
    about:
      "Helios Labs is a climate analytics company helping energy providers forecast demand using machine learning. Engineering works hand-in-hand with climate scientists and product to operationalize cutting-edge research.",
  },
  {
    slug: "lead-product-manager",
    title: "Lead Product Manager",
    company: "Orbit Collaboration",
    location: "Remote - North America",
    workType: "remote",
    salaryMin: 150000,
    salaryMax: 190000,
    salaryRange: "$150k – $190k",
    summary:
      "Drive the roadmap for Orbit's collaboration hub, aligning product vision with customer insights from enterprise rollouts.",
    tags: ["product", "b2b", "collaboration", "roadmap"],
    responsibilities: [
      "Define and evangelize a multi-quarter roadmap grounded in customer value",
      "Lead cross-functional teams through discovery, prioritization, and delivery",
      "Establish product analytics instrumentation to measure outcomes",
      "Partner with GTM to position launches and capture feedback loops",
    ],
    requirements: [
      "6+ years in product management shipping complex SaaS products",
      "Experience operating in a remote-first environment across time zones",
      "Comfort presenting to executive stakeholders and large customer audiences",
      "Ability to synthesize qualitative and quantitative signals into strategy",
    ],
    about:
      "Orbit Collaboration empowers distributed teams with an async-first productivity platform. Product leadership partners closely with design research and platform engineering to deliver calm, resilient workflows.",
  },
  {
    slug: "principal-security-architect",
    title: "Principal Security Architect",
    company: "Atlas Commerce",
    location: "Austin, TX",
    workType: "hybrid",
    salaryMin: 185000,
    salaryMax: 235000,
    salaryRange: "$185k – $235k",
    summary:
      "Establish Atlas's security reference architecture as the company expands its fintech offerings globally.",
    tags: ["security", "fintech", "zero trust", "compliance"],
    responsibilities: [
      "Define cloud security patterns and guardrails across product teams",
      "Lead threat modeling, red-team planning, and vulnerability management rituals",
      "Partner with compliance to maintain PCI, SOC 2, and GDPR controls",
      "Mentor engineers and drive adoption of zero-trust principles",
    ],
    requirements: [
      "10+ years architecting secure distributed systems at scale",
      "Hands-on expertise with AWS security services and identity platforms",
      "Strong knowledge of regulatory frameworks across fintech markets",
      "Excellent communication skills for executive and engineering audiences",
    ],
    about:
      "Atlas Commerce powers checkout experiences for modern retailers. The security organization works horizontally to safeguard customer data while enabling rapid experimentation.",
  },
  {
    slug: "senior-data-analyst",
    title: "Senior Data Analyst",
    company: "Waypoint Health",
    location: "Chicago, IL",
    workType: "onsite",
    salaryMin: 120000,
    salaryMax: 150000,
    salaryRange: "$120k – $150k",
    summary:
      "Partner with clinical operations to build actionable dashboards and uncover insights that improve patient outcomes.",
    tags: ["analytics", "sql", "healthcare", "tableau"],
    responsibilities: [
      "Own the data pipeline that powers executive reporting and day-to-day operations",
      "Develop experimentation frameworks that measure impact of care programs",
      "Collaborate with engineering to improve data quality and governance",
      "Champion a culture of curiosity and thoughtful data storytelling",
    ],
    requirements: [
      "5+ years in data analytics with strong SQL and visualization skills",
      "Experience supporting clinical or regulated environments",
      "A track record of partnering with non-technical stakeholders",
      "Ability to communicate complex findings clearly and persuasively",
    ],
    about:
      "Waypoint Health is a value-based care provider. The analytics team collaborates with clinicians and operations to surface real-time decision support and longitudinal patient insights.",
  },
  {
    slug: "founding-revenue-lead",
    title: "Founding Revenue Lead",
    company: "Signal Field",
    location: "Remote - US",
    workType: "remote",
    salaryMin: 130000,
    salaryMax: 180000,
    salaryRange: "$130k – $180k + equity",
    summary:
      "Set the go-to-market foundation for Signal Field's early-stage AI observability platform.",
    tags: ["sales", "ai", "startup", "gtm"],
    responsibilities: [
      "Design, pilot, and refine repeatable revenue motions with design partners",
      "Build the early sales pipeline and manage end-to-end deal execution",
      "Collaborate with product on pricing, packaging, and case studies",
      "Stand up tooling and playbooks for future revenue hires",
    ],
    requirements: [
      "4+ years closing complex enterprise deals in technical markets",
      "Experience operating as an early GTM hire at startups",
      "Comfort navigating ambiguous, founder-led sales cycles",
      "Strong storytelling and executive presence",
    ],
    about:
      "Signal Field offers observability for AI systems in production. As one of the first revenue hires you will partner directly with the founders to shape product direction and land marquee customers.",
  },
];
