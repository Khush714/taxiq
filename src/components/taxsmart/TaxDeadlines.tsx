import { CalendarClock, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Deadline {
  title: string;
  date: string;
  description: string;
  urgency: 'past' | 'urgent' | 'upcoming' | 'later';
}

const getDeadlines = (financialYear?: string): Deadline[] => {
  const fy = financialYear || 'FY 2024-25';
  const ayYear = fy.includes('2024-25') ? '2025-26' : '2026-27';

  const now = new Date();

  const deadlines: { title: string; date: string; dateObj: Date; description: string }[] = [
    { title: 'Advance Tax – 1st Instalment', date: '15 Jun', dateObj: new Date(2025, 5, 15), description: '15% of estimated tax liability for the year' },
    { title: 'Advance Tax – 2nd Instalment', date: '15 Sep', dateObj: new Date(2025, 8, 15), description: '45% cumulative tax (pay 30% balance)' },
    { title: 'Advance Tax – 3rd Instalment', date: '15 Dec', dateObj: new Date(2025, 11, 15), description: '75% cumulative tax (pay 30% balance)' },
    { title: 'Advance Tax – 4th Instalment', date: '15 Mar', dateObj: new Date(2026, 2, 15), description: '100% cumulative tax (pay remaining 25%)' },
    { title: `ITR Filing Deadline (${ayYear})`, date: '31 Jul', dateObj: new Date(2025, 6, 31), description: 'Last date for non-audit individual taxpayers' },
    { title: 'Belated/Revised Return', date: '31 Dec', dateObj: new Date(2025, 11, 31), description: 'Last date to file belated or revised return' },
    { title: 'Tax-Saving Investments (80C/80D)', date: '31 Mar', dateObj: new Date(2026, 2, 31), description: 'Last date to make investments for deductions' },
    { title: 'Form 16 from Employer', date: '15 Jun', dateObj: new Date(2025, 5, 15), description: 'Employer must issue Form 16 by this date' },
  ];

  return deadlines
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .map(d => {
      const diff = d.dateObj.getTime() - now.getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      let urgency: Deadline['urgency'] = 'later';
      if (daysDiff < 0) urgency = 'past';
      else if (daysDiff <= 30) urgency = 'urgent';
      else if (daysDiff <= 90) urgency = 'upcoming';

      return { title: d.title, date: d.date, description: d.description, urgency };
    });
};

const urgencyConfig = {
  past: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border/50', label: 'Passed' },
  urgent: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/5', border: 'border-destructive/30', label: 'Due Soon' },
  upcoming: { icon: Clock, color: 'text-warning', bg: 'bg-warning/5', border: 'border-warning/30', label: 'Upcoming' },
  later: { icon: CalendarClock, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20', label: 'Later' },
};

const TaxDeadlines = ({ financialYear }: { financialYear?: string }) => {
  const deadlines = getDeadlines(financialYear);
  const urgentCount = deadlines.filter(d => d.urgency === 'urgent').length;

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" /> Important Tax Deadlines
        </h3>
        {urgentCount > 0 && (
          <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full animate-pulse">
            {urgentCount} due soon!
          </span>
        )}
      </div>

      <div className="space-y-2">
        {deadlines.map((d, i) => {
          const config = urgencyConfig[d.urgency];
          const Icon = config.icon;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-lg p-3 border ${config.bg} ${config.border} ${d.urgency === 'past' ? 'opacity-50' : ''}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{d.title}</p>
                  <span className={`text-[10px] font-bold shrink-0 ${config.color}`}>{d.date}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{d.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 bg-info/5 border border-info/20 rounded-lg p-2.5">
        <p className="text-[10px] text-info leading-relaxed">
          <span className="font-semibold">💡 Pro tip:</span> Pay advance tax in all 4 instalments to avoid interest under Section 234B & 234C.
          Missing even one instalment can cost you 1% per month.
        </p>
      </div>
    </div>
  );
};

export default TaxDeadlines;
