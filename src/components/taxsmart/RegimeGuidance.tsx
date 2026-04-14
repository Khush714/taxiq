import { TaxComparison } from '@/lib/types';
import { formatCurrency } from '@/lib/taxEngine';
import { Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

interface RegimeGuidanceProps {
  comparison: TaxComparison;
}

const RegimeGuidance = ({ comparison }: RegimeGuidanceProps) => {
  const savings = comparison.savings;
  const oldTax = comparison.oldRegime.totalTax;
  const newTax = comparison.newRegime.totalTax;
  const optimizedTax = Math.min(oldTax, newTax);

  const barData = [
    { name: 'Old Regime', tax: oldTax },
    { name: 'New Regime', tax: newTax },
    { name: 'Optimized', tax: optimizedTax },
  ];

  const pieData = [
    { name: 'Tax Payable', value: optimizedTax },
    { name: 'Potential Savings', value: savings },
  ];

  // 3D-style gradient definitions
  const renderBarGradients = () => (
    <defs>
      <linearGradient id="barGrad0" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(0, 72%, 55%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(0, 72%, 35%)" stopOpacity={0.9} />
      </linearGradient>
      <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(220, 70%, 60%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(220, 70%, 38%)" stopOpacity={0.9} />
      </linearGradient>
      <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(142, 76%, 46%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(142, 76%, 28%)" stopOpacity={0.9} />
      </linearGradient>
      <filter id="barShadow">
        <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.25" />
      </filter>
    </defs>
  );

  const renderPieGradients = () => (
    <defs>
      <linearGradient id="pieGrad0" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
      </linearGradient>
      <linearGradient id="pieGrad1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(142, 76%, 46%)" stopOpacity={1} />
        <stop offset="100%" stopColor="hsl(142, 76%, 30%)" stopOpacity={0.8} />
      </linearGradient>
      <filter id="pieShadow">
        <feDropShadow dx="1" dy="2" stdDeviation="4" floodOpacity="0.3" />
      </filter>
    </defs>
  );

  const BAR_FILLS = ['url(#barGrad0)', 'url(#barGrad1)', 'url(#barGrad2)'];
  const PIE_FILLS = ['url(#pieGrad0)', 'url(#pieGrad1)'];

  return (
    <div className="space-y-4">
      {/* When to Choose Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card-premium p-4 border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-primary">When to Choose Old Regime</h4>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• You have significant deductions (₹2.5L+)</li>
            <li>• You invest heavily in 80C instruments</li>
            <li>• You have home loan interest payments</li>
            <li>• You claim HRA or LTA benefits</li>
          </ul>
        </div>
        <div className="card-premium p-4 border-success/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-success" />
            <h4 className="text-sm font-semibold text-success">When to Choose New Regime</h4>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>• You have minimal deductions</li>
            <li>• You prefer simpler tax filing</li>
            <li>• Your income is in lower slabs</li>
            <li>• You don't have major investments</li>
          </ul>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-[hsl(45,100%,96%)] border border-[hsl(45,80%,70%)] rounded-lg p-3">
        <p className="text-xs text-[hsl(30,60%,30%)]">
          <span className="font-semibold text-destructive">Important: </span>
          You can switch between old and new regime every year while filing your return.
          However, if you have business income, you can switch to new regime only once.
          Choose carefully based on your deductions and investments.
        </p>
      </div>

      {/* Charts - 3D styled */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card-premium p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Tax Comparison</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              {renderBarGradients()}
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Tax']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              />
              <Bar dataKey="tax" radius={[8, 8, 4, 4]} filter="url(#barShadow)" barSize={40}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={BAR_FILLS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            {barData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: ['hsl(0,72%,50%)', 'hsl(220,70%,55%)', 'hsl(142,76%,40%)'][i] }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Savings Breakdown</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              {renderPieGradients()}
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={2}
                stroke="hsl(var(--background))"
                filter="url(#pieShadow)"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_FILLS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ['hsl(var(--primary))', 'hsl(142,76%,40%)'][i] }} />
                <span className="text-[10px] text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegimeGuidance;
