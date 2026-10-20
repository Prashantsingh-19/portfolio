# IT Service Operations & SLA Risk Analytics

## IT SLA risk project: what it is
Prashant analysed a real ServiceNow incident log from the UCI repository: 141,712 events for 24,918 incidents opened between February 2016 and February 2017. The questions: where do IT support tickets get stuck, why do they miss their SLA, and which operational changes would cut misses?

## IT SLA risk project: how it's built
- One row per incident built from the event log, with documented data-quality decisions (for example, the SLA flag only flips on the close event, so the SLA clock is inferred from resolution time).
- KPIs and exploratory analysis by priority, group and handoffs.
- K-means segmentation of tickets.
- An early-warning model using only information known when a ticket opens (logistic regression and XGBoost with SHAP), on a time-based train/test split.
- Kaplan-Meier survival curves and a Cox model for resolution time.

## IT SLA risk project: key results
Handoffs drive SLA misses: among Moderate tickets, the miss rate rises from 21% with no reassignment to 82% at four or more. Reassigned tickets take a median of 84 hours to resolve, against 25 minutes for tickets never reassigned. "Ping-pong" and "stalled" ticket segments cause 83% of misses. The early-warning score catches 44% of misses by reviewing the riskiest 20% of tickets (test AUC 0.77). Prashant recommends four sized actions: a handoff cap at the third reassignment, fixes for underperforming groups, a 48-hour ageing alert and an early-warning triage queue. Together these could plausibly cut misses by about 20–30%, to be confirmed with a pilot.

## IT SLA risk project: why it matters (for a recruiter)
The project turns messy operational data into causes, a predictive early warning and sized operational recommendations. It is relevant to operations analytics, consulting and data science roles.
