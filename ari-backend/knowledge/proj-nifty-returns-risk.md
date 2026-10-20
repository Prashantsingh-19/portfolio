# Nifty 50: Returns vs Risk Forecasting

## Nifty returns and risk project: what it is
Prashant studied the Nifty 50 from 2 January 2015 to 9 October 2026 (2,898 trading days of Yahoo Finance data) to answer one question: are returns predictable, or is risk predictable? The project also covers returns, drawdowns, trend and seasonality.

## Nifty returns and risk project: how it's built
- Return and risk KPIs: CAGR, annualised volatility, best and worst days and months, maximum drawdown and recovery time, and the share of days above the 200-day moving average.
- ARIMA(1,0,1) trained to December 2023 and tested from January 2024 with one-step-ahead forecasts, compared with a naive forecast by RMSE and a paired t-test.
- GARCH(1,1) with Student-t errors, tested out of sample from 2024 against a 30-day rolling volatility.

## Nifty returns and risk project: key results
Returns are not predictable: ARIMA only tied the naive average (p = 0.98). Risk is predictable: GARCH beat the 30-day rolling volatility out of sample by 3.6% RMSE, a statistically significant gain (p = 0.005). Over the period the Nifty 50 compounded at 8.75% a year with 16.2% annualised volatility. Its maximum drawdown was −38.4% during COVID (January to March 2020), with 300 calendar days from peak to recovery.

## Nifty returns and risk project: why it matters (for a recruiter)
The project shows honest forecasting practice: testing a model against a simple benchmark and reporting when it fails, while showing where modelling does add value (volatility). It is relevant to market risk and quantitative analytics roles.
