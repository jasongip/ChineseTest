import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, X, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { audioService } from '../utils/audio';

interface PasswordAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

const VALID_PASSWORDS = ['10030627', '10010627'];

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = '入學評估系統驗證',
  description = '此專區包含口試、筆試、10分鐘複習、模擬試卷及評分報告。請輸入家長驗證密碼：',
}) => {
  const [inputPassword, setInputPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccessAnim, setIsSuccessAnim] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPwd = inputPassword.trim();
    if (VALID_PASSWORDS.includes(cleanPwd)) {
      setErrorMsg('');
      setIsSuccessAnim(true);
      audioService.playSuccess();
      setTimeout(() => {
        setIsSuccessAnim(false);
        setInputPassword('');
        onSuccess();
      }, 400);
    } else {
      audioService.playError();
      setErrorMsg('密碼不正確，請重新輸入。');
      setInputPassword('');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (inputPassword.length < 12) {
      setInputPassword((prev) => prev + val);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setInputPassword((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setInputPassword('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Top decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-rose-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 mb-3 shadow-inner">
            {isSuccessAnim ? (
              <Unlock className="w-7 h-7 text-emerald-600 animate-bounce" />
            ) : (
              <Lock className="w-7 h-7" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <div className="relative flex items-center">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                placeholder="輸入密碼 (8位數字)"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl font-mono text-center text-xl tracking-widest text-slate-800 outline-none transition shadow-inner"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-rose-500 text-xs font-bold mt-2 justify-center animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Quick Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '清除', '0', '⌫'].map((key) => {
              const isAction = key === '清除' || key === '⌫';
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    audioService.playClick();
                    if (key === '清除') handleClear();
                    else if (key === '⌫') handleBackspace();
                    else handleKeypadPress(key);
                  }}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 cursor-pointer ${
                    isAction
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-50 text-slate-800 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 shadow-xs'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-sm transition"
            >
              取消返回
            </button>
            <button
              type="submit"
              disabled={!inputPassword.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>驗證進入</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
