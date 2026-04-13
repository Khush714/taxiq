import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Lock, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { IncomeDetails } from '@/lib/types';
import { parseAISText, AISParseResult } from '@/lib/aisParser';

interface AISUploaderProps {
  onAutoFill: (income: Partial<IncomeDetails>, extractedFields: string[]) => void;
  onCancel: () => void;
}

type Stage = 'upload' | 'password' | 'processing' | 'done' | 'error';

const AISUploader = ({ onAutoFill, onCancel }: AISUploaderProps) => {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AISParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      setError('Please upload a valid AIS PDF file.');
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

  const processAIS = async () => {
    if (!file || !password) return;
    setStage('processing');
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(25);

      // Dynamic import to avoid loading pdfjs-dist upfront
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      setProgress(40);

      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer, password }).promise;
      } catch (err: any) {
        if (err?.name === 'PasswordException') {
          setError('Incorrect password. Please try again.');
          setStage('password');
          return;
        }
        throw err;
      }
      setProgress(60);

      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
        setProgress(60 + Math.round((i / pdf.numPages) * 25));
      }

      setProgress(90);

      // Parse extracted text
      const parseResult = parseAISText(fullText);
      setResult(parseResult);
      setProgress(100);

      if (parseResult.success) {
        setStage('done');
      } else {
        setError(parseResult.warnings[0] || "We couldn't fully read your AIS. Please fill details manually.");
        setStage('error');
      }
    } catch (err: any) {
      console.error('AIS processing error:', err);
      setError('Failed to process AIS PDF. Please try again or fill details manually.');
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
      {/* Security notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
        <span>Your AIS data is processed securely in your browser and not stored anywhere.</span>
      </div>

      {/* Upload stage */}
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
          <input
            ref={inputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">Drag & Drop your AIS PDF here</p>
          <p className="text-sm text-muted-foreground">or click to browse • PDF only</p>
        </div>
      )}

      {/* Password stage */}
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
              Enter AIS PDF Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-premium w-full"
              placeholder="e.g. abcde12345678"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Password is usually <span className="font-medium">PAN (lowercase) + DOB (DDMMYYYY)</span>
            </p>
          </div>

          <button
            onClick={processAIS}
            disabled={!password}
            className="w-full btn-gold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process AIS <FileText className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Processing stage */}
      {stage === 'processing' && (
        <div className="text-center py-8 space-y-4">
          <Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />
          <p className="font-medium text-foreground">Analyzing your AIS…</p>
          <div className="max-w-xs mx-auto">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </div>
        </div>
      )}

      {/* Done stage */}
      {stage === 'done' && result && (
        <div className="space-y-4">
          <div className="text-center py-4">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-foreground">AIS Processed Successfully!</p>
            <p className="text-sm text-muted-foreground">Extracted {result.extractedFields.length} income category(ies)</p>
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
              {result.warnings.map((w, i) => (
                <p key={i} className="text-xs text-yellow-600">{w}</p>
              ))}
            </div>
          )}

          <button onClick={handleApply} className="w-full btn-gold flex items-center justify-center gap-2">
            Auto-Fill Income Fields <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error stage */}
      {stage === 'error' && (
        <div className="text-center py-6 space-y-4">
          <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <button onClick={() => { setStage('upload'); setFile(null); setError(''); }} className="flex-1 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
              Try Again
            </button>
            <button onClick={onCancel} className="flex-1 p-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors">
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* Error inline */}
      {error && stage !== 'error' && (
        <p className="text-sm text-destructive mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
};

export default AISUploader;
