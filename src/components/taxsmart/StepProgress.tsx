import { Check } from 'lucide-react';

const steps = [
  'Profile',
  'Income',
  'Deductions',
  'Advanced',
  'Risk',
];

interface StepProgressProps {
  currentStep: number;
}

const StepProgress = ({ currentStep }: StepProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                index < currentStep
                  ? 'step-indicator-done'
                  : index === currentStep
                  ? 'step-indicator-active'
                  : 'step-indicator-pending'
              }`}
            >
              {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            <span className={`text-[10px] font-medium ${
              index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-px mb-4 ${index < currentStep ? 'bg-success' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

export default StepProgress;
