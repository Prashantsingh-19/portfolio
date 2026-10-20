# Customer Segmentation, Survival & Retention Analytics

## Customer retention project: what it is
Prashant analysed 7,043 subscription customers (the Telco churn dataset) to answer: which segments are most at risk of churn, how long do customers stay, and where should retention spend go?

## Customer retention project: how it's built
- SQL (SQLite) data preparation and exploratory analysis.
- K-means segmentation into 4 behavioural segments (silhouette 0.427).
- Hypothesis tests (chi-square, t-tests and Mann-Whitney) and logistic-regression odds ratios to find churn drivers.
- Kaplan-Meier survival curves with log-rank tests, and bootstrap confidence intervals (2,000 resamples).
- A 14-sheet Excel dashboard (KPI scorecard, risk quadrant and a what-if retention simulator) and a Tableau view.

## Customer retention project: key results
Total revenue at risk is $1.56M a year. One price-sensitive segment (2,410 customers, 47.0% churn) holds about $1.05M of it, roughly two-thirds, and loses 32.7% of its customers by month 12. Contract type is the strongest churn driver: two-year contracts have an odds ratio of 0.25. The recommendation: move that segment from month-to-month to annual contracts bundled with tech support. The findings are associations, not proven causes.

## Customer retention project: why it matters (for a recruiter)
The project goes from data to a sized, prioritised business recommendation with the right statistical checks, and delivers it in tools stakeholders use (Excel and Tableau). It is relevant to customer analytics, consulting and business analyst roles.
