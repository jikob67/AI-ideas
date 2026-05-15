import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { SparklesIcon, CloseIcon, SpinnerIcon, EyeIcon, EyeOffIcon, GoogleIcon } from './Icons';
import { CRYPTO_WALLETS } from '../constants';
import { View } from '../types';

interface AuthProps {
  onBackToLanding?: () => void;
  onNavigate?: (view: View) => void;
}

const Auth: React.FC<AuthProps> = ({ onBackToLanding, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [selectedWalletType, setSelectedWalletType] = useState(CRYPTO_WALLETS[0].name);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    // Restore saved verification code if any
    const savedCode = localStorage.getItem('auth_verification_code');
    if (savedCode) {
      setGeneratedCode(savedCode);
    }
  }, []);

  const generateVerificationCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
    localStorage.setItem('auth_verification_code', code);
    return code;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userData = {
        name: user.displayName || '',
        username: user.email?.split('@')[0] || '',
        email: user.email || '',
        isNewUser: false, // Don't overwrite to false if it's new
      };
      try {
        await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول بواسطة Google');
    } finally {
      setIsLoading(false);
    }
  };

  const executeAuthLogic = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, {
          displayName: fullName
        });

        const userData = {
          name: fullName,
          username,
          email,
          walletAddress,
          selectedWalletType,
          isNewUser: true,
          points: 100,
          plan: 'free',
          timestamp: Date.now()
        };
        
        try {
          await setDoc(doc(db, 'users', user.uid), userData);
        } catch (err: any) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
        localStorage.removeItem('auth_verification_code');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
        console.error('Auth error:', err);
        if (err.code === 'auth/email-already-in-use') {
            setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.');
        } else if (err.code === 'auth/operation-not-allowed') {
            setError('عذراً، تسجيل الدخول بالبريد الإلكتروني غير مفعل حالياً. يرجى التواصل مع الدعم أو التحقق من إعدادات Firebase.');
        } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-email') {
            setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
        } else {
            setError('حدث خطأ أثناء الاتصال بالخادم. حاول مرة أخرى.');
        }
    } finally {
      setIsLoading(false);
    }
  };

  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleResetPassword = async () => {
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني أولاً لإرسال رابط إعادة التعيين.');
      return;
    }
    setIsResetting(true);
    setError('');
    setResetMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (err: any) {
      console.error('Reset error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير موجود أو غير صحيح.');
      } else {
        setError('فشل إرسال رابط إعادة التعيين. حاول مرة أخرى لاحقاً.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (step === 'details') {
        if (!email || !password || !username || !fullName || !walletAddress) {
          setError('جميع الحقول مطلوبة لإنشاء الحساب.');
          return;
        }
        if (password.length < 6) {
          setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
          return;
        }
        if (!generatedCode) {
          generateVerificationCode();
        }
        setStep('verify');
      } else {
        if (verificationCode !== generatedCode) {
          setError('رمز التحقق غير صحيح.');
          return;
        }
        executeAuthLogic();
      }
    } else {
      if (!email || !password) {
        setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
        return;
      }
      executeAuthLogic();
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setResetMessage('');
    setStep('details');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[600px]">
          <div className="w-full md:w-1/2 p-8 bg-gradient-to-br from-indigo-600/20 to-slate-800/10 hidden md:flex flex-col justify-center items-center text-center relative">
            <SparklesIcon className="w-16 h-16 text-indigo-400 mb-4" />
            <h2 className="text-3xl font-bold text-white">
              {mode === 'signup' ? 'مرحبًا بك في AI ideas' : 'أهلاً بعودتك!'}
            </h2>
            <p className="text-slate-300 mt-2 max-w-sm">
              {mode === 'signup' 
                ? 'المكان الذي تتحول فيه أفكارك إلى مشاريع برمجية حقيقية. ابدأ رحلتك الآن بإنشاء حسابك المجاني.'
                : 'استكمل بناء مشاريعك البرمجية والوصول إلى أحدث ميزات الذكاء الاصطناعي.'}
            </p>
          </div>
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center relative">
            {onBackToLanding && (
              <button onClick={onBackToLanding} title="العودة للصفحة الرئيسية" className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-700/80 hover:text-white transition-colors z-10">
                <CloseIcon className="w-5 h-5" />
              </button>
            )}
            <div className="w-full max-sm mx-auto">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white">
                  {mode === 'signup' ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                </h1>
                <p className="text-slate-400 mt-2">
                  {step === 'verify' ? 'التحقق الأمني' : (mode === 'signup' ? 'انضم إلينا وابدأ الإبداع' : 'ادخل لبيئة العمل الخاصة بك')}
                </p>
              </div>

              {step === 'verify' && mode === 'signup' ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-700/50 border border-indigo-500/50 rounded-xl p-6 text-center">
                    <p className="text-slate-300 mb-2 text-sm">رمزك الفريد للتحقق هو:</p>
                    <div className="text-4xl font-mono font-bold text-white tracking-widest select-all cursor-pointer" onClick={() => { navigator.clipboard.writeText(generatedCode); alert('تم نسخ الرمز'); }}>
                      {generatedCode}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">انسخ هذا الرمز وأدخله في الحقل أدناه للمتابعة وتفعيل الحساب.</p>
                  </div>
                  <form onSubmit={handleAuthAction} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">أدخل رمز التحقق</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-center text-xl tracking-widest uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        placeholder="XXXXXX"
                        maxLength={6}
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/20">
                      {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'إكمال التسجيل'}
                    </button>
                    <button type="button" onClick={() => setStep('details')} className="w-full text-slate-400 text-sm hover:text-white transition-colors">العودة لتعديل البيانات</button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <button 
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-white text-slate-900 font-bold py-2.5 px-4 rounded-lg border border-slate-300 flex items-center justify-center gap-3 transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <GoogleIcon className="w-5 h-5" />
                    تسجيل الدخول بواسطة Google
                  </button>

                  <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-slate-700"></div>
                    <span className="text-xs text-slate-500 font-medium">أو بالبريد الإلكتروني</span>
                    <div className="flex-1 h-px bg-slate-700"></div>
                  </div>

                  <form onSubmit={handleAuthAction} className="space-y-4">
                    {mode === 'signup' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">الاسم الكامل</label>
                          <input
                            type="text"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="الاسم الثلاثي"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">اسم المستخدم</label>
                          <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            placeholder="user_123"
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'signup' && (
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">المحفظة الرقمية</label>
                        <div className="flex gap-2">
                          <select
                            value={selectedWalletType}
                            onChange={e => setSelectedWalletType(e.target.value)}
                            className="bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          >
                            {CRYPTO_WALLETS.map(w => <option key={w.name} value={w.name}>{w.name}</option>)}
                          </select>
                          <input
                            type="text"
                            value={walletAddress}
                            onChange={e => setWalletAddress(e.target.value)}
                            placeholder="عنوان المحفظة..."
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">كلمة المرور</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                        >
                          {showPassword ? (
                            <EyeOffIcon className="h-5 w-5" />
                          ) : (
                            <EyeIcon className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {mode === 'login' && (
                        <div className="flex justify-start mt-1">
                          <button 
                            type="button" 
                            onClick={handleResetPassword} 
                            disabled={isResetting || isLoading}
                            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            {isResetting ? 'جاري الإرسال...' : 'نسيت كلمة المرور؟'}
                          </button>
                        </div>
                      )}
                    </div>

                    {resetMessage && <p className="text-green-400 text-sm text-center font-medium bg-green-400/10 py-2 rounded-lg">{resetMessage}</p>}
                    {error && <p className="text-red-400 text-sm text-center font-medium bg-red-400/10 py-2 rounded-lg">{error}</p>}

                    <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-95">
                      {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (mode === 'signup' ? 'إنشاء الحساب والمتابعة' : 'تسجيل الدخول')}
                    </button>

                    <div className="text-center mt-6">
                      <p className="text-slate-400 text-sm">
                        {mode === 'signup' ? 'تمتلك حساباً بالفعل؟' : 'ليس لديك حساب بعد؟'}
                        <button type="button" onClick={toggleMode} className="text-indigo-400 font-bold mr-2 hover:text-indigo-300 transition-colors">
                          {mode === 'signup' ? 'سجل دخولك من هنا' : 'سجل حساباً جديداً'}
                        </button>
                      </p>
                    </div>

                    {mode === 'signup' && (
                      <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed">
                        من خلال إنشاء حساب، أنت توافق على <br />
                        <button type="button" onClick={() => onNavigate?.('terms')} className="text-slate-400 underline cursor-pointer hover:text-white transition-colors">شروط الخدمة</button> و <button type="button" onClick={() => onNavigate?.('privacy')} className="text-slate-400 underline cursor-pointer hover:text-white transition-colors">سياسة الخصوصية</button>.
                      </p>
                    )}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
