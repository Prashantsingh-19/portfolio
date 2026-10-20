# Portfolio Risk Dashboard (Excel)

## Portfolio risk dashboard: what it is
Prashant built an Excel portfolio-construction and risk dashboard that answers: can a diversified, optimised portfolio of Indian assets beat the Nifty 50 on a risk-adjusted basis? The universe is eight assets (Reliance, HDFC Bank, Infosys, ITC, Sun Pharma, L&T, Maruti and Gold BeES), using monthly adjusted prices from January 2019 with the Nifty 50 as the benchmark.

## Portfolio risk dashboard: how it's built
- Python (yfinance, scipy) computes minimum-variance and maximum-Sharpe weights, with a 30% cap per asset and a 6.5% risk-free rate assumption, plus a 20-point efficient frontier.
- A Python script (openpyxl) writes the workbook. Every KPI in Excel is a live formula: return, volatility, Sharpe ratio, beta, maximum drawdown and a backtest of ₹1,00,000.
- A colour convention separates inputs (blue) from formulas (black), and assumptions such as the risk-free rate can be edited in the workbook.

## Portfolio risk dashboard: why it matters (for a recruiter)
This project shows portfolio theory applied in the tool business users actually use: a transparent, formula-driven Excel model rather than a black box. It is relevant to investment analytics, wealth and consulting roles.
