# Currency Risk Quantification (GJR-GARCH)

## What it is
A quantitative finance project that models and quantifies currency risk on the USD/INR pair, built by Prashant using an adaptive GJR-GARCH(1,1) / GARCH(1,1) volatility model.

## How it's built
- Language/tools: R, with `rugarch`, `quantmod`, and `xts`.
- Data: 10 years of historical USD/INR data pulled from FRED.
- Model: an adaptive GJR-GARCH(1,1) / GARCH(1,1) setup — GJR-GARCH captures the asymmetric response of volatility to negative vs. positive shocks, which plain GARCH misses.
- Simulation: a 10,000-path Monte Carlo simulation run on top of the fitted volatility model.
- Risk metrics: Value at Risk (VaR) and Expected Shortfall (ES) computed on a $1M notional exposure.
- Output: a business-facing risk report, including a fan chart visualization of the simulated distribution of outcomes over time.

## Why it matters (for a recruiter)
This project demonstrates Prashant's ability to go from raw financial time-series data to a decision-ready risk report — statistical modeling (volatility clustering, asymmetric shocks), simulation, and translating the output into numbers a business stakeholder can act on (VaR/ES on a real notional amount), not just a model that lives in a notebook.

It's a good example of his range: this sits alongside more product/software-facing work like FinSpark and Ari, showing he can operate on the quant-finance side as well.