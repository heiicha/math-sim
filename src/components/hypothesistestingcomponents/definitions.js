// Definitions quoted close to the notes' own wording (2MA_19N_HypothesisTesting.pdf, §2).
export const DEFINITIONS = {
  hypothesis:
    "A statistical hypothesis is an assumption about the value of a population parameter. (Definition 2.1)",
  testing:
    "Hypothesis testing is the process of testing the validity of a statistical hypothesis based on observations made from random samples taken from the population. (Definition 2.2)",
  h0: "The null hypothesis, H₀, is a statement about a parameter of the population which is initially, or conventionally, believed to be true — a value that occurred in the past, a value claimed by some person, or a target value that is supposed to occur. (Definition 2.3)",
  h1: "The alternative hypothesis, H₁, is a statement about the same parameter being different from what is initially, or conventionally, believed to be true — typically proposed because sample data or fresh insight suggests H₀ may not hold. (Definition 2.4)",
  significance:
    "The level of significance, α%, is the probability of rejecting H₀ given that H₀ is true: P(rejecting H₀ | H₀ is true) = α. It is how much error we allow ourselves in wrongly rejecting H₀ — typically set low (10%, 5%, 1%). (Definition 2.5)",
  testStatistic:
    "A test statistic is a standardised value derived from sample data during a hypothesis test, used to determine whether to reject H₀. (Definition 2.6)",
  criticalRegion:
    "The critical region (or rejection region) is the set of values of the test statistic for which H₀ will be rejected. Its boundaries are the critical values — if the calculated test statistic falls within this region, we reject H₀; otherwise we do not reject H₀. (Definition 2.7)",
  pValue:
    "The p-value (observed significance level) is the probability that the test statistic is at least as extreme as the observed/calculated value: P(Z<z) for a lower-tailed test, P(Z>z) for an upper-tailed test, or 2P(Z>|z|) for a two-tailed test. We reject H₀ if the p-value ≤ α. (Definition 2.8)",
};

export const H1_POSSIBILITIES = [
  { symbol: "<", meaning: "definite decrease, less than, over-estimate" },
  { symbol: ">", meaning: "definite increase, more than, under-estimate" },
  { symbol: "≠", meaning: "change, different, affected" },
];
