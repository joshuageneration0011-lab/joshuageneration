import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export interface CaptchaChallengeRef {
  reset: () => void;
  isValid: () => boolean;
  getPayload: () => { captchaAnswer: string; captchaToken: string; hpValue: string };
}

interface CaptchaChallengeProps {
  onVerify?: (isValid: boolean) => void;
  theme?: 'dark' | 'light';
}

const CaptchaChallenge = forwardRef<CaptchaChallengeRef, CaptchaChallengeProps>(({ onVerify, theme = 'dark' }, ref) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [hpValue, setHpValue] = useState(''); // Honeypot field

  const generateChallenge = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setNum1(n1);
    setNum2(n2);
    setUserAnswer('');
    if (onVerify) onVerify(false);
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const expectedAnswer = num1 + num2;
  const token = btoa(`${num1}+${num2}=${expectedAnswer}`);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserAnswer(val);
    const valid = parseInt(val.trim(), 10) === expectedAnswer;
    if (onVerify) onVerify(valid);
  };

  useImperativeHandle(ref, () => ({
    reset: generateChallenge,
    isValid: () => parseInt(userAnswer.trim(), 10) === expectedAnswer && !hpValue,
    getPayload: () => ({
      captchaAnswer: userAnswer.trim(),
      captchaToken: token,
      hpValue: hpValue,
    }),
  }));

  const isLight = theme === 'light';

  return (
    <div className="space-y-2 select-none">
      {/* Invisible Honeypot Trap - hidden from real humans */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
        <label htmlFor="b_hp_website">Do not fill this out if human</label>
        <input
          id="b_hp_website"
          type="text"
          name="b_hp_website"
          tabIndex={-1}
          value={hpValue}
          onChange={(e) => setHpValue(e.target.value)}
          autoComplete="off"
        />
      </div>

      {/* Visual CAPTCHA Box */}
      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
        isLight 
          ? 'bg-slate-100/80 border-slate-200 text-slate-700' 
          : 'bg-white/5 border-white/10 text-slate-300'
      }`}>
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-blue-600' : 'text-gold-400'}`} />
          <span>Verification: <strong>{num1} + {num2} = ?</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            max="99"
            required
            placeholder="Result"
            value={userAnswer}
            onChange={handleChange}
            className={`w-16 px-2 py-1.5 rounded-lg border text-center font-bold text-sm focus:outline-none focus:ring-2 ${
              isLight 
                ? 'bg-white border-slate-300 text-slate-900 focus:ring-blue-500/20 focus:border-blue-500' 
                : 'bg-slate-900 border-white/20 text-white focus:ring-royal-blue-500/30 focus:border-royal-blue-500'
            }`}
          />
          <button
            type="button"
            onClick={generateChallenge}
            title="Get new code"
            className={`p-1.5 rounded-lg transition-all ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default CaptchaChallenge;
