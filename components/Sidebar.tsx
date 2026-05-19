
import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  SparklesIcon,
  CommandLineIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  FireIcon,
  SupportIcon,
  RocketLaunchIcon,
  TrashIcon,
  DollarSignIcon,
  TemplateIcon,
  ChartPieIcon,
  BriefcaseIcon,
  BeakerIcon,
  BellIcon,
  CameraIcon,
  LightBulbIcon,
  MicrophoneIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  PencilSquareIcon,
  CloseIcon,
  CheckIcon,
  StarIcon,
  ListBulletIcon,
  Share2Icon,
  ArrowDownTrayIcon,
  GlobeIcon,
  MagnifyingGlassIcon,
  TrophyIcon,
  SquaresPlusIcon,
  ShieldCheckIcon,
  AcademicCapIcon
} from './Icons';
import { View } from '../types';
import { useAuth } from '../hooks/useAuth';
import UpgradeModal from './UpgradeModal';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View, context?: any) => void;
  isOpen: boolean;
  openOnboarding: () => void;
}

interface FeedbackItem {
    id: string;
    text: string;
    rating: number;
    date: string;
    shared: boolean;
    pointsEarned: number;
}

const NavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = "bg-slate-700 text-white shadow-inner";
  const inactiveClasses = "text-slate-400 hover:bg-slate-800 hover:text-white";
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className="truncate font-medium">{label}</span>
    </button>
  );
};

const FeedbackModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState<number>(0);
    const [submitted, setSubmitted] = useState(false);
    const [activeTab, setActiveTab] = useState<'write' | 'history'>('write');
    const [history, setHistory] = useState<FeedbackItem[]>([]);
    const { currentUser, updateUser } = useAuth();

    const POINTS_PER_SHARE = 50;
    const MAX_REWARDED_SHARES = 5;

    useEffect(() => {
        if (currentUser?.email) {
            const savedHistory = JSON.parse(localStorage.getItem(`feedbackHistory_${currentUser.email}`) || '[]');
            setHistory(savedHistory);
        }
    }, [currentUser, isOpen]);

    const saveToHistory = (item: FeedbackItem) => {
        if (!currentUser?.email) return;
        const updatedHistory = [item, ...history];
        setHistory(updatedHistory);
        localStorage.setItem(`feedbackHistory_${currentUser.email}`, JSON.stringify(updatedHistory));
    };

    const handleSubmit = async (e: React.FormEvent, shouldShare: boolean = false) => {
        e.preventDefault();
        if (rating === 0) {
            alert('الرجاء اختيار تقييم.');
            return;
        }

        let pointsEarned = 0;
        const rewardedCount = history.filter(i => i.shared && i.pointsEarned > 0).length;

        if (shouldShare) {
            if (!navigator.share) {
                alert('المشاركة غير مدعومة في هذا المتصفح. سيتم حفظ رأيك فقط.');
                shouldShare = false;
            } else {
                try {
                    const shareUrl = 'https://ai.studio/apps/drive/185Fbm07Ss2VEtCX0im7ab0fo0bjDfylW';

                    const shareData: any = {
                        title: 'تجربتي مع AI ideas',
                        text: `أستخدم منصة AI ideas لبناء مشاريعي البرمجية. تجربتي: ${feedback}\n\n#AI_ideas #NoCode #Innovation`,
                        url: shareUrl
                    };
                    
                    await navigator.share(shareData);
                    
                    if (rewardedCount < MAX_REWARDED_SHARES) {
                        pointsEarned = POINTS_PER_SHARE;
                        if (currentUser) {
                            updateUser({ points: (currentUser.points || 0) + pointsEarned });
                        }
                    }
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error('Share failed:', err);
                        alert('فشلت المشاركة. تم حفظ الرأي فقط.');
                    }
                    shouldShare = false; 
                }
            }
        }

        const newItem: FeedbackItem = {
            id: Date.now().toString(),
            text: feedback,
            rating,
            date: new Date().toISOString(),
            shared: shouldShare,
            pointsEarned
        };

        saveToHistory(newItem);
        setSubmitted(true);
        
        setTimeout(() => {
            setSubmitted(false);
            setFeedback('');
            setRating(0);
            if (!shouldShare) onClose(); 
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md relative flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-white z-10"><CloseIcon className="w-5 h-5"/></button>
                
                <div className="flex border-b border-slate-700 p-2 bg-slate-800 rounded-t-xl">
                    <button 
                        onClick={() => setActiveTab('write')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${activeTab === 'write' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <PencilSquareIcon className="w-4 h-4"/> تقييم جديد
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ListBulletIcon className="w-4 h-4"/> سجل آرائي
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {activeTab === 'write' ? (
                        submitted ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckIcon className="w-8 h-8 text-green-400"/>
                                </div>
                                <h3 className="text-xl font-bold text-white">شكراً لمشاركتك!</h3>
                                <p className="text-slate-400 mt-2">نحن نقدر رأيك لتطوير المنصة.</p>
                            </div>
                        ) : (
                            <form className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">كيف كانت تجربتك؟</h3>
                                    <p className="text-slate-400 text-sm">شاركنا رأيك واكسب نقاط مكافأة عند النشر!</p>
                                </div>
                                
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button 
                                            key={star} 
                                            type="button"
                                            onClick={() => setRating(star)}
                                            className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${star <= rating ? 'text-yellow-400' : 'text-slate-600'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="اكتب انطباعك هنا..."
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-32"
                                    required
                                />

                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={(e) => handleSubmit(e, true)}
                                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                                    >
                                        <Share2Icon className="w-5 h-5"/>
                                        مشاركة للعامة (+{POINTS_PER_SHARE} نقطة)
                                    </button>
                                    <button 
                                        onClick={(e) => handleSubmit(e, false)}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                                    >
                                        إرسال خاص (بدون مكافأة)
                                    </button>
                                </div>
                            </form>
                        )
                    ) : (
                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">
                                    <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 opacity-50"/>
                                    <p>لم يتم تسجيل أي آراء سابقة.</p>
                                </div>
                            ) : (
                                history.map(item => (
                                    <div key={item.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex text-yellow-400 text-sm">
                                                {Array.from({length: item.rating}).map((_, i) => <span key={i}>★</span>)}
                                            </div>
                                            <span className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                        <p className="text-slate-300 text-sm mb-3">{item.text}</p>
                                        {item.pointsEarned > 0 && (
                                            <div className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                                <SparklesIcon className="w-3 h-3"/>
                                                تم ربح {item.pointsEarned} نقطة
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NavHeader: React.FC<{ label: string }> = ({ label }) => (
  <div className="px-3 pt-4 pb-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
    {label}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, openOnboarding }) => {
  const { currentUser } = useAuth();
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  return (
    <>
      <aside className={`bg-gray-900 border-l border-slate-800 flex flex-col gap-8 sticky top-0 h-screen transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-64 p-4' : 'w-0 p-0'}`}>
        <div className="flex items-center justify-center px-2 flex-shrink-0 h-[56px]">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI ideas</span>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar pr-1">
          
          <NavHeader label="تطوير واجهات وأكواد" />
          <NavButton
            label="خطوات إلى كود"
            icon={<RocketLaunchIcon className="w-6 h-6 text-indigo-400" />}
            isActive={activeView === 'projectWizard'}
            onClick={() => setActiveView('projectWizard')}
          />
          <NavButton
            label="رابط إلى كود"
            icon={<GlobeIcon className="w-6 h-6 text-sky-400" />}
            isActive={activeView === 'linkWizard'}
            onClick={() => setActiveView('linkWizard')}
          />
          <NavButton
            label="فكرة إلى كود"
            icon={<LightBulbIcon className="w-6 h-6 text-yellow-400" />}
            isActive={activeView === 'ideaToCode'}
            onClick={() => setActiveView('ideaToCode')}
          />
          <NavButton
            label="استوديو الأصول"
            icon={<SquaresPlusIcon className="w-6 h-6 text-pink-400" />}
            isActive={activeView === 'assetStudio'}
            onClick={() => setActiveView('assetStudio')}
          />
          <NavButton
            label="محلل SEO الذكي"
            icon={<MagnifyingGlassIcon className="w-6 h-6 text-emerald-400" />}
            isActive={activeView === 'seoOptimizer'}
            onClick={() => setActiveView('seoOptimizer')}
          />
          <NavButton
            label="نص إلى كود"
            icon={<CommandLineIcon className="w-6 h-6 text-slate-400" />}
            isActive={activeView === 'textToCode'}
            onClick={() => setActiveView('textToCode')}
          />
          <NavButton
            label="شاشة إلى كود"
            icon={<CameraIcon className="w-6 h-6 text-cyan-400" />}
            isActive={activeView === 'screenToCode'}
            onClick={() => setActiveView('screenToCode')}
          />
          <NavButton
            label="من المخطط للكود"
            icon={<PencilSquareIcon className="w-6 h-6 text-blue-400" />}
            isActive={activeView === 'drawToCode'}
            onClick={() => setActiveView('drawToCode')}
          />
          <NavButton
            label="محلل الواجهات"
            icon={<BeakerIcon className="w-6 h-6 text-purple-400" />}
            isActive={activeView === 'uiRecognizer'}
            onClick={() => setActiveView('uiRecognizer')}
          />

          <NavButton
            label="تجربة التدفق"
            icon={<RocketLaunchIcon className="w-6 h-6 text-orange-500" />}
            isActive={activeView === 'flowDemo'}
            onClick={() => setActiveView('flowDemo')}
          />
          <NavHeader label="ذكاء اصطناعي ومحتوى" />
          <NavButton
            label="مساعد AI الشامل"
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-400" />}
            isActive={activeView === 'aiAssistant'}
            onClick={() => setActiveView('aiAssistant')}
          />
          <NavButton
            label="محول الفنون"
            icon={<PaintBrushIcon className="w-6 h-6 text-pink-400" />}
            isActive={activeView === 'artConverter'}
            onClick={() => setActiveView('artConverter')}
          />
          <NavButton
            label="المحتوى التسويقي"
            icon={<FireIcon className="w-6 h-6 text-orange-400" />}
            isActive={activeView === 'marketing'}
            onClick={() => setActiveView('marketing')}
          />
          <NavButton
            label="كاشف المحتوى الذكي"
            icon={<ShieldCheckIcon className="w-6 h-6 text-blue-400" />}
            isActive={activeView === 'aiContentDetector'}
            onClick={() => setActiveView('aiContentDetector')}
          />
          <NavButton
            label="محادثة مباشرة"
            icon={<MicrophoneIcon className="w-6 h-6 text-red-400" />}
            isActive={activeView === 'live'}
            onClick={() => setActiveView('live')}
          />

          <NavHeader label="الإطلاق والتحويل" />
          <NavButton
            label="معرض المجتمع"
            icon={<TrophyIcon className="w-6 h-6 text-yellow-500" />}
            isActive={activeView === 'showroom'}
            onClick={() => setActiveView('showroom')}
          />
          <NavButton
            label="المعاينة والتحقق"
            icon={<ShieldCheckIcon className="w-6 h-6 text-emerald-500" />}
            isActive={activeView === 'preview'}
            onClick={() => setActiveView('preview')}
          />
          <NavButton
            label="نقل الطلب وتطوير الفكرة"
            icon={<SparklesIcon className="w-6 h-6 text-indigo-400" />}
            isActive={activeView === 'promptRefiner'}
            onClick={() => setActiveView('promptRefiner')}
          />

          <NavHeader label="إدارة وتحليل" />
          <NavButton
            label="الأكاديمية التعليمية"
            icon={<AcademicCapIcon className="w-6 h-6 text-indigo-400" />}
            isActive={activeView === 'guide'}
            onClick={() => setActiveView('guide')}
          />
          <NavButton
            label="تحليل البيانات"
            icon={<ChartPieIcon className="w-6 h-6 text-teal-400" />}
            isActive={activeView === 'dataAnalysis'}
            onClick={() => setActiveView('dataAnalysis')}
          />
          <NavButton
            label="مصدر ربح"
            icon={<DollarSignIcon className="w-6 h-6 text-green-400" />}
            isActive={activeView === 'profitSource'}
            onClick={() => setActiveView('profitSource')}
          />
          <NavButton
            label="قوالب احترافية"
            icon={<TemplateIcon className="w-6 h-6 text-violet-400" />}
            isActive={activeView === 'professionalTemplateGenerator'}
            onClick={() => setActiveView('professionalTemplateGenerator')}
          />
          <NavButton
            label="مركز تحويل الملفات"
            icon={<WrenchScrewdriverIcon className="w-6 h-6 text-amber-600" />}
            isActive={activeView === 'fileConverter'}
            onClick={() => setActiveView('fileConverter')}
          />

          <NavHeader label="الحساب والنظام" />
          <NavButton
            label="الملف الشخصي"
            icon={<UserCircleIcon className="w-6 h-6 text-lime-400" />}
            isActive={activeView === 'profile'}
            onClick={() => setActiveView('profile')}
          />
          <NavButton
            label="سلة المحذوفات"
            icon={<TrashIcon className="w-6 h-6 text-gray-500" />}
            isActive={activeView === 'trash'}
            onClick={() => setActiveView('trash')}
          />
          <NavButton
            label="سجل التغييرات"
            icon={<BellIcon className="w-6 h-6 text-blue-300" />}
            isActive={activeView === 'changelog'}
            onClick={() => setActiveView('changelog')}
          />
          <NavButton
            label="الدعم الفني"
            icon={<SupportIcon className="w-6 h-6 text-indigo-300" />}
            isActive={activeView === 'support'}
            onClick={() => setActiveView('support')}
          />
          <NavButton
            label="دليل الاستخدام"
            icon={<InformationCircleIcon className="w-6 h-6 text-sky-300" />}
            isActive={false}
            onClick={openOnboarding}
          />
          
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center w-full gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-indigo-400 hover:bg-slate-800 hover:text-indigo-300 mt-2 border border-dashed border-indigo-500/30"
          >
            <StarIcon className="w-6 h-6 text-amber-400" />
            <span className="truncate font-semibold">قيم تجربتك معنا</span>
          </button>
        </nav>
        
        {currentUser?.plan !== 'premium' ? (
          <div className="mt-auto p-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl text-center flex-shrink-0">
            <h4 className="font-bold text-white text-sm">باقة المحترفين (Pro)</h4>
            <p className="text-[11px] text-slate-400 mt-1 mb-4">
              استخدام غير محدود لكافة ميزات الذكاء الاصطناعي.
            </p>
            <button 
              onClick={() => setUpgradeModalOpen(true)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-900/40"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>ترقية الحساب</span>
            </button>
          </div>
        ) : (
           <div className="mt-auto p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center flex-shrink-0">
              <h4 className="font-bold text-white text-sm">عضوية دائمة!</h4>
              <p className="text-[11px] text-green-300/80 mt-1">
                تتمتع بكافة الميزات الحالية والمستقبلية.
              </p>
          </div>
        )}

      </aside>
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
    </>
  );
};

export default Sidebar;
