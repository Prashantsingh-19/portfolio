# FinSpark — Cross-Silo Fraud Detection Engine

## What it is
FinSpark is a fraud detection engine Prashant built for FinSpark'26, Bank of Maharashtra's Banking Cybersecurity Innovation Hackathon. The core idea is a correlation model that catches fraud patterns which only become visible when you look *across* silos — transactions, accounts, and channels that look clean in isolation but form a suspicious pattern together.

## The problem it solves
Most fraud detection systems flag anomalies within a single data silo (one account, one channel, one transaction type). Fraud rings exploit exactly this blind spot by spreading activity thin across silos. FinSpark's cross-silo correlation model is built to surface those cross-link patterns instead of treating each silo independently.

## How it's built
- Core model: XGBoost, with SHAP used for explainability — so flagged cases come with a human-readable reason, not just a black-box score.
- Currently trained and validated on simulated/synthetic transaction data, purpose-built for model testing; real dataset swap planned as the project matures.
- Code: https://github.com/Prashantsingh-19/finspark-fraud-engine

## Why it matters (for a recruiter)
FinSpark shows two things at once:
- **Technical/quant rigor** — building and validating a correlation-based fraud model with real ML tooling (XGBoost + SHAP), not just wiring up an API.
- **Product thinking** — framing fraud detection as a cross-silo *product* problem, not just a modeling exercise.

## Traction
The project got Prashant's team shortlisted in the **Top 20 out of 5,000+ teams** in FinSpark'26.