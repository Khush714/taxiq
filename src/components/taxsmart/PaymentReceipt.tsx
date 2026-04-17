import { CheckCircle2, ArrowRight, Receipt, Calendar, Hash, IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/taxEngine';

export interface PaymentReceiptData {
  orderId: string;
  paymentId: string;
  amount: number; // in paise
  currency: string;
  paidAt: Date;
  userName?: string;
  userEmail?: string;
}

interface PaymentReceiptProps {
  receipt: PaymentReceiptData;
  onContinue: () => void;
}

const PaymentReceipt = ({ receipt, onContinue }: PaymentReceiptProps) => {
  const dateStr = receipt.paidAt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      {/* Success hero */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-success/10 to-primary/10" />
        <div className="relative p-6 md:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-success" />
          </div>
          <p className="text-sm font-semibold text-success uppercase tracking-wider mb-2">
            Payment Successful
          </p>
          <p className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-1">
            {formatCurrency(receipt.amount / 100)}
          </p>
          <p className="text-sm text-muted-foreground">
            Thank you{receipt.userName ? `, ${receipt.userName}` : ''} — your tax plan is unlocked.
          </p>
        </div>
      </div>

      {/* Receipt card */}
      <div className="card-premium p-6 mb-6 border-primary/20">
        <div className="flex items-center gap-2 mb-5">
          <Receipt className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Payment Receipt</h3>
        </div>

        <div className="space-y-4">
          <ReceiptRow
            icon={<Hash className="w-3.5 h-3.5" />}
            label="Order ID"
            value={receipt.orderId}
            mono
          />
          <ReceiptRow
            icon={<Hash className="w-3.5 h-3.5" />}
            label="Payment ID"
            value={receipt.paymentId}
            mono
          />
          <ReceiptRow
            icon={<IndianRupee className="w-3.5 h-3.5" />}
            label="Amount Paid"
            value={`${formatCurrency(receipt.amount / 100)} ${receipt.currency}`}
          />
          <ReceiptRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Date & Time"
            value={dateStr}
          />
          {receipt.userEmail && (
            <ReceiptRow label="Email" value={receipt.userEmail} />
          )}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Product</span>
              <span className="text-xs font-medium text-foreground text-right">
                TaxSmart AI – Top 10 Strategies Unlock
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="btn-gold w-full text-base flex items-center justify-center gap-2"
      >
        Continue to Your Tax Plan <ArrowRight className="w-5 h-5" />
      </button>

      <p className="text-[10px] text-muted-foreground text-center mt-4">
        Save your Order ID and Payment ID for any future reference. Powered by Razorpay.
      </p>
    </div>
  );
};

const ReceiptRow = ({
  icon,
  label,
  value,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      {icon}
      <span>{label}</span>
    </div>
    <span
      className={`text-xs font-medium text-foreground text-right break-all ${mono ? 'font-mono' : ''}`}
    >
      {value}
    </span>
  </div>
);

export default PaymentReceipt;
