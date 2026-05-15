import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PlanId } from '../types';
import { SparklesIcon, CheckIcon, CloseIcon, SpinnerIcon } from './Icons';

interface RedeemPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'options' | 'confirming' | 'success' | 'failure';

const PLAN_DETAILS = {
  pro: { name: 'الباقة الاحترافية (Pro)', cost: 30000, features: ['زيادة الحدود اليومية 5 أضعاف', 'إزالة العلامات المائية'] },
  premium: { name: 'الباقة المميزة (Lifetime)', cost: 75000, features: ['وصول غير محدود لكل شيء', 'جميع الميزات المستقبلية'] }
};

const RedeemPointsModal: React.FC<RedeemPointsModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, redeemPointsForPlan } = useAuth();
  const [step, setStep] = useState<Step>('options');
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRedeem = async (planId: PlanId) => {
    const plan = PLAN_DETAILS[planId];
    if (!currentUser || (currentUser.points || 0) < plan.cost) {
      setError('ليس لديك نقاط كافية.');
      setStep('failure');
      return;
    }
    
    setSelectedPlan(planId);
    setStep('confirming');
    
    const success = await redeemPointsForPlan(planId, plan.cost);
    
    if (success) {
      setStep('success');
    } else {
      setError('حدث خطأ أثناء عملية الاستبدال. يرجى المحاولة مرة أخرى.');
      setStep('failure');
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('options');
      setSelectedPlan(null);
      setError('');
    }, 300);
  };

  const renderContent = () => {
    switch(step) {
      case 'confirming':
        return (
          <div className="flex flex-col items-center justify-center text-center h-64">
            <SpinnerIcon className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-white">جاري استبدال النقاط...</h2>
            <p className="text-slate-400 mt-2">لحظات ويتم تفعيل باقتك الجديدة.</p>
          </div>
        );
      case 'success':
        return (
          <div className="flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckIcon className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">تمت الترقية بنجاح!</h2>
            <p className="text-slate-400 mt-2">أصبحت الآن على خطة {PLAN_DETAILS[selectedPlan!]?.name}.</p>
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
            <h2 className="text-2xl font-bold text-white">فشل الاستبدال</h2>
            <p className="text-slate-400 mt-2 max-w-sm">{error}</p>
            <button onClick={() => setStep('options')} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg">
              المحاولة مرة أخرى
            </button>
          </div>
        );
      case 'options':
      default:
        const userPoints = currentUser?.points || 0;
        return (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">استبدال النقاط</h2>
              <p className="text-slate-400 mt-2">استخدم نقاطك التي كسبتها لترقية حسابك.</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-slate-700/50 border border-slate-600 px-4 py-2 rounded-full">
                <span className="text-slate-300">رصيدك الحالي:</span>
                <span className="flex items-center gap-1 font-bold text-amber-400 text-lg">
                  <SparklesIcon className="w-5 h-5"/>
                  {userPoints.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {(Object.keys(PLAN_DETAILS) as PlanId[]).map(planId => {
                const plan = PLAN_DETAILS[planId];
                const canAfford = userPoints >= plan.cost;
                return (
                  <div key={planId} className={`bg-slate-700/50 border-2 rounded-lg p-6 text-center ${planId === 'premium' ? 'border-purple-500' : 'border-slate-600'}`}>
                    <h3 className={`text-xl font-bold ${planId === 'premium' ? 'text-purple-400' : 'text-indigo-400'}`}>{plan.name}</h3>
                    <p className="text-3xl font-bold my-2 flex items-center justify-center gap-1">
                      <SparklesIcon className="w-6 h-6 text-amber-400"/>
                      {plan.cost.toLocaleString()}
                    </p>
                    <ul className="text-slate-300 text-sm space-y-2 my-4 text-right pr-4 list-disc list-inside">
                      {plan.features.map(f => <li key={f}>{f}</li>)}
                    </ul>
                    <button
                      onClick={() => handleRedeem(planId)}
                      disabled={!canAfford}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                      {canAfford ? 'استبدال الآن' : 'نقاط غير كافية'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
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

export default RedeemPointsModal;