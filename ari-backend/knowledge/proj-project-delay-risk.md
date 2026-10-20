# Project Delay Risk Analysis

## Project delay risk: what it is
Prashant analysed 115 completed real-world projects from the OR&S DSLIB database (Batselier & Vanhoucke) to answer: which projects and phases overrun their schedule and budget, and how much buffer is needed to deliver on time with confidence?

## Project delay risk: how it's built
- Earned-value KPIs, using the time-based SPI(t) because classic SPI always ends at 1.0 for a finished project.
- Segmentation by sector, size and phase.
- An early-warning test using only the first 25% of tracking periods, with permutation tests.
- A 10,000-run Monte Carlo simulation of one project's activity network (the critical path method with calibrated triangular durations), plus a tornado chart of delay drivers.
- PCA and k-means planning archetypes, and a management KPI pack with RAG status and reference-class contingency.

## Project delay risk: key results
Only 40% of projects finished on time and 37% on budget, with a median schedule overrun of +4.2% and a mean of +11.4%. Delay is visible early: projects whose SPI(t) was below 1 in the first quarter of reporting finished a median +9.0% late, against 0% for those on track (p = 0.005). In the Monte Carlo case study, an 80% confidence buffer is about 19 working days (+7.9%), and the real outcome fell at the simulation's 60th percentile. The ML archetypes mostly rediscover sector, so the simple early-warning rule is recommended over the clusters. Reference-class P80 contingency is about +21% for Construction and +39% for Engineering.

## Project delay risk: why it matters (for a recruiter)
The project shows rigorous analytics with robustness checks (re-testing effects within sector) and clear management recommendations. It is relevant to consulting, PMO analytics and risk roles.
