
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
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View, context?: any) => void;
  isOpen: boolean;
  openOnboarding: () => void;
  navigationContext?: any;
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

export const SECTIONS = [
  { id: 'projectWizard', label: 'خطوات إلى كود', desc: 'أداة خطوة بخطوة لبناء وتوجيه الكود فورا', Icon: RocketLaunchIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'assetStudio', label: 'استوديو الأصول', desc: 'توليد الرسومات والشعارات والأصول الإبداعية', Icon: SquaresPlusIcon, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { id: 'seoOptimizer', label: 'محلل SEO الذكي', desc: 'تحسين تصدر محركات البحث للمحتوى البرمجي', Icon: MagnifyingGlassIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'linkWizard', label: 'رابط إلى كود', desc: 'تحويل أي رابط موقع خارجي لكود مصدري نظيف', Icon: GlobeIcon, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'ideaToCode', label: 'فكرة إلى كود', desc: 'تحويل وصف وأفكار المشروع إلى تطبيق ويب كامل', Icon: LightBulbIcon, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { id: 'textToCode', label: 'نص إلى كود', desc: 'تطوير الكود مباشرة بناء على أوامر نصية مخصصة', Icon: CommandLineIcon, color: 'text-slate-400', bg: 'bg-slate-500/10' },
  { id: 'screenToCode', label: 'شاشة إلى كود', desc: 'تصميم وبناء الواجهات من صور لقطات الشاشة', Icon: CameraIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'drawToCode', label: 'من المخطط للكود', desc: 'رسم مخطط هيكلي وتحويله لكود واجهة حقيقي', Icon: PencilSquareIcon, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'uiRecognizer', label: 'محلل الواجهات', desc: 'تحليل هندسة ومكونات الواجهات بذكاء واقتراح كود', Icon: BeakerIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'flowDemo', label: 'تجربة التدفق', desc: 'محاكاة كاملة لتدفق تجربة المستخدم وحركة التطبيقات', Icon: RocketLaunchIcon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'marketing', label: 'المحتوى التسويقي', desc: 'إنشاء حملات ومحتوى تسويق واحترافي لمنتجاتك', Icon: FireIcon, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'showroom', label: 'معرض المجتمع', desc: 'استعراض ونشر واستلهام مشاريع مذهلة من المبدعين', Icon: TrophyIcon, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'preview', label: 'المعاينة والتحقق', desc: 'معاينة المشروع ومراجعته ببيئة حية تفاعلية', Icon: ShieldCheckIcon, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'promptRefiner', label: 'نقل الطلب وتطوير الفكرة', desc: 'تحسين وهندسة الأوامر بدقة لأفضل مخرجات برمجية', Icon: SparklesIcon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'professionalTemplateGenerator', label: 'قوالب احترافية', desc: 'قوالب برمجية مصممة مسبقا وجاهزة للإطلاق المباشر', Icon: TemplateIcon, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'fileConverter', label: 'مركز تحويل الملفات', desc: 'تحويل الأكواد والملفات البرمجية لعديد الصيغ بسهولة', Icon: WrenchScrewdriverIcon, color: 'text-amber-600', bg: 'bg-amber-600/10' },
  { id: 'dataAnalysis', label: 'تحليل البيانات', desc: 'تحميل ملفات وإجراء تحليلات إحصائية ورسومات تفاعلية', Icon: ChartPieIcon, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { id: 'profitSource', label: 'مصدر ربح', desc: 'منظومة استثمار واستكشاف مصادر الدخل والأرباح للمشروع', Icon: DollarSignIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
  { id: 'trash', label: 'سلة المحذوفات', desc: 'إدارة واستعادة العناصر والأفكار المحذوفة الخاصة بك', Icon: TrashIcon, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  { id: 'support', label: 'الدعم الفني', desc: 'تقديم الإجابة على استفساراتك وحل المشكلات الفنية فوراً', Icon: SupportIcon, color: 'text-indigo-300', bg: 'bg-indigo-300/10' }
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, openOnboarding, navigationContext }) => {
  const { currentUser } = useAuth();
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTransfer = (sectionId: string) => {
    setActiveView(sectionId as View, navigationContext);
    setIsTransferOpen(false);
    setSearchQuery('');
  };

  const filteredSections = SECTIONS.filter(section =>
    section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <aside className={`bg-gray-900 border-l border-slate-800 flex flex-col gap-8 sticky top-0 h-screen transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-64 p-4' : 'w-0 p-0'}`}>
        <div className="flex items-center justify-center px-2 flex-shrink-0 h-[56px]">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI ideas</span>
          </div>
        </div>
        <nav className="flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar pr-1">
          {/* Transfer Context Button */}
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center justify-center w-full gap-2 px-3 py-2.5 mb-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 duration-200"
            title="نقل المشروع أو سياق العمل إلى قسم فني آخر مفيد"
            id="sidebar-transfer-trigger"
          >
            <span className="font-sans">نقل إلى قسم آخر</span>
          </button>
          
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
            <h4 className="font-bold text-white text-sm">الباقة الشاملة (Ultimate)</h4>
            <p className="text-[11px] text-slate-400 mt-1 mb-4">
              وصول غير محدود لعمليات بناء المشاريع، تصدير Flutter، واستضافة مباشرة.
            </p>
            <button 
              onClick={() => setUpgradeModalOpen(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 text-xs shadow-lg shadow-indigo-900/40"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>امتلاك النسخة الكاملة</span>
            </button>
          </div>
        ) : (
           <div className="mt-auto p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-center flex-shrink-0">
              <h4 className="font-bold text-white text-sm">العضوية الشاملة مفعلة!</h4>
              <p className="text-[11px] text-indigo-300/80 mt-1">
                لديك وصول كامل لكافة ميزات الذكاء الاصطناعي.
              </p>
          </div>
        )}

      </aside>
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
      <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />

      {/* Transfer System Modal */}
      <AnimatePresence>
        {isTransferOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="transfer-modal-overlay" dir="rtl" onClick={() => setIsTransferOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" 
              onClick={e => e.stopPropagation()}
              id="transfer-modal-card"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4 text-right">
                <div>
                  <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center gap-2">
                    <span className="text-xl">🔄</span> نظام النقل الذكي بين الأقسام
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                    هل ترغب في تغيير طريقتك؟ يمكنك مواصلة العمل على نفس المحتوى والسياق الحالي لكن عبر الانتقال فورا إلى ميزة أو قسم فني آخر.
                  </p>
                </div>
                <button 
                  onClick={() => setIsTransferOpen(false)} 
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all self-start md:self-auto"
                  id="close-transfer-btn"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Search Control */}
              <div className="p-4 bg-slate-900 border-b border-slate-800/60">
                <div className="relative max-w-md mx-auto">
                  <span className="absolute inset-y-0 right-3 flex items-center text-slate-500">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث عن القسم أو الأداة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500/80 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all text-right font-sans"
                    id="transfer-search-input"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Sections */}
              <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-900/40 text-right">
                {filteredSections.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="transfer-sections-grid">
                    {filteredSections.map((section) => {
                      const IconComponent = section.Icon;
                      const isCurrent = activeView === section.id;
                      
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleTransfer(section.id)}
                          className={`group text-right p-4 rounded-2xl border text-slate-300 transition-all flex flex-col justify-between h-[135px] duration-300 ${
                            isCurrent 
                              ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20' 
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80 hover:-translate-y-1'
                          }`}
                          id={`transfer-item-${section.id}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className={`p-2 rounded-xl ${section.bg} ${section.color} group-hover:scale-110 transition-transform duration-300`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold">القسم الحالي</span>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <h4 className="text-white font-bold text-xs group-hover:text-indigo-300 transition-colors font-sans">{section.label}</h4>
                            <p className="text-[10px] text-slate-500 leading-normal mt-1 line-clamp-2 group-hover:text-slate-400 transition-colors font-sans">{section.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12" id="no-sections-found">
                    <p className="text-slate-500 text-sm">عذراً، لم نتمكن من العثور على أي قسم يطابق بحثك.</p>
                  </div>
                )}
              </div>

              {/* Footer Banner */}
              <div className="bg-slate-950 p-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                <span>نظام نقل السياق الذكي v1.1</span>
                <span>اختر القسم لتوجيه فكرتك أو كودك الحالي إليه فوراً</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
