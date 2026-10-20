# Credit Card Default Prediction & Risk Tiering

## Credit card default project: what it is
Prashant built an end-to-end credit-risk project on the UCI "Default of Credit Card Clients" dataset: 30,000 customers of a Taiwanese bank (April to September 2005), with a 22.12% default rate. The business question: predict which customers will default on next month's payment. Because a missed defaulter costs far more than a wrongly flagged good customer, models are judged mainly on recall (catching defaulters) at acceptable precision, not on AUC alone.

## Credit card default project: how it's built
- SQL (SQLite) cleaning and feature engineering: 38 features, including repayment-status categories, months delayed, longest delay streak, utilisation and payment-to-bill ratios.
- Twelve documented data-quality fixes, such as undocumented codes kept as separate categories, winsorised utilisation and a duplicate-aware split so identical profiles never leak across train and test.
- Three models compared: a WoE/IV logistic-regression scorecard (18 features), a random forest and XGBoost tuned by cross-validation.
- Platt calibration, a cost-based cut-off, 10 risk bands, SHAP explanations and PSI stability checks. The sensitive attribute SEX is excluded from modelling.

## Credit card default project: key results
XGBoost had the best ranking power on the test set (PR-AUC 0.552, Gini 0.572, KS 0.436). The random forest was selected by the pre-set lowest-validation-cost rule, and the two are effectively tied. The top two of 10 risk bands capture 50.2% of defaulters. At its cost-optimal cut-off the scorecard misses 782 of 1,995 test defaulters, against 470 for the random forest. Prashant recommends the transparent scorecard for new-applicant approval (it is explainable and calibrated) and XGBoost for collections prioritisation.

## Credit card default project: why it matters (for a recruiter)
This project shows Prashant can run a full credit-risk workflow, from data quality through modelling, calibration, cut-off strategy and monitoring, and can explain the trade-off between an explainable scorecard and a more accurate tree model. It is relevant to credit risk, risk analytics and data science roles.
