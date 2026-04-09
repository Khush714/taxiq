import { useRef, useState, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  max?: number;
}

const formatIndian = (num: number): string => {
  if (!num) return '';
  return num.toLocaleString('en-IN');
};

const parseIndian = (str: string): number => {
  return parseFloat(str.replace(/,/g, '')) || 0;
};

const CurrencyInput = ({ value, onChange, placeholder = '₹', className = '', max }: CurrencyInputProps) => {
  const [display, setDisplay] = useState(value ? formatIndian(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setDisplay(value ? formatIndian(value) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw) {
      setDisplay('');
      onChange(0);
      return;
    }
    let num = parseInt(raw, 10);
    if (max) num = Math.min(num, max);
    setDisplay(formatIndian(num));
    onChange(num);
  };

  const handleBlur = () => {
    setDisplay(value ? formatIndian(value) : '');
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`input-premium ${className}`}
      placeholder={placeholder}
    />
  );
};

export default CurrencyInput;
