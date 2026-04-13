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
