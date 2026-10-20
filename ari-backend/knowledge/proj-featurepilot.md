# FeaturePilot — Agentic RAG Copilot over Product Feature Requests

## FeaturePilot: what it is
FeaturePilot is a Generative AI and NLP project Prashant is building (status: in progress, October 2026). It is a copilot for product managers over public GitHub feature requests and issues for two competing BI tools, Metabase and Apache Superset. A PM can ask "What are users asking for most?", "Which requests does a competitor handle that we lack?" or "Rank the top requests by demand", and gets ranked requests, competitor gaps and PRD-ready problem statements backed by real issues, with 👍 reactions as the demand signal.

## FeaturePilot: design ("code counts, search cites")
In FeaturePilot, an LLM plans the answer and chooses tools. Counting tools in pandas and SQL handle volumes, trends, demand and spike detection, and retrieval finds real issues as evidence. A validator checks that every number in the answer appears in a tool result; if not, the copilot gets one rewrite, then falls back to an answer built directly from tool output. It also runs in offline mode with no API key, routing questions to tools with rules, so demos never break.

## FeaturePilot: the ReviewPilot engine it is built on
Prashant first built FeaturePilot's engine as ReviewPilot (built and tested), an agentic RAG copilot over Google Play reviews of Indian fintech apps (PhonePe, Google Pay, Paytm, CRED and Navi). ReviewPilot has 6 tools: review search, theme counts, competitor comparison, before/after-update impact with a t-test, complaint-spike alerts (anomaly detection) and backlog prioritisation (volume × 1-star share × trend). It has a number validator, offline mode, a Streamlit app (Copilot, Insights, Alerts & Backlog, PRD drafts and Audit log tabs) and 12 passing automated tests on a synthetic test fixture. PM documents include a PRD with user stories and acceptance criteria, release notes, a QA test log with 3 bugs found and fixed, and a usability test plan. Prashant found Play Store reviews too short and shallow to drive product decisions, so he moved the engine to GitHub feature requests, which have richer text and a clear demand signal.

## FeaturePilot: stack
FeaturePilot and ReviewPilot use Python, pandas, scikit-learn (TF-IDF) or sentence-transformers, SQLite, Streamlit, Plotly and pytest, with Gemini, Claude or Ollama as LLM providers. It is a portfolio project with no real users yet.
