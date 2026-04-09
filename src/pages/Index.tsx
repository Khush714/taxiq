import { useState, useCallback } from 'react';
import { UserProfile, IncomeDetails, DeductionDetails, AdvancedProfile, RiskPreference, TaxComparison, Strategy } from '@/lib/types';
import { compareTaxRegimes } from '@/lib/taxEngine';
import { generateStrategies } from '@/lib/strategyEngine';
import LandingPage from '@/components/taxsmart/LandingPage';
import StepProgress from '@/components/taxsmart/StepProgress';
import ProfileStep from '@/components/taxsmart/ProfileStep';
import IncomeStep from '@/components/taxsmart/IncomeStep';
import DeductionsStep from '@/components/taxsmart/DeductionsStep';
import AdvancedStep from '@/components/taxsmart/AdvancedStep';
import RiskStep from '@/components/taxsmart/RiskStep';
import PaywallPage from '@/components/taxsmart/PaywallPage';
import Dashboard from '@/components/taxsmart/Dashboard';
import { Sparkles } from 'lucide-react';

const defaultProfile: UserProfile = {
  fullName: '',
  age: 0,
  residentialStatus: 'resident',
  maritalStatus: 'single',
  hasChildren: false,
  children: [],
};

const defaultIncome: IncomeDetails = {
  salary: 0, bonus: 0, capitalGainsSTCG: 0, capitalGainsLTCG: 0,
  rentalIncome: 0, interestIncome: 0, otherIncome: 0, businessIncome: 0,
};

const defaultDeductions: DeductionDetails = {
  section80C: 0, section80D: 0, section80DParents: 0, nps80CCD1B: 0,
  homeLoanInterest: 0, homeLoanPrincipal: 0, educationLoanInterest: 0,
  donations80G: 0, savingsInterest80TTA: 0,
};

const defaultAdvanced: AdvancedProfile = {
  isStockInvestor: false, hasELSS: false, hasProperty: false,
  numberOfProperties: 0, hasForeignIncome: false, hasHUF: false,
  hasBusinessIncome: false, spouseIncome: 0,
};

type AppView = 'landing' | 'form' | 'paywall' | 'dashboard';

const Index = () => {
  const [step, setStep] = useState(0);
  const [view, setView] = useState<AppView>('landing');
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [income, setIncome] = useState<IncomeDetails>(defaultIncome);
  const [deductions, setDeductions] = useState<DeductionDetails>(defaultDeductions);
  const [advanced, setAdvanced] = useState<AdvancedProfile>(defaultAdvanced);
  const [risk, setRisk] = useState<RiskPreference>('moderate');
  const [comparison, setComparison] = useState<TaxComparison | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);

  const handleAnalyze = useCallback(() => {
    const comp = compareTaxRegimes(income, deductions, profile);
    const strats = generateStrategies(profile, income, deductions, advanced, risk);
    setComparison(comp);
    setStrategies(strats);
    setView('paywall');
  }, [income, deductions, profile, advanced, risk]);

  const handleUnlock = useCallback(() => {
    setView('dashboard');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-foreground text-lg">TaxSmart <span className="gold-gradient-text">AI</span></span>
            <span className="text-[10px] text-muted-foreground ml-1 bg-secondary px-1.5 py-0.5 rounded">India</span>
          </div>
          {view === 'form' && (
            <span className="text-[10px] text-muted-foreground">FY 2024-25</span>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {view === 'landing' && (
          <LandingPage onStart={() => setView('form')} />
        )}

        {view === 'form' && (
          <>
            <StepProgress currentStep={step} />
            {step === 0 && (
              <ProfileStep profile={profile} onUpdate={setProfile} onNext={() => setStep(1)} />
            )}
            {step === 1 && (
              <IncomeStep income={income} onUpdate={setIncome} onNext={() => setStep(2)} onBack={() => setStep(0)} />
            )}
            {step === 2 && (
              <DeductionsStep
                deductions={deductions}
                onUpdate={setDeductions}
                onNext={() => setStep(3)}
                onBack={() => setStep(1)}
                isSenior={profile.age >= 60}
              />
            )}
            {step === 3 && (
              <AdvancedStep advanced={advanced} onUpdate={setAdvanced} onNext={() => setStep(4)} onBack={() => setStep(2)} />
            )}
            {step === 4 && (
              <RiskStep risk={risk} onUpdate={setRisk} onNext={handleAnalyze} onBack={() => setStep(3)} />
            )}
          </>
        )}

        {view === 'paywall' && comparison && (
          <PaywallPage
            comparison={comparison}
            totalStrategies={strategies.length}
            onUnlock={handleUnlock}
          />
        )}

        {view === 'dashboard' && comparison && (
          <Dashboard
            comparison={comparison}
            strategies={strategies}
            userName={profile.fullName}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
