import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Lock, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { IncomeDetails } from '@/lib/types';
import { parseForm16Text, Form16ParseResult } from '@/lib/form16Parser';

interface Form16UploaderProps {
  onAutoFill: (income: Partial<IncomeDetails>, extractedFields: string[]) => void;
  onCancel: () => void;
}

type Stage = 'upload' | 'password' | 'processing' | 'done' | 'error';

const Form16Uploader = ({ onAutoFill, onCancel }: Form16UploaderProps) => {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Form16ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      setError('Please upload a valid Form 16 PDF file.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Maximum 20MB allowed.');
      return;
    }
    setFile(f);
    setError('');
    setStage('password');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const processForm16 = async () => {
    if (!file) return;
    setStage('processing');
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(15);

      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      setProgress(25);

      let pdf;
      try {
        const opts: any = { data: arrayBuffer };
        if (password) opts.password = password;
        pdf = await pdfjsLib.getDocument(opts).promise;
      } catch (err: any) {
        if (err?.name === 'PasswordException') {
          setError('Incorrect password. Please try again.');
          setStage('password');
          return;
        }
        throw err;
      }
      setProgress(40);

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str ?? '').join(' ');
        fullText += `${pageText}\n`;
        setProgress(40 + Math.round((i / pdf.numPages) * 25));
      }

      const normalizedText = fullText.replace(/\u0000/g, ' ').replace(/\s{2,}/g, ' ').trim();
      const letterCount = (normalizedText.match(/[A-Za-z]/g) || []).length;

      if (normalizedText.length < 80 || letterCount < 30) {
        setError('Could not read enough text from this Form 16. It may be scanned/image-based.');
        setStage('error');
        return;
      }

      setProgress(75);

      // Local-first parsing
      const localResult = parseForm16Text(normalizedText);
      if (localResult.success) {
        setResult(localResult);
        setProgress(100);
        setStage('done');
        return;
      }

      // Edge function fallback
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mzgmikrbmggmksxwlmbg.supabase.co';
        const response = await fetch(`${supabaseUrl}/functions/v1/parse-form16`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: normalizedText }),
        });
        const data = await response.json();
        setProgress(95);

        if (response.ok && !data.error) {
          const parsed = data.data || data;
          const income: Partial<IncomeDetails> = {};
          const fields: string[] = [];
          const raw: Record<string, number> = {};

          if (parsed.salary > 0) { income.salary = parsed.salary; fields.push('Salary'); raw['Salary'] = parsed.salary; }
          if (parsed.basic_salary > 0) { income.basicSalary = parsed.basic_salary; fields.push('Basic Salary'); raw['Basic Salary'] = parsed.basic_salary; }
          if (parsed.hra > 0) { income.hra = parsed.hra; fields.push('HRA'); raw['HRA'] = parsed.hra; }
          if (parsed.tds > 0) { income.tds = parsed.tds; fields.push('TDS'); raw['TDS'] = parsed.tds; }
          if (parsed.interest_income > 0) { income.interestIncome = parsed.interest_income; fields.push('Interest Income'); raw['Interest Income'] = parsed.interest_income; }

          if (fields.length > 0) {
            setResult({ success: true, income, extractedFields: fields, warnings: [], rawAmounts: raw });
            setProgress(100);
            setStage('done');
            return;
          }
        }
      } catch (edgeError) {
        console.warn('Form 16 edge parsing fallback failed:', edgeError);
      }

      setError(localResult.warnings[0] || 'No data found in Form 16. Please enter manually.');
      setStage('error');
    } catch (err: any) {
      console.error('Form 16 processing error:', err);
      setError('Failed to process Form 16. Please try again or fill details manually.');
      setStage('error');
    }
  };

  const handleApply = () => {
    if (result?.success) {
      onAutoFill(result.income, result.extractedFields);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <span>Your Form 16 is processed securely in your browser and not stored anywhere.</span>
      </div>

      {stage === 'upload' && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">Drag & Drop your Form 16 PDF here</p>
          <p className="text-sm text-muted-foreground">or click to browse • PDF only</p>
        </div>
      )}

      {stage === 'password' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
            <FileText className="w-8 h-8 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{file?.name}</p>
              <p className="text-xs text-muted-foreground">{((file?.size || 0) / 1024).toFixed(0)} KB</p>
            </div>
            <button onClick={() => { setStage('upload'); setFile(null); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
              <Lock className="w-3.5 h-3.5 inline mr-1" />
              Password (if protected)
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="input-premium w-full" placeholder="Leave blank if not password-protected" />
          </div>
          <button onClick={processForm16}
            className="w-full btn-gold flex items-center justify-center gap-2">
            Analyze Form 16 <FileText className="w-4 h-4" />
          </button>
        </div>
      )}

      {stage === 'processing' && (
        <div className="text-center py-8 space-y-4">
          <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          <p className="font-medium text-foreground">Reading your Form 16…</p>
          <div className="max-w-xs mx-auto">
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </div>
        </div>
      )}

      {stage === 'done' && result && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-foreground">Form 16 Processed Successfully!</p>
            <p className="text-sm text-muted-foreground">Extracted {result.extractedFields.length} field(s)</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
            {Object.entries(result.rawAmounts).map(([label, amount]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">{label}</span>
                </div>
                <span className="font-medium text-foreground tabular-nums">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          {result.warnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              {result.warnings.map((w, i) => <p key={i} className="text-xs text-yellow-600">{w}</p>)}
            </div>
          )}
          <button onClick={handleApply} className="w-full btn-gold flex items-center justify-center gap-2">
            Auto-Fill Income Fields <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="text-center py-6 space-y-4">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <button onClick={() => { setStage('upload'); setFile(null); setError(''); }}
              className="flex-1 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
              Try Again
            </button>
            <button onClick={onCancel}
              className="flex-1 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {error && stage !== 'error' && (
        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
};

export default Form16Uploader;
