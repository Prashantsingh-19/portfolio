# Which Indian Sector Is Riskiest? A GARCH Volatility Comparison

## Sector GARCH project: what it is
Prashant compared the risk of six Nifty sector indices (Bank, IT, Pharma, FMCG, Auto, Metal) against the Nifty 50 using daily data from 2 January 2015 to 9 October 2026 (2,896 common trading days). The questions: which sector is riskiest, whose volatility shocks last longest, and which reacts more to bad news than to good. Yahoo Finance has no history for the FMCG, Auto and Metal indices, so he took those from the official NSE Indices site and cross-checked NSE's Bank closes against Yahoo's (within 0.12%).

## Sector GARCH project: how it's built
- Python with the arch library: ADF and ARCH-LM tests, GARCH(1,1) with Student-t errors and GJR-GARCH for the leverage effect.
- KPIs per sector: annualised volatility, persistence and half-life of shocks, leverage effect, peak COVID volatility and recovery time, 95% one-day VaR with a breach-rate test, and beta and correlation versus the Nifty 50.
- An overall risk rank that averages the ranks across KPIs.

## Sector GARCH project: key results
Bank is the riskiest sector overall: its volatility peaked at 106.6% annualised on 24 March 2020 and took 184 trading days to return to normal, and its shocks last longest (half-life 42.1 days). Metal is riskiest on an ordinary day, with the highest average volatility (27.2%), the largest 95% one-day VaR (2.61%) and the highest beta (1.21). FMCG and Pharma are the most defensive. GJR-GARCH fits better than plain GARCH for all seven series.

## Sector GARCH project: why it matters (for a recruiter)
This project shows market-risk skills: volatility modelling, VaR with backtesting, and turning model output into a clear ranking that a portfolio or risk manager can use. It is relevant to market risk and investment analytics roles.
