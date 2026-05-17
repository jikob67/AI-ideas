import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon, 
  CheckIcon as CheckCircleIcon,
  CheckIcon as DocumentCheckIcon,
  InformationCircleIcon as ExclamationTriangleIcon,
  CodeIcon as CodeBracketIcon,
  RocketLaunchIcon,
  RocketLaunchIcon as ChartBarIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from './Icons';
import { geminiService } from '../services/geminiService';

interface OptimizationResult {
  score: number;
  seo: { status: 'good' | 'warning' | 'error'; message: string }[];
  performance: { status: 'good' | 'warning' | 'error'; message: string }[];
  accessibility: { status: 'good' | 'warning' | 'error'; message: string }[];
  suggestedFixes: string;
}

export const SeoOptimizer: React.FC = () => {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'seo' | 'perf' | 'access'>('seo');

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following HTML/CSS/JS code for SEO, Performance, and Accessibility.
      Code:
      ${code}
      
      Return a JSON object:
      {
        "score": number (0-100),
        "seo": [{"status": "good"|"warning"|"error", "message": "string"}],
        "performance": [{"status": "good"|"warning"|"error", "message": "string"}],
        "accessibility": [{"status": "good"|"warning"|"error", "message": "string"}],
        "suggestedFixes": "Markdown string of optimized code or fixes"
      }`;

      const response = await geminiService.generateText(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setResult(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const StatusIcon = ({ status }: { status: 'good' | 'warning' | 'error' }) => {
    switch (status) {
      case 'good': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'error': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MagnifyingGlassIcon className="w-8 h-8 text-indigo-400" />
            محلل الـ SEO والأداء ذكي
          </h1>
          <p className="text-slate-400 mt-2">قم بتحسين كودك ليتصدر محركات البحث ويعمل بسرعة البرق</p>
        </div>
        <div className="flex gap-4">
           {result && (
              <div className="bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-700">
                <span className="text-slate-400 text-sm">معدل التحسين الإجمالي:</span>
                <span className={`text-2xl font-black ${result.score > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {result.score}%
                </span>
              </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Editor Side */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">المحرر</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ألصق كود الـ HTML هنا للتحليل..."
              className="flex-1 bg-transparent p-4 text-slate-300 font-mono text-sm focus:outline-none resize-none leading-relaxed"
              dir="ltr"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-indigo-500/10"
          >
            {isAnalyzing ? (
              <ArrowPathIcon className="w-6 h-6 animate-spin" />
            ) : (
              <RocketLaunchIcon className="w-6 h-6" />
            )}
            {isAnalyzing ? 'جاري التحليل العميق...' : 'بدء التحليل والتحسين'}
          </button>
        </div>

        {/* Results Side */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <ChartBarIcon className="w-12 h-12 text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-500 mb-2">لا توجد تحليلات حالياً</h3>
              <p className="text-slate-600 max-w-xs">أدخل الكود الخاص بك واضغط على زر التحليل للحصول على رؤى تقنية دقيقة</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="flex border-b border-slate-800">
                  <button 
                    onClick={() => setActiveTab('seo')}
                    className={`flex-1 px-4 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'seo' ? 'text-indigo-400 bg-indigo-400/5 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <SparklesIcon className="w-4 h-4" />
                    محركات البحث (SEO)
                  </button>
                  <button 
                    onClick={() => setActiveTab('perf')}
                    className={`flex-1 px-4 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'perf' ? 'text-blue-400 bg-blue-400/5 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <RocketLaunchIcon className="w-4 h-4" />
                    الأداء والسرعة
                  </button>
                  <button 
                    onClick={() => setActiveTab('access')}
                    className={`flex-1 px-4 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'access' ? 'text-purple-400 bg-purple-400/5 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <DocumentCheckIcon className="w-4 h-4" />
                    سهولة الوصول
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3"
                    >
                      {(activeTab === 'seo' ? result.seo : activeTab === 'perf' ? result.performance : result.accessibility).map((item, idx) => (
                        <div key={idx} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 flex items-start gap-4">
                           <StatusIcon status={item.status} />
                           <p className="text-sm text-slate-300 leading-relaxed">{item.message}</p>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
               </div>

               <div className="p-4 bg-slate-900 border-t border-slate-800">
                  <button 
                    className="w-full bg-slate-800 hover:bg-slate-700 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
                    onClick={() => {
                      navigator.clipboard.writeText(result.suggestedFixes);
                      alert('تم نسخ المقترحات إلى الحافظة');
                    }}
                  >
                    <CodeBracketIcon className="w-4 h-4" />
                    نسخ الكود المحسن (AI optimized)
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
