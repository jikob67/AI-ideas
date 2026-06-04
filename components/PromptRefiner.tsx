import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SparklesIcon, 
  SendIcon, 
  ArrowPathIcon, 
  CopyIcon, 
  CheckIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  CodeIcon,
  VideoIcon,
  ChartPieIcon,
  PaintBrushIcon,
  XMarkIcon,
  Squares2x2Icon,
  ListBulletIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon
} from './Icons';
import { View } from '../types';

interface PromptRefinerProps {
  navigate: (view: View, context?: any) => void;
}

interface PromptHistoryItem {
  id: string;
  original: string;
  refined: string;
  timestamp: string;
}

export const PromptRefiner: React.FC<PromptRefinerProps> = ({ navigate }) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'business' | 'ecommerce' | 'social' | 'tools'>('all');
  const [history, setHistory] = useState<PromptHistoryItem[]>([]);
  const [isHistoryCopiedId, setIsHistoryCopiedId] = useState<string | null>(null);

  // Load Prompt History on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_ideas_prompt_refiner_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing prompt history', e);
      }
    }
  }, []);

  // Save Prompt History helper
  const saveToHistory = (original: string, refined: string) => {
    const newItem: PromptHistoryItem = {
      id: Date.now().toString(),
      original,
      refined,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('ar-EG')
    };
    const updated = [newItem, ...history.slice(0, 19)]; // Keep last 20 items
    setHistory(updated);
    localStorage.setItem('ai_ideas_prompt_refiner_history', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    if (window.confirm('هل تريد بالتأكيد إفراغ سجل الطلبات؟')) {
      setHistory([]);
      localStorage.removeItem('ai_ideas_prompt_refiner_history');
    }
  };

  const handleRefine = async (autoEnhance: boolean = false) => {
    if (!inputPrompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-flash-latest',
          contents: [{
            role: 'user',
            parts: [{
              text: autoEnhance 
                ? `حول طلب المستخدم التالي إلى طلب احترافي وشامل جداً ومصمم بذكاء للذكاء الاصطناعي.
أضف التفاصيل الفنية الكافية، واقتراحات التصميم الفريد، والوظائف المتوقعة بالتفصيل بناءً على الفكرة.
اجعل الطلب طويلاً ومفصلاً باللغة العربية مع مراعاة بنية هرمية واضحة للميزات.

طلب المستخدم: "${inputPrompt}"

أعطني فقط المطالبة النهائية (Prompt) المكتوبة والمصاغة دون أي تعليقات أو مقدمات أو خاتمة خارج الطلب.`
                : `أعد صياغة طلب المستخدم التالي ليكون أكثر وضوحاً ودقة واحترافية لتوجيه الذكاء الاصطناعي: "${inputPrompt}". أعطني المطالبة فقط باللغة العربية بدون أي تعليقات جانبية.`
            }]
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      const textResult = data.response?.text || '';
      setRefinedPrompt(textResult);
      saveToHistory(inputPrompt, textResult);
    } catch (error) {
      console.error('Error refining prompt:', error);
      alert('حدث خطأ أثناء محاولة صياغة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(refinedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyHistory = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsHistoryCopiedId(id);
    setTimeout(() => setIsHistoryCopiedId(null), 2000);
  };

  const handleAppendChip = (chipText: string) => {
    const trimmedInput = inputPrompt.trim();
    if (trimmedInput) {
      setInputPrompt(trimmedInput + '، مع ' + chipText);
    } else {
      setInputPrompt(chipText);
    }
  };

  // Predefined prompt templates categorized
  const promptTemplates = [
    {
      category: 'business',
      label: 'نظام إدارة موظفين',
      text: 'بناء نظام متكامل لإدارة شؤون الموظفين بجدول تفاعلي، ومستشعرات لحالة الحضور، ولوحة تحكم بالصلاحيات مع إمكانية تصدير التقارير كملف إكسل.'
    },
    {
      category: 'ecommerce',
      label: 'متجر تسوق كامل',
      text: 'إنشاء متجر إلكتروني عصري لبيع المنتجات الرقمية يحتوي على فلتر متقدم للمنتجات وسلة مشتريات حية مع محاكاة بوابة الدفع الآمنة وحفظ الطلبات بـ Firestore.'
    },
    {
      category: 'social',
      label: 'مراسلة وغرف دردشة',
      text: 'إنشاء تطبيق دردشة جماعية فوري يدعم إنشاء غرف دردشة مخصصة ومشاركة صور مبسطة بالإضافة إلى مؤشر حي لحالة الاتصال والمظهر الليلي.'
    },
    {
      category: 'tools',
      label: 'أداة إنتاجية وتلخيص',
      text: 'أداة إنتاجية لتلخيص المستندات الطويلة والكتب بذكاء مع تلوين الأفكار الرئيسية، وإتاحة كتابة الملاحظات الجانبية وتصديرها بملف نصي.'
    },
    {
      category: 'business',
      label: 'محول الفواتير التلقائي',
      text: 'تطبيق لحساب الضرائب وترتيب الفواتير للشركات الناشئة مع مخططات بيانية تفاعلية لمبيعات ومصروفات كل شهر.'
    },
    {
      category: 'ecommerce',
      label: 'حجز ومواعيد العيادات',
      text: 'منصة تتيح للمستخدمين حجز المواعيد مع الأطباء واختيار التخصص المناسب مع واجهة تقويم تفاعلية وتنبيهات فورية لتأكيد الحجز.'
    }
  ];

  const boosterChips = [
    'قاعدة بيانات Firestore لحفظ البيانات بشكل دائم وتلقائي',
    'نظام توثيق وتسجيل دخول بالبريد الإلكتروني',
    'تصميم احترافي وداكن جذاب ومريح للعين',
    'رسوم بيانية وإحصائيات تفاعلية غنية ومبسطة',
    'دعم كامل للتجاوب مع كافة أحجام الهواتف والشاشات',
    'تصدير البيانات كملفات PDF أو Excel بنقرة زر'
  ];

  const transferOptions = [
    { id: 'ideaToCode', label: 'فكرة إلى كود', icon: <RocketLaunchIcon className="w-5 h-5 text-indigo-400" /> },
    { id: 'textToCode', label: 'نص إلى كود', icon: <CodeIcon className="w-5 h-5 text-emerald-400" /> },
    { id: 'screenToCode', label: 'شاشة إلى كود', icon: <RocketLaunchIcon className="w-5 h-5 text-purple-400" /> },
    { id: 'dataAnalysis', label: 'تحليل البيانات', icon: <ChartPieIcon className="w-5 h-5 text-amber-400" /> },
    { id: 'aiAssistant', label: 'توليد فيديو', icon: <VideoIcon className="w-5 h-5 text-purple-400" />, targetFeature: 'Generate Video' },
    { id: 'assetStudio', label: 'استوديو الأصول', icon: <PaintBrushIcon className="w-5 h-5 text-pink-400" /> },
  ];

  const handleTransfer = (view: View, targetFeature?: string) => {
    navigate(view, { prefillPrompt: refinedPrompt, targetFeature });
  };

  const filteredTemplates = activeCategory === 'all' 
    ? promptTemplates 
    : promptTemplates.filter(t => t.category === activeCategory);

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto p-4 md:p-6 overflow-y-auto" dir="rtl">
      {/* Title section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
            <SparklesIcon className="w-10 h-10 text-indigo-400" />
            نقل الطلب وتطوير الفكرة
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base leading-relaxed">
            محرك صياغة الأوامر الذكية وهندستها وتطوير الأفكار الأولية لتطبيقات برمجية وحلول متكاملة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Templates Panel - take 4 cols on large screens */}
        <div className="lg:col-span-4 flex flex-col gap-4 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-5">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm border-b border-slate-800 pb-3">
            <ListBulletIcon className="w-5 h-5 text-indigo-400" />
            نماذج وأفكار ملهمة للبدء
          </div>

          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl">
            <button 
              onClick={() => setActiveCategory('all')} 
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${activeCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setActiveCategory('business')} 
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${activeCategory === 'business' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              أعمال
            </button>
            <button 
              onClick={() => setActiveCategory('ecommerce')} 
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${activeCategory === 'ecommerce' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              متاجر
            </button>
            <button 
              onClick={() => setActiveCategory('social')} 
              className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${activeCategory === 'social' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              تواصل
            </button>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {filteredTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => setInputPrompt(template.text)}
                className="text-right p-3 bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all group"
              >
                <div className="text-white text-xs font-bold group-hover:text-indigo-400 transition-colors">
                  {template.label}
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed mt-1 line-clamp-2">
                  {template.text}
                </div>
              </button>
            ))}
          </div>

          {/* Guide Tips Section */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed font-sans">
            <div className="font-bold text-slate-200 flex items-center gap-1 text-xs">
              💡 إرشادات للحصول على أفضل صياغة:
            </div>
            <p>1. حدد دور التطبيق الأساسي ومن هم مستخدموه.</p>
            <p>2. اذكر أنواع البيانات التي تريد حفظها بوضوح.</p>
            <p>3. حدد واجهات ومخطط تدفق الشاشات المتوقع.</p>
          </div>
        </div>

        {/* Workspace - Input & Output - take 8 cols */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[480px]">
            {/* Input formulation area */}
            <div className="flex flex-col bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-slate-300 font-bold flex items-center gap-2 text-xs md:text-sm">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  أدخل الفكرة الأولية أو الطلب
                </span>
                <span className="text-slate-500 text-xs font-mono">
                  {inputPrompt.length} حرف | {inputPrompt.split(/\s+/).filter(Boolean).length} كلمة
                </span>
              </div>
              
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="اكتب فكرتك أو طلبك هنا بشكل مبسط... مثلاً: تطبيق قائمة مهام جميل وقاعدة بيانات."
                className="flex-grow w-full bg-transparent border-none text-white text-sm md:text-base resize-none focus:ring-0 placeholder-slate-600 font-sans leading-relaxed min-h-[200px]"
              />

              {/* Development Chips & Booster */}
              <div className="my-4">
                <span className="text-[10px] text-slate-500 font-bold block mb-2">تطوير فكرتك بلمسة واحدة:</span>
                <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto custom-scrollbar">
                  {boosterChips.map((chip, index) => (
                    <button
                      key={index}
                      onClick={() => handleAppendChip(chip)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-750 text-slate-300 px-2 py-1 rounded-lg border border-slate-700/60 hover:border-slate-500 transition-colors flex items-center gap-1"
                    >
                      <span>➕</span>
                      <span>{chip.replace('قاعدة بيانات ', '').replace('نظام توثيق و', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 font-sans justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleRefine(true)}
                  disabled={isLoading || !inputPrompt.trim()}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isLoading || !inputPrompt.trim() 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 shadow-lg'
                  }`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  تحسين سحري تفصيلي
                </button>
                <button
                  onClick={() => handleRefine(false)}
                  disabled={isLoading || !inputPrompt.trim()}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                    isLoading || !inputPrompt.trim() 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/30'
                  }`}
                >
                  {isLoading ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SendIcon className="w-4 h-4" />
                  )}
                  {isLoading ? 'جاري التوليد...' : 'صياغة ذكية سريعة'}
                </button>
              </div>
            </div>

            {/* Output Formulation Area */}
            <div className="flex flex-col bg-slate-900/70 backdrop-blur-xl border border-indigo-500/15 rounded-2xl p-5 shadow-2xl overflow-hidden relative">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
                <span className="text-indigo-300 font-bold flex items-center gap-2 text-xs md:text-sm">
                  <SparklesIcon className="w-4 h-4 text-indigo-400 animate-pulse" />
                  الطلب المصاغ الجاهز للاستخدام
                </span>
                {refinedPrompt && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-1 px-2.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all border border-slate-800 flex items-center gap-1.5 text-xs font-sans"
                      title="نسخ"
                    >
                      {isCopied ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-green-500 font-bold">تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-grow flex flex-col min-h-[220px]">
                {refinedPrompt ? (
                  <textarea
                    value={refinedPrompt}
                    onChange={(e) => setRefinedPrompt(e.target.value)}
                    className="w-full h-full bg-transparent border-none text-white text-sm md:text-base resize-none focus:ring-0 font-sans leading-relaxed overflow-y-auto custom-scrollbar"
                    placeholder="يمكنك تعديل هذه المخرجات هنا مباشرة..."
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 flex-grow">
                    <SparklesIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-center italic text-xs md:text-sm">سيظهر طلبك المصاغ والمنقح هنا تلقائياً، ويمكنك مراجعته والتعديل عليه قبل النقل.</p>
                  </div>
                )}
              </div>

              {refinedPrompt && (
                <div className="mt-4 pt-4 border-t border-slate-850 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/40 p-2 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-sans">يمكنك توجيه ونقل هذا الطلب فورا:</span>
                  <button
                    onClick={() => setShowTransferMenu(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-black rounded-xl hover:-translate-y-0.5 transition-all shadow-md"
                  >
                    🚀 نقل الطلب والبدء بـ...
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prompt formulation History tracking */}
          {history.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
                <h4 className="font-bold text-white text-xs md:text-sm flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 text-emerald-400" />
                  سجل الطلبات المصاغة السابقة ({history.length})
                </h4>
                <button
                  onClick={handleClearHistory}
                  className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  مسح السجل
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-slate-700/60 transition-all text-right group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                        <span>{item.timestamp}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setInputPrompt(item.original);
                              setRefinedPrompt(item.refined);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-bold"
                          >
                            إعادة تحميل للقائمة
                          </button>
                          <span>|</span>
                          <button
                            onClick={() => handleCopyHistory(item.refined, item.id)}
                            className="text-emerald-400 hover:text-emerald-300 font-bold"
                          >
                            {isHistoryCopiedId === item.id ? 'تم النسخ!' : 'نسخ الصياغة'}
                          </button>
                        </div>
                      </div>
                      <div className="text-white text-xs font-bold leading-normal mb-1.5 truncate">
                        💡 الأصل: {item.original}
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 font-sans">
                        {item.refined}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Target Destination Modal */}
      <AnimatePresence>
        {showTransferMenu && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setShowTransferMenu(false)}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-4 left-4 p-2">
                <button onClick={() => setShowTransferMenu(false)} className="p-1 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 text-center pt-2">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
                  <Squares2x2Icon className="w-7 h-7 text-indigo-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">نقل وتوجيه الفكرة لقسم آخر</h2>
                <p className="text-slate-400 text-xs md:text-sm mt-1.5">أين ترغب في توجيه وبدء بناء طلب فكرتك الاحترافي المصاغ؟</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                {transferOptions.map((option) => (
                  <button
                    key={option.id + (option.targetFeature || '')}
                    onClick={() => {
                      handleTransfer(option.id as View, option.targetFeature);
                      setShowTransferMenu(false);
                    }}
                    className="flex flex-col text-right p-4 bg-slate-800/40 hover:bg-slate-800/90 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-900 rounded-xl group-hover:scale-105 transition-transform duration-200">
                        {option.icon}
                      </div>
                      <div className="text-white font-bold text-sm leading-tight">{option.label}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 group-hover:text-slate-400 leading-normal font-sans">
                      الانتقال لهذا القسم مع تعبئة المخرجات فيه لتبدأ بالعمل فوراً.
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
