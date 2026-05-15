
import React, { useState } from 'react';
import { View, Project, ProjectType } from './types';
import { geminiService } from './services/geminiService';
import { useAuth } from './hooks/useAuth';
import { useUsage } from './contexts/UsageContext';
import { ArrowLeftIcon, GlobeIcon, SparklesIcon, LoaderIcon, ImageIcon, TypeIcon, AlignLeftIcon } from './components/Icons';
import { motion, AnimatePresence } from 'motion/react';

interface UrlToCodeProps {
  navigate: (view: View, context?: any) => void;
  context?: any;
}

export const UrlToCode: React.FC<UrlToCodeProps> = ({ navigate, context }) => {
  const { currentUser } = useAuth();
  const { incrementUsage, isLimitReached } = useUsage();
  const [projectName, setProjectName] = useState(context?.initialProject?.name || '');
  const [projectDescription, setProjectDescription] = useState(context?.initialProject?.description || '');
  const [projectUrl, setProjectUrl] = useState(context?.initialProject?.url || '');
  const [projectIcon, setProjectIcon] = useState(context?.initialProject?.icon || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (context?.initialProject?.url && !isGenerating && logs.length === 0) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
        handleBuild(fakeEvent);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [context]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectUrl) {
      setError('يرجى إدخال اسم المشروع ورابطه على الأقل.');
      return;
    }

    if (isLimitReached(ProjectType.PROJECT_GENERATION)) {
      setError('لقد وصلت إلى الحد اليومي لبناء المشاريع. قم بالترقية للمتابعة.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLogs([]);

    try {
      addLog('جاري جلب محتوى الرابط...');
      const proxyRes = await fetch(`/api/proxy?url=${encodeURIComponent(projectUrl)}`);
      if (!proxyRes.ok) throw new Error('فشل جلب محتوى الرابط. تأكد من صحة الرابط.');
      const htmlContent = await proxyRes.text();
      
      addLog('تم جلب المحتوى بنجاح. جاري تحليل البيانات...');
      
      const prompt = `
        بناء مشروع جديد بناءً على الرابط التالي: ${projectUrl}
        اسم المشروع: ${projectName}
        وصف المشروع: ${projectDescription}
        محتوى الصفحة المرجعية (HTML):
        ${htmlContent.substring(0, 10000)} // Limit content for prompt size
        
        المطلوب: إنشاء مشروع متكامل (HTML, CSS, JS) مستوحى من هذا الرابط ولكن بتصميم عصري وفريد.
      `;

      const project = await geminiService.buildProjectFromSpec({
        projectName,
        prompt,
        projectType: ProjectType.WEBSITE,
        files: [],
        iconUrl: projectIcon || null
      }, addLog);

      incrementUsage(ProjectType.PROJECT_GENERATION);
      navigate('editApp', { project });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء بناء المشروع.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full">
        <button 
          onClick={() => navigate('ideaToCode')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>العودة للرئيسية</span>
        </button>

        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 mb-4 border border-indigo-500/30">
            <GlobeIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            بناء مشروع من رابط
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            أدخل تفاصيل مشروعك ورابط الموقع المرجعي، وسيقوم الذكاء الاصطناعي ببناء نسخة احترافية لك.
          </p>
        </div>

        <form onSubmit={handleBuild} className="space-y-6 bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl backdrop-blur-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <TypeIcon className="w-4 h-4 text-indigo-400" />
                اسم المشروع
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="مثلاً: متجري الإلكتروني"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                رابط الأيقونة (اختياري)
              </label>
              <input
                type="url"
                value={projectIcon}
                onChange={(e) => setProjectIcon(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <GlobeIcon className="w-4 h-4 text-indigo-400" />
              رابط الموقع المرجعي أو مستودع GitHub
            </label>
            <input
              type="url"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://example.com أو https://github.com/user/repo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
            {projectUrl.includes('github.com') && (
              <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                <SparklesIcon className="w-3 h-3" />
                تم اكتشاف رابط GitHub! سيتم استيراد الكود والمجلدات مباشرة.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <AlignLeftIcon className="w-4 h-4 text-indigo-400" />
              وصف المشروع
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="صف ما تريد بناءه بالتفصيل..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20"
          >
            {isGenerating ? (
              <>
                <LoaderIcon className="w-5 h-5 animate-spin" />
                <span>جاري البناء...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                <span>ابدأ بناء المشروع</span>
              </>
            )}
          </button>
        </form>

        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
                <LoaderIcon className="w-4 h-4 animate-spin" />
                سجل العمليات
              </h3>
              <div className="space-y-2 font-mono text-xs text-slate-500 max-h-40 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-indigo-500">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
