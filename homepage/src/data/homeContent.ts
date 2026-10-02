export type Step = {
  phase: string;
  title: string;
  description: string;
};

export type Quote = {
  quote: string;
  name: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Metric = {
  label: string;
  value: string;
};

export type ApproachItem = {
  tag: string;
  title: string;
  description: string;
};

export type SystemEntry = {
  id: string;
  title: string;
  description: string;
  functions: string;
  status: string;
  cta: string;
  /** Internal route for the CTA; `null` opens the LLM workspace instead. */
  href: string | null;
};

export type CoverageCity = {
  name: string;
  lat: number;
  lon: number;
};

export const steps: ReadonlyArray<Step> = [
  {
    phase: "Input",
    title: "Tell us what you need",
    description: "Share your location, timeline, and the service you want.",
  },
  {
    phase: "Verify",
    title: "We verify and match",
    description:
      "Altair checks availability, compliance fit, and the right provider.",
  },
  {
    phase: "Update",
    title: "Get updates fast",
    description: "Receive clear updates and next steps within 24 hours.",
  },
];

export const quotes: ReadonlyArray<Quote> = [
  {
    quote:
      "Altair connected me with a licensed attorney the same day and kept me updated.",
    name: "Redwood City client, Susan",
  },
  {
    quote:
      "I submitted one enquiry and was matched with a local provider fast, no back and forth.",
    name: "Palo Alto client, Miguel",
  },
  {
    quote:
      "The intake was simple and the handoff felt smooth. I knew what to expect.",
    name: "San Mateo client, Priya",
  },
];

export const faqs: ReadonlyArray<FaqItem> = [
  {
    question: "How much does it cost?",
    answer:
      "Altair is free to start. You only pay the provider for services you choose.",
  },
  {
    question: "Is my information private?",
    answer:
      "Yes. We collect only what is needed to match you and keep it protected.",
  },
  {
    question: "How fast will I hear back?",
    answer:
      "Most requests receive a response within 24 hours during business days.",
  },
  {
    question: "Which areas do you serve?",
    answer:
      "We focus on the San Francisco Bay Area and expand based on demand.",
  },
  {
    question: "Does Altair give legal or financial advice?",
    answer:
      "No. Altair connects you with licensed attorneys and regulated advisors who provide the advice and services.",
  },
];

/** Single source for the stated figures reused across homepage sections. */
export const stats = {
  averageResponse: "4-12 hrs",
  verifiedProviders: "140+",
  clientSatisfaction: "4.9/5",
  responseRate: "98%",
} as const;

export const metrics: ReadonlyArray<Metric> = [
  { label: "Average response", value: stats.averageResponse },
  { label: "Verified providers", value: stats.verifiedProviders },
  { label: "Client satisfaction", value: stats.clientSatisfaction },
];

export const approach: ReadonlyArray<ApproachItem> = [
  {
    tag: "Research",
    title: "Start from the real request",
    description:
      "We look closely at how people describe everyday needs — where, when and under what constraints — and design intake that asks only for what is needed.",
  },
  {
    tag: "Systems",
    title: "Agents that verify before they match",
    description:
      "AI-guided intake, availability checks and provider matching, with licensing, responsiveness and service quality checked before any handoff.",
  },
  {
    tag: "Deployment",
    title: "Shipped into live workflows",
    description:
      "Running today across four service lines and six Bay Area cities, with status updates, timelines and next steps on every request.",
  },
];

export const systems: ReadonlyArray<SystemEntry> = [
  {
    id: "S-01",
    title: "Intake & matching agent",
    description:
      "AI-guided intake that checks provider availability and licensing and returns a verified local match.",
    functions: "Intake · Verification · Matching",
    status: "Live · 4 service lines",
    cta: "Make a request",
    href: "/enquiry",
  },
  {
    id: "S-02",
    title: "Document review workspace",
    description:
      "Upload a DOCX, highlight any passage and ask a language model about it — using your own provider key, model and endpoint.",
    functions: "Documents · LLM chat",
    status: "Live · No sign-in needed",
    cta: "Open the review tool",
    href: "/review",
  },
  {
    id: "S-03",
    title: "LLM workspace",
    description:
      "A managed chat workspace with provider credentials and usage tracking, on a dedicated host for signed-in Altair accounts.",
    functions: "Chat · Keys · Usage",
    status: "Live · Altair account",
    cta: "Open the workspace",
    href: null,
  },
];

export const coverageCities: ReadonlyArray<CoverageCity> = [
  { name: "San Francisco", lat: 37.77, lon: -122.42 },
  { name: "Oakland", lat: 37.8, lon: -122.27 },
  { name: "San Jose", lat: 37.34, lon: -121.89 },
  { name: "Berkeley", lat: 37.87, lon: -122.27 },
  { name: "Palo Alto", lat: 37.44, lon: -122.14 },
  { name: "San Mateo", lat: 37.56, lon: -122.32 },
];
