export type ServiceMetric = {
  label: string;
  value: string;
};

export type ServiceStep = {
  title: string;
  description: string;
};

export type ServiceFaq = {
  question: string;
  answer: string;
};

export type Service = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  shortDescription: string;
  image: string;
  tag: string;
  highlights: string[];
  suitedFor: string[];
  timeline: ServiceStep[];
  outcomes: ServiceMetric[];
  deliverables: string[];
  compliance: string[];
  faqs: ServiceFaq[];
};

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const services: Service[] = [
  {
    slug: "legal-services",
    title: "Legal Services Discovery",
    tagline: "Licensed attorney matchmaking with a compliance-first intake.",
    description:
      "We collect the right details, confirm availability, and connect you with vetted attorneys who can take action quickly.",
    shortDescription:
      "Structured intake and rapid matching with licensed attorneys for everyday legal needs.",
    image: publicAsset("images/legal-services.jpg"),
    tag: "LS",
    highlights: [
      "Attorney matching within 24 hours",
      "Clear updates at every step",
      "Secure intake with privacy controls",
    ],
    suitedFor: [
      "Estate planning and trusts",
      "Business formation and contracts",
      "Real estate transactions",
      "Employment and compliance questions",
    ],
    timeline: [
      {
        title: "Submit your request",
        description: "Share your location, urgency, and what you need help with.",
      },
      {
        title: "We verify availability",
        description:
          "Altair checks licenses, confirms capacity, and aligns with your goals.",
      },
      {
        title: "Connect and schedule",
        description:
          "Receive a confirmed provider match and instructions for next steps.",
      },
    ],
    outcomes: [
      { label: "Average response", value: "4-12 hours" },
      { label: "Match success", value: "92%" },
      { label: "Partner rating", value: "4.9/5" },
    ],
    deliverables: [
      "Shortlist of verified attorneys",
      "Summary of next steps and estimated timelines",
      "Secure handoff to your chosen provider",
    ],
    compliance: [
      "Only licensed attorneys in your jurisdiction",
      "No legal advice is provided by Altair",
      "Encrypted intake and limited data retention",
    ],
    faqs: [
      {
        question: "Do you provide legal advice?",
        answer:
          "No. Altair connects you with licensed attorneys who provide the advice and services.",
      },
      {
        question: "How quickly will I hear back?",
        answer:
          "Most legal requests receive a response within 4 to 12 hours on business days.",
      },
      {
        question: "Can you match outside the Bay Area?",
        answer:
          "We currently focus on the San Francisco Bay Area and will expand soon.",
      },
    ],
  },
  {
    slug: "pet-sitting",
    title: "Pet Sitting Match",
    tagline: "Reliable pet care with fast availability checks.",
    description:
      "From weekday walks to extended travel coverage, we confirm availability and connect you with trusted sitters.",
    shortDescription:
      "Trusted pet sitters matched to your schedule with clear availability checks.",
    image: publicAsset("images/pet-sitting.webp"),
    tag: "PS",
    highlights: [
      "Availability confirmed in hours",
      "Verified local sitters",
      "Schedule changes handled fast",
    ],
    suitedFor: [
      "Weekend and travel coverage",
      "Daily dog walks",
      "Cat sitting and check-ins",
      "Special care instructions",
    ],
    timeline: [
      {
        title: "Share your schedule",
        description:
          "Tell us dates, pet details, and any special instructions you have.",
      },
      {
        title: "We confirm sitters",
        description: "We check availability and match you with trusted local sitters.",
      },
      {
        title: "Meet and handoff",
        description:
          "Choose a sitter and receive a clear handoff plan with updates.",
      },
    ],
    outcomes: [
      { label: "Average confirmation", value: "2-6 hours" },
      { label: "Repeat clients", value: "68%" },
      { label: "Coverage radius", value: "25 miles" },
    ],
    deliverables: [
      "Confirmed sitter availability",
      "Schedule and care notes summary",
      "Ongoing status updates",
    ],
    compliance: [
      "Identity-verified sitters",
      "Clear cancellation and handoff terms",
      "Privacy-first request handling",
    ],
    faqs: [
      {
        question: "Can I meet the sitter first?",
        answer:
          "Yes. We encourage a short meet-and-greet before the first booking.",
      },
      {
        question: "Do you handle emergency requests?",
        answer:
          "We can prioritize urgent requests based on availability in your area.",
      },
      {
        question: "What pets are supported?",
        answer:
          "We primarily support dogs and cats, but can review other requests case by case.",
      },
    ],
  },
  {
    slug: "local-car-rental",
    title: "Local Car Rental Service",
    tagline: "Quick availability checks for trusted local rentals.",
    description:
      "We verify inventory, confirm pricing ranges, and connect you with local rental providers you can trust.",
    shortDescription:
      "Confirm availability quickly and connect with local rental providers with confidence.",
    image: publicAsset("images/financial-planning.jpg"),
    tag: "CR",
    highlights: [
      "Same-day availability checks",
      "Transparent pricing ranges",
      "Local provider screening",
    ],
    suitedFor: [
      "Short-term city trips",
      "Weekend getaways",
      "Temporary replacement vehicles",
      "Business travel needs",
    ],
    timeline: [
      {
        title: "Request a vehicle",
        description: "Share dates, pickup area, and vehicle preferences.",
      },
      {
        title: "We confirm inventory",
        description: "Altair verifies availability and aligns with your budget.",
      },
      {
        title: "Book with confidence",
        description:
          "Receive a confirmed provider and clear pickup instructions.",
      },
    ],
    outcomes: [
      { label: "Average response", value: "1-4 hours" },
      { label: "On-time pickup", value: "96%" },
      { label: "Repeat rentals", value: "54%" },
    ],
    deliverables: [
      "Confirmed availability and pricing",
      "Pickup location details",
      "Support contacts for day-of changes",
    ],
    compliance: [
      "Verified local rental partners",
      "Clear insurance and policy summaries",
      "Secure data sharing with providers",
    ],
    faqs: [
      {
        question: "Do you handle insurance?",
        answer:
          "We share partner policies and help you select the right coverage with the provider.",
      },
      {
        question: "Can I change pickup times?",
        answer:
          "Yes. We coordinate changes as long as inventory remains available.",
      },
      {
        question: "Is there a booking fee?",
        answer:
          "Altair does not charge a booking fee. You pay the provider directly.",
      },
    ],
  },
  {
    slug: "financial-planning",
    title: "Everyday Financial Planning",
    tagline: "Organize goals and connect with regulated advisors.",
    description:
      "We capture your goals, organize key documents, and connect you with licensed advisors for compliant guidance.",
    shortDescription:
      "Organize goals and access regulated financial guidance with a clear, guided intake.",
    image: publicAsset("images/local-car-rental.png"),
    tag: "FP",
    highlights: [
      "Goal-focused planning intake",
      "Advisor availability checks",
      "Compliance-ready documentation",
    ],
    suitedFor: [
      "Budget planning and savings goals",
      "Retirement readiness",
      "College savings plans",
      "Investment advisor discovery",
    ],
    timeline: [
      {
        title: "Share your goals",
        description: "Tell us your priorities, timelines, and current situation.",
      },
      {
        title: "We organize the intake",
        description:
          "Altair structures the intake for regulated advisor review.",
      },
      {
        title: "Match with advisors",
        description:
          "Receive vetted options and schedule a compliant discovery call.",
      },
    ],
    outcomes: [
      { label: "Average response", value: "8-16 hours" },
      { label: "Advisor match rate", value: "88%" },
      { label: "Client satisfaction", value: "4.8/5" },
    ],
    deliverables: [
      "Structured intake summary",
      "Advisor shortlist and meeting options",
      "Clear next steps and documents checklist",
    ],
    compliance: [
      "Only regulated advisors onboarded",
      "No investment advice from Altair",
      "Secure handling of sensitive data",
    ],
    faqs: [
      {
        question: "Do you provide investment advice?",
        answer:
          "No. We connect you with regulated advisors who provide compliant guidance.",
      },
      {
        question: "What documents should I prepare?",
        answer:
          "We will share a tailored checklist once we review your goals.",
      },
      {
        question: "Can I request a specific advisor?",
        answer:
          "Yes. Share preferences and we will confirm availability if possible.",
      },
    ],
  },
];
