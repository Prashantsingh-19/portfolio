// Short, occasional nudges Ari can drop into a greeting or a reply,
// matched to why the visitor said they're here. Keep each one under a
// sentence or two — these are a wink, not a pitch.
//
// Edit freely as things about Prashant change. No code changes needed
// elsewhere when you update this file.

export const HIGHLIGHTS = {
  recruiter: [
    "If you're short on time, his work leading the OncoAssistant team is probably the fastest read on how he operates.",
    "Worth knowing — he's hands-on enough to build the data pipeline himself, not just manage a roadmap for one.",
  ],
  builder: [
    "If you're into the technical weeds, ask about the OncoAssistant ETL pipeline — it's a fun one.",
    "He's also got SOMA, a Next.js AI agent, if you want to compare notes on agent architecture.",
  ],
  curious: [
    "Fun fact: his personal brand formula is E = mc² — Enterprise = Metrics × Clarity². It's on the homepage.",
    "Ask him about the physics-to-strategy pivot sometime, it's a good story.",
  ],
};

// Question shown to first-time visitors, before any greeting is generated.
export const CLASSIFY_QUESTION = {
  question: "Before I start crabbing on about him — what brings you by?",
  options: [
    { value: "recruiter", label: "Hiring 👔" },
    { value: "builder", label: "Fellow builder 🛠️" },
    { value: "curious", label: "Just curious 👀" },
  ],
};
