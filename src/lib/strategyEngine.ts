import { UserProfile, IncomeDetails, DeductionDetails, AdvancedProfile, RiskPreference, Strategy } from './types';

export function generateStrategies(
  profile: UserProfile,
  income: IncomeDetails,
  deductions: DeductionDetails,
  advanced: AdvancedProfile,
  risk: RiskPreference
): Strategy[] {
  const strategies: Strategy[] = [];
  const grossIncome = income.salary + income.bonus + income.capitalGainsSTCG + income.capitalGainsLTCG +
    income.rentalIncome + income.interestIncome + income.dividendIncome + income.otherIncome + income.businessIncome;
  const isHighIncome = grossIncome >= 5000000;
  const isResident = profile.residentialStatus === 'resident';
  const isMarried = profile.maritalStatus === 'married';
  const hasMinorChildren = profile.children.some(c => c.isMinor);
  const hasMajorChildren = profile.children.some(c => !c.isMinor);
  const isSenior = profile.age >= 60;

  // 80C strategies
  if (deductions.section80C < 150000) {
    const gap = 150000 - deductions.section80C;
    strategies.push({
      id: 'max-80c',
      name: 'Maximize Section 80C Deductions',
      whatToDo: `Invest an additional ₹${gap.toLocaleString('en-IN')} in ELSS, PPF, EPF VPF, NSC, or tax-saving FDs to exhaust the ₹1.5L limit.`,
      whyApplicable: `You're utilizing only ₹${deductions.section80C.toLocaleString('en-IN')} of the ₹1.5L limit. With your income of ₹${(grossIncome / 100000).toFixed(1)}L, the 30% tax bracket savings alone would be ₹${Math.round(gap * 0.3).toLocaleString('en-IN')}.`,
      estimatedSavings: Math.round(gap * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      category: 'Deductions',
      priority: 95,
    });
  }

  // NPS 80CCD(1B)
  if (deductions.nps80CCD1B < 50000) {
    const gap = 50000 - deductions.nps80CCD1B;
    strategies.push({
      id: 'nps-extra',
      name: 'Additional NPS Contribution (80CCD(1B))',
      whatToDo: `Invest ₹${gap.toLocaleString('en-IN')} in NPS to claim additional deduction over and above 80C.`,
      whyApplicable: `At your income level, this gives an extra ₹${Math.round(gap * 0.3).toLocaleString('en-IN')} in tax savings. NPS also builds a retirement corpus with market-linked returns.`,
      estimatedSavings: Math.round(gap * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      category: 'Retirement',
      priority: 90,
    });
  }

  // 80D Health Insurance
  const maxSelf = isSenior ? 50000 : 25000;
  if (deductions.section80D < maxSelf) {
    const gap = maxSelf - deductions.section80D;
    strategies.push({
      id: 'health-insurance',
      name: 'Health Insurance Premium (80D)',
      whatToDo: `Get comprehensive health insurance to claim up to ₹${maxSelf.toLocaleString('en-IN')} deduction${isSenior ? ' (senior citizen limit)' : ''}.`,
      whyApplicable: `You're only claiming ₹${deductions.section80D.toLocaleString('en-IN')} against a limit of ₹${maxSelf.toLocaleString('en-IN')}. Health cover is essential at your income level and saves ₹${Math.round(gap * 0.3).toLocaleString('en-IN')} in taxes.`,
      estimatedSavings: Math.round(gap * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      category: 'Insurance',
      priority: 85,
    });
  }

  // Parents health insurance
  if (deductions.section80DParents < 50000) {
    strategies.push({
      id: 'parent-health',
      name: 'Parents Health Insurance (80D)',
      whatToDo: 'Pay health insurance premiums for your parents to claim additional ₹50,000 deduction (if senior citizens).',
      whyApplicable: `Combined with your own health insurance, total 80D deduction can reach ₹${(maxSelf + 50000).toLocaleString('en-IN')}. This is one of the easiest ways to save tax while protecting family.`,
      estimatedSavings: Math.round(50000 * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      category: 'Insurance',
      priority: 82,
    });
  }

  // Home loan
  if (deductions.homeLoanInterest < 200000 && !advanced.hasProperty) {
    strategies.push({
      id: 'home-loan',
      name: 'Home Loan Interest Deduction (Sec 24)',
      whatToDo: 'Consider purchasing a self-occupied property. Home loan interest up to ₹2L is deductible under Section 24(b).',
      whyApplicable: `With your income of ₹${(grossIncome / 100000).toFixed(1)}L, a home loan provides dual benefits: asset creation + tax savings of up to ₹60,000 (at 30% bracket). Principal repayment also counts under 80C.`,
      estimatedSavings: 60000,
      difficulty: 'Hard',
      riskLevel: 'Moderate',
      category: 'Property',
      priority: 70,
    });
  }

  // Income splitting with spouse
  if (isMarried && isResident) {
    strategies.push({
      id: 'spouse-income',
      name: 'Income Structuring with Spouse',
      whatToDo: 'Gift money to your spouse for investment. The income earned by spouse from their own effort or inherited assets is not clubbed. Structure investments in spouse\'s name where clubbing provisions don\'t apply.',
      whyApplicable: `As a married individual with ₹${(grossIncome / 100000).toFixed(1)}L income, shifting investment income to your spouse (where legal) can save tax if spouse is in a lower bracket. Note: Income from gifts to spouse is clubbed, but income on income (second generation) is not.`,
      estimatedSavings: isHighIncome ? 50000 : 20000,
      difficulty: 'Medium',
      riskLevel: 'Moderate',
      complianceNote: 'Clubbing provisions under Section 64 apply. Only income earned by spouse independently or second-generation income qualifies.',
      category: 'Income Structuring',
      priority: isHighIncome ? 75 : 50,
    });
  }

  // HUF
  if (isMarried && isResident && isHighIncome) {
    strategies.push({
      id: 'huf',
      name: 'Hindu Undivided Family (HUF)',
      whatToDo: 'Create an HUF to split income. HUF gets its own PAN, separate 80C limit of ₹1.5L, and basic exemption of ₹2.5L.',
      whyApplicable: `With your income exceeding ₹50L, an HUF can save significant tax by creating a separate taxable entity. You get additional deductions and lower slab benefits on HUF income.`,
      estimatedSavings: isHighIncome ? 100000 : 40000,
      difficulty: 'Hard',
      riskLevel: 'Moderate',
      complianceNote: 'HUF must have genuine ancestral or joint family property. Partitioned HUF income rules apply. Consult a CA for setup.',
      category: 'Income Structuring',
      priority: isHighIncome ? 80 : 40,
    });
  }

  // Minor children clubbing warning + education
  if (hasMinorChildren) {
    strategies.push({
      id: 'minor-clubbing',
      name: 'Minor Children Income Planning',
      whatToDo: 'Invest in children\'s names via Sukanya Samriddhi (for girl child) or education-focused instruments. Claim ₹1,500 per minor child exemption under Section 10(32).',
      whyApplicable: `You have minor children. Income from investments in a minor child\'s name is clubbed with the higher-earning parent under Section 64(1A). However, ₹1,500 per child per year is exempt. Sukanya Samriddhi Yojana returns are fully tax-free.`,
      estimatedSavings: profile.children.filter(c => c.isMinor).length * 1500,
      difficulty: 'Easy',
      riskLevel: 'Safe',
      complianceNote: 'Clubbing provisions u/s 64(1A) apply. Only ₹1,500 per minor child is exempt. SSY is fully exempt.',
      category: 'Family Planning',
      priority: 65,
    });
  }

  // Major children
  if (hasMajorChildren) {
    strategies.push({
      id: 'adult-children',
      name: 'Gift & Invest via Adult Children',
      whatToDo: 'Gift money to adult (18+) children for investment. Income earned by them is taxed in their hands, not yours.',
      whyApplicable: `Your adult children can invest gifted amounts and the income is taxed in their hands (no clubbing for major children). If they have low or no income, effective tax rate could be 0%.`,
      estimatedSavings: 30000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Family Planning',
      priority: 60,
    });
  }

  // LTCG harvesting
  if (advanced.isStockInvestor) {
    strategies.push({
      id: 'ltcg-harvest',
      name: 'LTCG Tax Harvesting',
      whatToDo: 'Sell equity holdings with gains up to ₹1L before March 31 and rebuy. LTCG up to ₹1L is exempt. This resets your cost basis.',
      whyApplicable: `As a stock investor, you can book up to ₹1L in LTCG tax-free every year. This saves ₹10,000 annually (10% of ₹1L). Over time, this prevents accumulation of large gains.`,
      estimatedSavings: 10000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Capital Gains',
      priority: 78,
    });

    strategies.push({
      id: 'tax-loss-harvest',
      name: 'Tax Loss Harvesting',
      whatToDo: 'Sell underperforming stocks to book losses that offset capital gains. Reinvest after 30 days to avoid anti-avoidance concerns.',
      whyApplicable: `You can set off short-term capital losses against both STCG and LTCG. LTCG losses can be set off against LTCG only. With your investment portfolio, this can save ₹15,000-50,000 depending on loss positions.`,
      estimatedSavings: 25000,
      difficulty: 'Medium',
      riskLevel: 'Moderate',
      category: 'Capital Gains',
      priority: 72,
    });
  }

  // ELSS over PPF
  if (advanced.hasELSS === false && deductions.section80C < 150000) {
    strategies.push({
      id: 'elss-switch',
      name: 'Switch to ELSS for 80C',
      whatToDo: 'Invest in ELSS mutual funds instead of traditional 80C instruments. Shortest lock-in (3 years) among 80C options with potential for higher returns.',
      whyApplicable: `ELSS has only 3-year lock-in vs 5 years for FDs and 15 years for PPF. Historical ELSS returns of 12-15% CAGR outperform most 80C instruments. Suitable for your risk profile.`,
      estimatedSavings: Math.round((150000 - deductions.section80C) * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Moderate',
      category: 'Investments',
      priority: 68,
    });
  }

  // Rent restructuring
  if (income.salary > 1000000 && income.rentalIncome === 0) {
    strategies.push({
      id: 'hra-optimize',
      name: 'HRA Optimization',
      whatToDo: 'If living in rented accommodation, ensure you claim full HRA exemption. If living in own house, consider renting it out and staying in a rented place for dual benefit.',
      whyApplicable: `With your salary of ₹${(income.salary / 100000).toFixed(1)}L, HRA exemption can save significant tax. Even paying rent to parents (if they own the house) qualifies, provided they declare rental income.`,
      estimatedSavings: Math.round(income.salary * 0.05),
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Salary Restructuring',
      priority: 73,
    });
  }

  // Salary restructuring
  if (income.salary > 1500000) {
    strategies.push({
      id: 'salary-restructure',
      name: 'Salary Component Restructuring',
      whatToDo: 'Request your employer to restructure salary with higher exempt allowances: food coupons (₹50/meal), leave travel (LTA), car lease, telephone reimbursement.',
      whyApplicable: `With a salary of ₹${(income.salary / 100000).toFixed(1)}L, proper structuring can save ₹30,000-80,000 in taxes through exempt allowances. This is the most efficient legal tax saving method.`,
      estimatedSavings: 50000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Salary Restructuring',
      priority: 77,
    });
  }

  // Education loan
  if (deductions.educationLoanInterest === 0) {
    strategies.push({
      id: 'edu-loan',
      name: 'Education Loan Interest (80E)',
      whatToDo: 'If you or your children are pursuing higher education, the entire interest on education loan is deductible under 80E with no upper limit.',
      whyApplicable: 'Unlike 80C which is capped at ₹1.5L, Section 80E has no upper limit on interest deduction. Available for 8 years from the year repayment starts.',
      estimatedSavings: 20000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Deductions',
      priority: 45,
    });
  }

  // NRI specific
  if (profile.residentialStatus === 'nri') {
    strategies.push({
      id: 'nri-nro',
      name: 'NRO/NRE Account Optimization',
      whatToDo: 'Keep funds in NRE account where interest is fully tax-free. Transfer from NRO to NRE within permissible limits to minimize tax.',
      whyApplicable: `As an NRI, your NRE fixed deposit interest is fully tax-exempt in India. NRO interest is taxable. Optimize allocation between accounts.`,
      estimatedSavings: Math.round(income.interestIncome * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      complianceNote: 'FEMA regulations apply. Repatriation limits on NRO accounts. Consult with a CA for DTAA benefits.',
      category: 'NRI Planning',
      priority: 88,
    });

    strategies.push({
      id: 'dtaa',
      name: 'DTAA Treaty Benefits',
      whatToDo: 'Claim Double Tax Avoidance Agreement benefits to avoid being taxed twice on the same income in India and your country of residence.',
      whyApplicable: `As an NRI, you may be paying tax in both countries. DTAA allows credit or exemption. File Form 10F and obtain Tax Residency Certificate from resident country.`,
      estimatedSavings: Math.round(grossIncome * 0.05),
      difficulty: 'Hard',
      riskLevel: 'Safe',
      complianceNote: 'Requires TRC from country of residence. File Form 10F with Indian IT department.',
      category: 'NRI Planning',
      priority: 85,
    });
  }

  // RNOR specific
  if (profile.residentialStatus === 'rnor') {
    strategies.push({
      id: 'rnor-foreign',
      name: 'RNOR Foreign Income Exemption',
      whatToDo: 'As RNOR, your foreign income (earned outside India, not from Indian business) is NOT taxable in India. Ensure proper classification.',
      whyApplicable: `RNOR status means foreign income not derived from an Indian business/profession is exempt. This is a significant advantage if you have foreign investments or salary.`,
      estimatedSavings: advanced.hasForeignIncome ? Math.round(grossIncome * 0.1) : 0,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Maintain proper documentation of RNOR status. Keep records of foreign income sources.',
      category: 'Residential Status',
      priority: advanced.hasForeignIncome ? 92 : 30,
    });
  }

  // Rental income optimization
  if (advanced.hasProperty && advanced.numberOfProperties >= 2) {
    strategies.push({
      id: 'rental-optimize',
      name: 'Multiple Property Tax Optimization',
      whatToDo: 'Claim standard deduction of 30% on rental income. Deduct property tax paid. If second property has a home loan, interest is fully deductible (no ₹2L cap for let-out property).',
      whyApplicable: `With ${advanced.numberOfProperties} properties, proper structuring of self-occupied vs let-out designation can optimize tax. Second property deemed let-out at fair rental value.`,
      estimatedSavings: 40000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Property',
      priority: 65,
    });
  }

  // Charitable donations
  if (deductions.donations80G < 50000 && isHighIncome) {
    strategies.push({
      id: 'donations-80g',
      name: 'Strategic Charitable Donations (80G)',
      whatToDo: 'Donate to eligible institutions for 50% or 100% deduction under Section 80G. Certain funds like PM CARES, PM Relief Fund qualify for 100% deduction.',
      whyApplicable: `At your income level, strategic donations provide both tax benefits and social impact. A ₹1L donation to a 100% deductible fund saves ₹30,000+ in taxes.`,
      estimatedSavings: 30000,
      difficulty: 'Easy',
      riskLevel: 'Safe',
      category: 'Deductions',
      priority: 55,
    });
  }

  // Employer NPS
  if (income.salary > 1000000) {
    strategies.push({
      id: 'employer-nps',
      name: 'Employer NPS Contribution (80CCD(2))',
      whatToDo: 'Request your employer to contribute up to 10% of basic salary to NPS. This is over and above the 80C and 80CCD(1B) limits.',
      whyApplicable: `Employer NPS contribution up to 10% of basic+DA is deductible under 80CCD(2) with NO upper cap. At ₹${(income.salary / 100000).toFixed(1)}L salary, this could mean ₹${Math.round(income.salary * 0.04).toLocaleString('en-IN')} additional deduction.`,
      estimatedSavings: Math.round(Math.min(income.salary * 0.04, income.salary * 0.1) * 0.3),
      difficulty: 'Medium',
      riskLevel: 'Safe',
      category: 'Retirement',
      priority: 83,
    });
  }

  // Senior citizen benefits
  if (isSenior) {
    strategies.push({
      id: 'senior-benefits',
      name: 'Senior Citizen Tax Benefits',
      whatToDo: 'Claim higher 80D limits (₹50K vs ₹25K), higher 80TTB limit (₹50K on interest), and higher basic exemption (₹3L/₹5L).',
      whyApplicable: `As a senior citizen (age ${profile.age}), you qualify for enhanced limits across multiple sections. Ensure you're claiming all enhanced benefits.`,
      estimatedSavings: 15000,
      difficulty: 'Easy',
      riskLevel: 'Safe',
      category: 'Senior Benefits',
      priority: 88,
    });
  }

  // VPF
  strategies.push({
    id: 'vpf',
    name: 'Voluntary Provident Fund (VPF)',
    whatToDo: 'Increase EPF contribution through VPF. Interest is tax-free (up to ₹2.5L contribution per year). Counts under 80C.',
    whyApplicable: 'VPF offers government-backed 8.15% returns with 80C benefits. Unlike PPF, no separate account needed – it goes through your employer.',
    estimatedSavings: 15000,
    difficulty: 'Easy',
    riskLevel: 'Safe',
    category: 'Retirement',
    priority: 58,
  });

  // Business income
  if (advanced.hasBusinessIncome || income.businessIncome > 0) {
    strategies.push({
      id: 'presumptive-tax',
      name: 'Presumptive Taxation (Sec 44AD/44ADA)',
      whatToDo: 'If turnover is below ₹2Cr (business) or ₹50L (profession), opt for presumptive taxation at 6-8% of turnover as deemed profit.',
      whyApplicable: 'Presumptive taxation simplifies compliance and can result in lower tax if actual profit margin exceeds the presumptive rate. No need to maintain detailed books.',
      estimatedSavings: 50000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Cannot claim further deductions from presumptive income except salary/interest to partners.',
      category: 'Business',
      priority: 70,
    });
  }

  // Foreign income
  if (advanced.hasForeignIncome && isResident) {
    strategies.push({
      id: 'foreign-tax-credit',
      name: 'Foreign Tax Credit (FTC)',
      whatToDo: 'Claim credit for taxes paid in foreign countries under Section 91 or DTAA. File Form 67 before filing ITR.',
      whyApplicable: 'As a resident with foreign income, you\'re taxable on global income. FTC prevents double taxation. File Form 67 mandatorily.',
      estimatedSavings: Math.round(grossIncome * 0.03),
      difficulty: 'Hard',
      riskLevel: 'Safe',
      complianceNote: 'Form 67 must be filed before ITR. Obtain tax paid certificates from foreign country.',
      category: 'International',
      priority: 75,
    });
  }

  // ========== ADVANCED STRATEGIES (Non-obvious, high-impact, legal) ==========

  // Leave Encashment structuring
  if (income.salary > 1200000) {
    strategies.push({
      id: 'leave-encashment',
      name: 'Leave Encashment Exemption Planning',
      whatToDo: 'Accumulate earned leave and encash at retirement/resignation. Leave encashment at retirement is exempt up to ₹25L (u/s 10(10AA)). Plan your leave accumulation to maximize this tax-free payout.',
      whyApplicable: `With salary of ₹${(income.salary / 100000).toFixed(1)}L, accumulated leave encashment at exit can be a significant tax-free component. Negotiate with employer to allow higher leave accumulation.`,
      estimatedSavings: Math.round(income.salary * 0.03),
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Exemption of ₹25L applies only on retirement/resignation, not during service. During service, fully taxable.',
      category: 'Salary Structuring',
      priority: 71,
    });
  }

  // Sovereign Gold Bond (SGB) LTCG exemption
  if (advanced.isStockInvestor || grossIncome > 1000000) {
    strategies.push({
      id: 'sgb-ltcg-exempt',
      name: 'Sovereign Gold Bond — Zero LTCG Tax',
      whatToDo: 'Invest in RBI Sovereign Gold Bonds (SGBs). If held to maturity (8 years), LTCG is completely tax-exempt. You also earn 2.5% annual interest. Use this as a gold allocation strategy.',
      whyApplicable: `Unlike physical gold or gold ETFs (taxed at slab rate for <3yrs, 20% with indexation for >3yrs), SGB redemption at maturity attracts ZERO capital gains tax. Plus 2.5% annual interest.`,
      estimatedSavings: Math.round(grossIncome * 0.01),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      complianceNote: 'LTCG exemption only on maturity (8 years). Early redemption after 5 years is taxable. Interest is taxable at slab rate.',
      category: 'Investments',
      priority: 74,
    });
  }

  // Section 54EC — Capital Gains Bonds
  if (income.capitalGainsLTCG > 100000) {
    strategies.push({
      id: 'sec-54ec-bonds',
      name: 'Section 54EC Capital Gains Bonds',
      whatToDo: `Invest up to ₹50L of LTCG from property/land sale into NHAI/REC/PFC bonds within 6 months. Entire LTCG becomes exempt. Lock-in is 5 years.`,
      whyApplicable: `You have ₹${(income.capitalGainsLTCG / 100000).toFixed(1)}L in LTCG. Investing in 54EC bonds exempts this gain entirely. The 5-year lock-in is worth the 12.5% tax saved.`,
      estimatedSavings: Math.round(Math.min(income.capitalGainsLTCG, 5000000) * 0.125),
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Must invest within 6 months of transfer. Maximum ₹50L per FY. Cannot be pledged or transferred.',
      category: 'Capital Gains',
      priority: 86,
    });
  }

  // Section 54F — Reinvest equity LTCG into house
  if (income.capitalGainsLTCG > 200000 && !advanced.hasProperty) {
    strategies.push({
      id: 'sec-54f-house',
      name: 'Section 54F — Reinvest Gains into Property',
      whatToDo: 'Reinvest the net sale consideration (not just gains) from any non-residential asset into a residential house within 2 years (purchase) or 3 years (construction). Entire LTCG becomes exempt proportionally.',
      whyApplicable: `With ₹${(income.capitalGainsLTCG / 100000).toFixed(1)}L LTCG from non-house assets, Section 54F exempts gains proportional to reinvestment. Unlike 54, this applies to ALL asset types except residential property.`,
      estimatedSavings: Math.round(income.capitalGainsLTCG * 0.125),
      difficulty: 'Hard',
      riskLevel: 'Moderate',
      complianceNote: 'You must not own more than one residential house (other than the new one) on the date of transfer. New house cannot be sold within 3 years.',
      category: 'Capital Gains',
      priority: 79,
    });
  }

  // Perquisite optimization — Car lease
  if (income.salary > 2000000) {
    strategies.push({
      id: 'car-lease-perq',
      name: 'Company Car Lease Perquisite Optimization',
      whatToDo: 'Opt for a company-leased car instead of car allowance. The perquisite value for a leased car (₹1,800-2,400/month for cars >1600cc) is far lower than the actual EMI, saving substantial tax.',
      whyApplicable: `At ₹${(income.salary / 100000).toFixed(1)}L salary, a car allowance of ₹30K/month is fully taxable (₹3.6L/year at 30% = ₹1.08L tax). A company car lease perquisite is valued at only ₹2,400/month = ₹28,800/year taxable.`,
      estimatedSavings: 80000,
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Car must be owned/leased by the company. Rules differ for cars above and below 1600cc. Driver salary perquisite is ₹900/month.',
      category: 'Salary Restructuring',
      priority: 76,
    });
  }

  // Intercorporate deposit / family trust
  if (isHighIncome && isMarried) {
    strategies.push({
      id: 'family-trust',
      name: 'Private Discretionary Family Trust',
      whatToDo: 'Set up a private discretionary trust for asset protection and income distribution. Income distributed to beneficiaries (adult children, relatives) is taxed in their hands at their slab rates.',
      whyApplicable: `With income above ₹50L, a family trust allows legitimate distribution of investment income to lower-bracket beneficiaries. Also provides succession planning and asset protection.`,
      estimatedSavings: Math.round(grossIncome * 0.04),
      difficulty: 'Hard',
      riskLevel: 'Advanced',
      complianceNote: 'Trust must be genuine with proper deed. Clubbing provisions apply for spouse/minor children. Specific trust income taxed at maximum marginal rate unless distributed. Consult a CA.',
      category: 'Estate Planning',
      priority: 69,
    });
  }

  // Debt fund rebalancing — post-April 2023 rules
  if (advanced.isStockInvestor && grossIncome > 1500000) {
    strategies.push({
      id: 'debt-fund-rebalance',
      name: 'Debt-to-Equity Rebalancing for Tax Efficiency',
      whatToDo: 'Post-2023, debt fund gains are taxed at slab rate regardless of holding period. Shift debt allocation to direct bonds/NCDs (listed, held >12 months for 10% LTCG) or tax-free bonds (NHAI, IRFC, PFC).',
      whyApplicable: `Debt mutual fund gains are now taxed at slab rate (up to 30%). Listed NCDs/bonds held >12 months attract only 10% LTCG. Tax-free bonds pay 5.5-6% completely tax-free, equivalent to 8-9% pre-tax for you.`,
      estimatedSavings: Math.round(grossIncome * 0.015),
      difficulty: 'Medium',
      riskLevel: 'Moderate',
      complianceNote: 'Listed bond LTCG rate is 10% without indexation for >12 months. Unlisted bonds follow slab rate. Tax-free bond interest is fully exempt.',
      category: 'Investments',
      priority: 67,
    });
  }

  // Section 80GG — Rent without HRA
  if (income.hra === 0 && income.rentPaid > 0) {
    strategies.push({
      id: 'sec-80gg',
      name: 'Section 80GG — Rent Deduction without HRA',
      whatToDo: `Claim deduction under 80GG if you don't receive HRA. Deduction is the least of: ₹5,000/month, 25% of total income, or rent paid minus 10% of total income. File Form 10BA declaration.`,
      whyApplicable: `You pay rent but don't receive HRA. Section 80GG allows up to ₹60,000/year deduction. Most taxpayers miss this entirely. File Form 10BA (self-declaration) with your ITR.`,
      estimatedSavings: Math.round(Math.min(60000, income.rentPaid * 0.25) * 0.3),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      complianceNote: 'Neither you, your spouse, nor minor child should own a residential property at the place of employment. File Form 10BA.',
      category: 'Deductions',
      priority: 72,
    });
  }

  // Interest income — Tax-free bonds reallocation
  if (income.interestIncome > 100000) {
    strategies.push({
      id: 'tax-free-bonds',
      name: 'Shift FDs to Tax-Free Bonds & SCSS',
      whatToDo: 'Reallocate fixed deposit holdings to tax-free bonds (NHAI, REC, IRFC) available in secondary market. Interest is 100% tax-free. Senior citizens can use SCSS (₹30L limit, 80TTB deduction).',
      whyApplicable: `You earn ₹${(income.interestIncome / 100000).toFixed(1)}L in interest income, taxed at up to 30%. Tax-free bonds yielding 5.5% = effective 8% pre-tax. This alone saves ₹${Math.round(income.interestIncome * 0.15).toLocaleString('en-IN')}.`,
      estimatedSavings: Math.round(income.interestIncome * 0.15),
      difficulty: 'Easy',
      riskLevel: 'Safe',
      complianceNote: 'Tax-free bonds available in secondary market. Check YTM before buying. SCSS limit is ₹30L per individual.',
      category: 'Investments',
      priority: 73,
    });
  }

  // Gratuity exemption planning
  if (income.salary > 1500000) {
    strategies.push({
      id: 'gratuity-planning',
      name: 'Gratuity Exemption Planning (Sec 10(10))',
      whatToDo: 'Gratuity received on retirement/resignation after 5+ years is exempt up to ₹20L. Negotiate higher basic salary to increase gratuity calculation (15 days basic per year of service).',
      whyApplicable: `At your salary level, gratuity at exit can be ₹10-20L+ if basic salary is structured correctly. This is entirely tax-free up to ₹20L. Higher basic = higher gratuity = more tax-free money at exit.`,
      estimatedSavings: Math.round(income.salary * 0.02),
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Requires 5+ years of continuous service. Exempt up to ₹20L. Formula: 15 days basic × years of service ÷ 26.',
      category: 'Salary Structuring',
      priority: 64,
    });
  }

  // Rental property — Joint ownership
  if (advanced.hasProperty && isMarried && income.rentalIncome > 0) {
    strategies.push({
      id: 'joint-property-split',
      name: 'Joint Property Ownership — Split Rental Income',
      whatToDo: 'If property is jointly owned with spouse, rental income is split in proportion to ownership. Ensure co-ownership is reflected in the sale deed to split rental income and get double deductions.',
      whyApplicable: `Your rental income of ₹${(income.rentalIncome / 100000).toFixed(1)}L can be split between you and your spouse. Each gets 30% standard deduction, separate Sec 24 interest limit, and lower slab rates.`,
      estimatedSavings: Math.round(income.rentalIncome * 0.15),
      difficulty: 'Medium',
      riskLevel: 'Safe',
      complianceNote: 'Ownership must be genuine and documented in sale deed. Income split must match ownership ratio. Both must file ITR.',
      category: 'Property',
      priority: 66,
    });
  }

  // Sort by priority and estimated savings
  strategies.sort((a, b) => {
    const scoreA = a.priority * 0.6 + (a.estimatedSavings / 1000) * 0.4;
    const scoreB = b.priority * 0.6 + (b.estimatedSavings / 1000) * 0.4;
    return scoreB - scoreA;
  });

  // Filter by risk preference
  if (risk === 'conservative') {
    return strategies.filter(s => s.riskLevel === 'Safe');
  }
  if (risk === 'moderate') {
    return strategies.filter(s => s.riskLevel !== 'Advanced');
  }
  return strategies;
}
