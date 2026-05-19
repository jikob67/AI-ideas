
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
                 <p className="text-xs text-slate-500 pt-1">للتجربة، يمكنك كتابة "valid" أو "pending" أو "fail".</p>
            </div>
            <div className="border-t border-slate-700 mt-6 pt-4 flex justify-between items-center">
                <button onClick={() => setStep('payment')} className="text-sm text-slate-400 hover:text-white">العودة</button>
                <button onClick={handleVerify} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg">التحقق الآن</button>
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
                <button onClick={() => setStep('enterWallet')} className="text-sm text-slate-400 hover:text-white">العودة</button>
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
            <div className="space-y-2">
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
                <button onClick={handleWalletVerification} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg">المتابعة للدفع</button>
            </div>
          </div>
        );
      default: // options step
        return (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">الباقة الكاملة والشاملة</h2>
              <p className="text-slate-400 mt-2">امتلك أدوات المستقبل البرمجي في اشتراك واحد مدى الحياة.</p>
            </div>
            <div className="space-y-4">
                <div className="bg-slate-700/50 border-2 border-indigo-500 rounded-lg p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-3 py-1 font-bold rounded-bl-lg">
                        عرض حصري
                    </div>
                    <h3 className="text-xl font-bold text-indigo-400 mb-2">الباقة النهائية (Ultimate Bundle)</h3>
                    <div className="flex items-center justify-center gap-2 my-4">
                        <span className="text-slate-500 line-through text-lg">$499</span>
                        <p className="text-4xl font-black text-white">$149</p>
                    </div>
                    <p className="text-sm text-indigo-300 font-medium mb-6">ادفع مرة واحدة.. امتلك للأبد</p>
                    
                    <ul className="text-slate-300 text-sm space-y-3 my-4 text-right pr-2 list-none">
                        <li className="flex items-center gap-2 justify-end">
                            <span>تحويل الصور والرسومات إلى أكواد برمجية حقيقية</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                            <span>بناء مشاريع تطبيقية متكاملة (ويب وجوال) بالذكاء الاصطناعي</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                            <span>تصدير المشاريع كملفات Flutter جاهزة للعمل على Android و iOS</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                            <span>استخدام مفتوح لأدوات التسويق وتوليد الصور والفيديو والمحتوى</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                            <span>استضافة سحابية دائمية وروابط مباشرة لمشاريعك المنشورة</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                            <span>نظام تحليل بيانات متطور وتوثيق آلي لكافة أعمالك</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                        <li className="flex items-center gap-2 justify-end">
                            <span>إزالة شعار المنصة من كافة التطبيقات والمشاريع المصدرة</span>
                            <CheckIcon className="w-4 h-4 text-green-400" />
                        </li>
                    </ul>
                    
                    <button onClick={() => handleSelectPlan('premium')} className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" />
                        تفعيل الوصول الكامل الآن
                    </button>
                    <p className="text-[10px] text-slate-500 mt-4 italic">ضمان فعال بنسبة 100% لكافة الميزات المذكورة</p>
                </div>
            </div>
          </>
        );
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-fade-in-up"
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
