# CollectIQ — AI Receivables Briefing Tool for Indian SMEs

## CollectIQ: what it is
CollectIQ is a Gen AI product Prashant is building (status: in progress; designed, prototype being built, October 2026). It is an AI receivables briefing tool for Indian SMEs, which often wait 60 to 120+ days to be paid and don't know which customers are slipping or whom to chase first. The SME uploads its invoice ledger as a CSV or Excel export, with no migration from its accounting software. CollectIQ returns a plain-language weekly brief: who owes what, who is slipping, how much cash is at risk, and a prioritised chase list.

## CollectIQ: design and agentic layer
CollectIQ's design idea is "extract → verify → narrate". Code computes every figure (DSO, ageing buckets, cash at risk and a late-payment risk score), and the LLM only writes the brief and reminder text. A validator rejects any text citing a number the code didn't produce. The agentic collections layer scans invoices daily and escalates on a 4-tier ladder (due date, then 7, 30 and 60+ days overdue). It drafts reminders that the owner approves, edits or snoozes, keeping a human in the loop. An opt-in autopilot sends only low-value, low-risk reminders, every action goes into an audit log, and cooldowns stop it spamming customers.

## CollectIQ: business model and stack
CollectIQ's business model is B2B2C through chartered accountant (CA) firms. One CA manages many SME clients, so distributing through CAs addresses both trust and customer acquisition cost. Planned stack: Python, pandas, scikit-learn, SQLite, Streamlit, APScheduler for the daily scan, and the Gemini or Claude API for text. CollectIQ is a portfolio prototype with no real users yet.
