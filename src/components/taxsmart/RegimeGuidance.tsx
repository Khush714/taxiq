import { TaxComparison } from '@/lib/types';
import { formatCurrency } from '@/lib/taxEngine';
import { Info, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
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

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)'];
  const BAR_COLORS = ['hsl(var(--destructive))', 'hsl(220, 70%, 55%)', 'hsl(142, 76%, 36%)'];

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

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="card-premium p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Tax Comparison</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Tax']}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="tax" radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card-premium p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Savings Breakdown</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RegimeGuidance;
