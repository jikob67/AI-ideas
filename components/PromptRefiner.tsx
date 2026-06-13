
import React, { useState } from 'react';
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
  Squares2x2Icon
} from './Icons';
import { View } from '../types';

interface PromptRefinerProps {
  navigate: (view: View, context?: any) => void;
}

export const PromptRefiner: React.FC<PromptRefinerProps> = ({ navigate }) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showTransferMenu, setShowTransferMenu] = useState(false);

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
                ? `حول طلب المستخدم التالي إلى طلب احترافي وشامل جداً للذكاء الاصطناعي.
أضف تفاصيل فنية، متطلبات التصميم، والوظائف المتوقعة بناءً على الفكرة.
اجعل الطلب طويلاً ومفصلاً باللغة العربية.

طلب المستخدم: "${inputPrompt}"

أعطني فقط المطالبة النهائية (Prompt) دون أي تعليق إضافي.`
                : `أعد صياغة طلب المستخدم التالي ليكون أكثر وضوحاً ودقة للذكاء الاصطناعي: "${inputPrompt}". أعطني المطالبة فقط.`
            }]
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setRefinedPrompt(data.response?.text || '');
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

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-6 animate-fade-in" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-3">
          <SparklesIcon className="w-10 h-10 text-indigo-400" />
          صياغة الطلب الذكية
        </h1>
        <p className="text-slate-400 mt-2 text-lg">حول فكرتك البسيطة إلى طلب احترافي يفهمه الذكاء الاصطناعي بدقة.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Input Section */}
        <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              أدخل طلبك هنا
            </span>
          </div>
          
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="اكتب فكرتك أو طلبك هنا بشكل مبسط..."
            className="flex-1 w-full bg-transparent border-none text-white text-lg resize-none focus:ring-0 placeholder-slate-600 font-sans leading-relaxed"
          />

          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end font-sans">
            <button
              onClick={() => handleRefine(true)}
              disabled={isLoading || !inputPrompt.trim()}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                isLoading || !inputPrompt.trim() 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
              }`}
            >
              <SparklesIcon className="w-5 h-5" />
              تحسين سحري (مفصل)
            </button>
            <button
              onClick={() => handleRefine(false)}
              disabled={isLoading || !inputPrompt.trim()}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black transition-all ${
                isLoading || !inputPrompt.trim() 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 transform hover:-translate-y-1'
              }`}
            >
              {isLoading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <SendIcon className="w-5 h-5" />
              )}
              {isLoading ? 'جاري الصياغة...' : 'صياغة سريعة'}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-indigo-300 font-bold flex items-center gap-2">
              <SparklesIcon className="w-5 h-5" />
              الطلب المصاغ
            </span>
            {refinedPrompt && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800"
                  title="نسخ"
                >
                  {isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {refinedPrompt ? (
              <div className="text-white text-lg leading-relaxed whitespace-pre-wrap font-sans">
                {refinedPrompt}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <SparklesIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-center italic">سيظهر الطلب المصاغ هنا بعد الضغط على "ابدأ الصياغة"</p>
              </div>
            )}
          </div>

          {refinedPrompt && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">يمكنك الآن تحويل هذا الطلب لأي قسم</span>
              <button
                onClick={() => setShowTransferMenu(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-950 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-white/10"
              >
                استخدام الطلب في...
                <ArrowRightIcon className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setShowTransferMenu(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-8 text-center pt-4">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Squares2x2Icon className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-black text-white">اختر القسم المستهدف</h2>
                <p className="text-slate-400 mt-2">أين ترغب في البدء باستخدام الطلب المصاغ؟</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {transferOptions.map((option: any) => (
                  <button
                    key={option.id + (option.targetFeature || '')}
                    onClick={() => handleTransfer(option.id as View, option.targetFeature)}
                    className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-3xl border border-slate-700/50 hover:border-indigo-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-900 rounded-2xl group-hover:bg-slate-950 transition-colors shadow-inner">
                        {option.icon}
                      </div>
                      <div className="text-right">
                        <div className="text-white font-black text-lg">{option.label}</div>
                        <div className="text-slate-500 text-xs">تحويل الطلب لهذا القسم</div>
                      </div>
                    </div>
                    <ArrowRightIcon className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 rotate-180 transform group-hover:-translate-x-1 transition-all" />
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
