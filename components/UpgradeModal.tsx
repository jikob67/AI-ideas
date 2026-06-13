
import React, { useState } from 'react';
import { CRYPTO_WALLETS } from '../constants';
import { Wallet, PlanId } from '../types';
import { useAuth } from '../hooks/useAuth';
import { CopyIcon, CheckIcon, CloseIcon, SparklesIcon, SpinnerIcon, ArrowRightIcon } from './Icons';
import { paymentService, SubscriptionRecord } from '../contexts/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'options' | 'enterWallet' | 'cryptoWallets' | 'payment' | 'enterTxHash' | 'verifying' | 'success' | 'failure';

// Validation function based on user's code and existing app logic
const isWalletAddressValid = (address: string): boolean => {
    if (!address) return false;
    const addr = address.trim();
    
    // Check for common prefixes and reasonable length
    if (addr.startsWith('0x')) { // Ethereum-based
        return (addr.length === 42 || addr.length === 66) && /^[0-9a-fA-F]+$/.test(addr.substring(2));
    }
    if (addr.startsWith('bc1') || addr.startsWith('1') || addr.startsWith('3')) { // Bitcoin
        return addr.length >= 26 && addr.length <= 62;
    }
    // Solana, Sui, etc.
    return addr.length >= 32 && addr.length <= 64 && /^[a-zA-Z0-9]+$/.test(addr);
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, upgradePlan } = useAuth();
  const [step, setStep] = useState<Step>('options');
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  const [userWalletAddress, setUserWalletAddress] = useState('');
  const [walletError, setWalletError] = useState('');

  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [txHash, setTxHash] = useState('');
  const [verificationError, setVerificationError] = useState('');


  if (!isOpen) return null;

  const handleSelectPlan = (plan: PlanId) => {
    setSelectedPlan(plan);
    setWalletError('');
    setStep('enterWallet');
  };

  const handleWalletVerification = () => {
      if (!isWalletAddressValid(userWalletAddress)) {
          setWalletError('❌ عنوان المحفظة غير صالح. يرجى التأكد من صحة العنوان.');
          return;
      }
      setWalletError('');
      setStep('cryptoWallets');
  };

  const handleSelectWallet = async (wallet: Wallet) => {
    setSelectedWallet(wallet);
    if (currentUser && selectedPlan) {
        const planPrice = 149;
        const record = await paymentService.recordPaymentAttempt(currentUser.email, selectedPlan, userWalletAddress, planPrice, wallet.name);
        setSubscription(record);
        setStep('payment');
    }
  };

  const handleProceedToVerification = () => {
    setVerificationError('');
    setStep('enterTxHash');
  };

  const handleVerify = async () => {
    if (!subscription || !txHash.trim()) {
        setVerificationError('الرجاء إدخال معرّف المعاملة (TxHash).');
        return;
    }
    setVerificationError('');
    setStep('verifying');
    try {
        const result = await paymentService.handlePaymentVerification(subscription.subscriptionId, txHash);
        if (result.status === 'confirmed') {
            await upgradePlan(result.planId);
            setStep('success');
        } else if (result.status === 'pending') {
            setVerificationError('✅ تم العثور على المعاملة ولكنها لا تزال قيد التأكيد. يرجى المحاولة مرة أخرى بعد بضع دقائق.');
            setStep('enterTxHash');
        } else { // 'failed' or 'error'
            setVerificationError('❌ فشل التحقق من المعاملة. قد تكون غير صالحة، أو لم يتم العثور عليها، أو فشلت. حاول مرة أخرى أو اتصل بالدعم.');
            setStep('failure');
        }
    } catch (e) {
        setVerificationError('حدث خطأ غير متوقع أثناء التحقق. يرجى المحاولة مرة أخرى.');
        setStep('failure');
    }
};
  
  const handleCopyAddress = () => {
    if(!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow for closing animation
    setTimeout(() => {
        setStep('options');
        setSelectedPlan(null);
        setSelectedWallet(null);
        setCopiedAddress(false);
        setUserWalletAddress('');
        setWalletError('');
        setSubscription(null);
        setTxHash('');
        setVerificationError('');
    }, 300);
  };
  
  const renderContent = () => {
    const planPrice = 149;
        
    switch (step) {
      case 'verifying':
        return (
          <div className="flex flex-col items-center justify-center text-center h-64">
            <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">جاري تأكيد الدفع على الشبكة...</h2>
            <p className="text-slate-400 mt-2">قد يستغرق هذا بضع لحظات. لا تغلق هذه النافذة.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">تمت الترقية إلى الخطة النهائية (مدى الحياة) بنجاح!</h2>
            <p className="text-slate-400 mt-2">مرحبًا بك! لديك الآن وصول غير محدود.</p>
            <button
              onClick={handleClose}
              className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded-lg"
            >
              رائع!
            </button>
          </div>
        );
       case 'failure':
        return (
          <div className="flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <CloseIcon className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">فشل التحقق</h2>
            <p className="text-slate-400 mt-2 max-w-sm">{verificationError}</p>
            <div className="flex gap-4 mt-6">
                <button
                  onClick={() => { setStep('enterTxHash'); setVerificationError(''); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  المحاولة مرة أخرى
                </button>
                <button
                  onClick={handleClose}
                  className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-6 rounded-lg"
                >
                  إغلاق
                </button>
            </div>
          </div>
        );
      case 'payment':
        if (!selectedWallet || !selectedPlan) return null;
        const MOCK_PRICES_ULTIMATE: {[key: string]: string} = { 'Solana': '1.05 SOL', 'Ethereum': '0.045 ETH', 'Monad': '0.045 ETH', 'Base': '0.045 ETH', 'Sui': '149 SUI', 'Polygon': '179 MATIC', 'Bitcoin': '0.00225 BTC' };
        const prices = MOCK_PRICES_ULTIMATE;

        return (
          <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">إتمام الدفع - <span className="text-amber-400">${planPrice}</span></h2>
                <p className="text-slate-400">لإتمام الترقية، أرسل <strong className="text-white">{prices[selectedWallet.name] || `$${planPrice} equivalent`}</strong> إلى العنوان التالي.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
                <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${selectedWallet.address}&bgcolor=1f2937&color=ffffff&qzone=1`} 
                    alt={`${selectedWallet.name} QR Code`}
                    className="rounded-lg border-4 border-slate-700"
                />
                 <div className="w-full text-center bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <p className="text-sm text-slate-400 font-mono break-all">{selectedWallet.address}</p>
                </div>
                 <button onClick={handleCopyAddress} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    {copiedAddress ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
                    {copiedAddress ? 'تم نسخ العنوان' : 'نسخ العنوان'}
                </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">بمجرد إتمام الدفع، احتفظ بمعرّف المعاملة (TxHash) ثم انقر على زر المتابعة.</p>
             <div className="border-t border-slate-700 mt-6 pt-4 flex justify-between items-center">
                <button onClick={() => setStep('cryptoWallets')} className="text-sm text-slate-400 hover:text-white">العودة</button>
                <button onClick={handleProceedToVerification} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">لقد قمت بالدفع، متابعة للتحقق</button>
            </div>
          </div>
        );
       case 'enterTxHash':
        return (
          <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">التحقق من المعاملة</h2>
                <p className="text-slate-400">الرجاء لصق معرّف المعاملة (Transaction Hash/ID) في الحقل أدناه لإكمال عملية الترقية.</p>
            </div>
            <div className="space-y-2">
                 <label htmlFor="txHashInput" className="block text-sm font-medium text-slate-300">معرّف المعاملة (TxID / TxHash)</label>
                 <input 
                    type="text" 
                    id="txHashInput" 
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="e.g., 0xabc..."
                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white font-mono text-sm text-left focus:outline-none focus:ring-2 transition-colors ${verificationError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'}`}
                 />
                 {verificationError && (
                    <p className={`text-sm text-center mt-1 ${verificationError.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                       {verificationError}
                    </p>
                 )}
             </div>
             <div className="border-t border-slate-700 mt-6 pt-4 flex justify-between items-center">
                 <button onClick={() => setStep('payment')} className="text-sm text-slate-400 hover:text-white">العودة</button>
                 <button onClick={handleVerify} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">التحقق من المعاملة</button>
             </div>
           </div>
         );
       case 'cryptoWallets':
        return (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">الدفع بالعملات الرقمية</h2>
              <p className="text-slate-400 mb-6">اختر محفظة لإتمام عملية الدفع.</p>
            </div>
            <div className="space-y-2">
              {CRYPTO_WALLETS.map((wallet) => {
                const LogoComponent = wallet.logo;
                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleSelectWallet(wallet)}
                    className="w-full flex items-center justify-between p-3 bg-slate-700/50 hover:bg-slate-700/80 rounded-lg transition-colors text-right"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6">
                        <LogoComponent />
                      </span>
                      <span className="font-semibold text-slate-300">{wallet.name}</span>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-slate-500" />
                  </button>
                );
              })}
            </div>
            <div className="border-t border-slate-700 mt-6 pt-4 flex justify-start items-center">
                <button onClick={() => setStep('options')} className="text-sm text-slate-400 hover:text-white">العودة</button>
            </div>
          </>
        );
      case 'enterWallet':
        return (
          <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">توثيق المحفظة</h2>
                <p className="text-slate-400">لأغراض التوثيق وربط اشتراكك، يرجى إدخال عنوان محفظتك الرقمية.</p>
            </div>
            <div className="space-y-4">
                 <label htmlFor="walletInput" className="block text-sm font-medium text-slate-300">أدخل عنوان محفظتك الرقمية</label>
                 <input 
                    type="text" 
                    id="walletInput" 
                    value={userWalletAddress}
                    onChange={(e) => setUserWalletAddress(e.target.value)}
                    placeholder="ألصق هنا عنوان محفظتك..."
                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white font-mono text-sm text-center focus:outline-none focus:ring-2 transition-colors ${walletError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-indigo-500'}`}
                 />
                 {walletError && <p className="text-red-400 text-sm text-center mt-1">{walletError}</p>}
            </div>
            <div className="border-t border-slate-700 mt-6 pt-4 flex justify-between items-center">
                <button onClick={() => setStep('options')} className="text-sm text-slate-400 hover:text-white">العودة للخطط</button>
                <button onClick={handleWalletVerification} className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold py-2 px-6 rounded-lg">المتابعة للدفع</button>
            </div>
          </div>
        );
      default: // options step
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                <SparklesIcon className="w-6 h-6 text-amber-400 animate-pulse" />
                الباقة الكاملة والميزات الشاملة مدى الحياة
              </h2>
              <p className="text-slate-400 mt-1.5 text-xs sm:text-sm">امتلك أدوات المستقبل البرمجي في اشتراك واحد دائم وموثوق.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-300">
              {/* Right/Main Panel: Active Plan & Scarcity urgency */}
              <div className="md:col-span-7 bg-slate-700/40 border border-slate-605 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between shadow-xl">
                <div>
                  <div className="absolute top-0 left-0 bg-indigo-500 text-white text-[9px] px-3 py-1 font-bold rounded-br-xl uppercase tracking-widest animate-pulse">
                    خصم محدود
                  </div>
                  
                  <h3 className="text-md font-black text-indigo-300 text-right pr-1 mb-1">الباقة النهائية (Ultimate Lifetime Bundle)</h3>
                  
                  {/* Pricing container */}
                  <div className="flex items-center justify-center gap-3 my-3 bg-slate-950/40 py-2.5 rounded-xl border border-slate-700/50">
                    <span className="text-slate-500 line-through text-xs font-bold">$499 USD</span>
                    <p className="text-3xl font-extrabold text-white font-mono">$149</p>
                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[9px] font-bold rounded border border-green-500/20">وفر 70%</span>
                  </div>

                  {/* Scarcity / Urgency warning requested by user */}
                  <div className="bg-red-500/10 border border-rose-500/20 rounded-xl p-3 text-right space-y-1.5 mb-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-red-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
                        فرصة لا تتكرر! انتهاء السعر المخفض قريباً
                      </span>
                      <span className="font-mono text-[9px]">منقذ للفرص</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                      السعر الحالي <span className="text-amber-400 font-bold">149 دولارًا</span> لأول 500 مستخدم فقط، وبعد اكتمال العدد سيتم اعتماد السعر الرسمي <span className="text-red-400 font-bold">499 دولارًا</span>.
                    </p>
                    {/* Visual scarcity progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                        <span>مضمون ومحدود</span>
                        <span>تم حجز 467 من 500 مقعد</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 h-1 rounded-full" style={{ width: '93.4%' }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-indigo-300 text-center font-bold mb-3">ادفع مرة واحدة.. امتلك للأبد وبدون رسوم مخفية</p>
                  
                  <ul className="text-slate-300 text-[11px] space-y-2 my-2 text-right pr-2 list-none">
                    <li className="flex items-center gap-2 justify-end">
                      <span>تحويل الصور والرسومات إلى أكواد برمجية حقيقية</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 justify-end">
                      <span>بناء مشاريع تطبيقية متكاملة بـ AI</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 justify-end">
                      <span>تصدير المشاريع كملفات Flutter جاهزة</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 justify-end">
                      <span>استخدام مفتوح لأدوات التسويق وتوليد المحتوى</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 justify-end">
                      <span>استضافة سحابية دائمية وروابط مباشرة لمشاريعك</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 justify-end">
                      <span>نظام تحليل بيانات متطور وتوثيق آلي لأعمالك</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                    <li className="flex items-center gap-2 justify-end">
                      <span>إزالة شعار المنصة من كافة التطبيقات المصدرة</span>
                      <CheckIcon className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    </li>
                  </ul>
                </div>
                
                <div className="pt-2">
                  <button onClick={() => handleSelectPlan('premium')} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-indigo-900/40 transition-all font-sans transform hover:scale-[1.01] flex items-center justify-center gap-2 text-xs">
                    <SparklesIcon className="w-4 h-4" />
                    امتلك خطتك مدى الحياة الآن
                  </button>
                  <p className="text-[9px] text-slate-500 mt-2 text-center italic">تفعيل فوري آلي • ضمان أمان المعاملات 100%</p>
                </div>
              </div>

              {/* Left Panel: Pricing expansion Strategy Roadmap (Requested by User) */}
              <div className="md:col-span-5 bg-slate-900/60 border border-slate-750 rounded-2xl p-5 flex flex-col justify-between text-right space-y-3">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-bold rounded-md">رؤية التوسع</span>
                    <h4 className="font-extrabold text-xs text-slate-200">استراتيجية التسعير المستقبلية</h4>
                  </div>
                  
                  <p className="text-[11px] text-slate-300 leading-normal mb-2.5">
                    لضمان استقرار الهيكل والنمو، عند الوصول إلى نحو <strong className="text-indigo-400">2000 عميل نشط</strong>، نسعى إلى اعتماد بنية اشتراك متوازنة ومرنة لتوسيع قاعدة مستشاري الأعمال بدلاً من الزيادة الحادة:
                  </p>

                  <div className="space-y-2">
                    {/* Fixed Core plan */}
                    <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-amber-400 font-bold font-mono text-xs">$299</span>
                        <span className="text-white font-bold text-[10px]">الإبقاء على الباقة الأساسية</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        الإبقاء عليها بسعر ملائم ثابت مدى الحياة بدون أي زيادة مفرطة.
                      </p>
                    </div>

                    {/* Monthly entry option */}
                    <div className="bg-slate-950/50 border border-slate-800 p-2.5 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-emerald-400 font-bold font-mono text-xs">$29/Mo</span>
                        <span className="text-white font-bold text-[10px]">إضافة اشتراك شهري مرن</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        إضافة باقة دفع شهري متوافقة لتجربة من قِبل رواد الأعمال الجدد.
                      </p>
                    </div>
                  </div>

                  {/* Profit strategy rationale */}
                  <div className="mt-3 bg-indigo-950/30 border border-indigo-900/40 p-2.5 rounded-xl text-[10px] text-indigo-200 leading-relaxed">
                    <h5 className="font-bold mb-1 border-b border-indigo-900/20 pb-0.5">💡 قيمة وهدف الهيكل الجديد:</h5>
                    يتيح هذا الخيار استقطاب المستخدمين الذين لا يرغبون أو لا يستطيعون دفع المبلغ الكامل دفعة واحدة، مما يزيد من معدل التحويل والاحتفاظ بالعملاء، ويخلق مصدر دخل متكرر ومستدام على المدى الطويل.
                  </div>
                </div>

                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/80 text-[9px] text-slate-400 leading-normal">
                  📌 <strong>ملاحظة للمهتمين:</strong> بصفتك مؤسسًا، يمكنك الاستفادة من هذه الخريطة لإسناد مبيعاتك وتوقيع عوائد مستقرة.
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  const modalWidthClass = step === 'options' ? 'max-w-md md:max-w-4xl' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className={`bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full ${modalWidthClass} p-6 relative animate-fade-in-up transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors z-10"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default UpgradeModal;
