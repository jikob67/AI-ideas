import React, { useMemo } from 'react';
import { Project, ProjectFile, View } from '../types';
import { 
  ArrowLeftIcon, 
  ComputerDesktopIcon, 
  DevicePhoneMobileIcon,
  Share2Icon,
  CodeIcon,
  RocketLaunchIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  CheckCircleIcon,
  CheckIcon
} from './Icons';
import { motion } from 'motion/react';

interface ProjectPreviewProps {
  navigate: (view: View, context?: any) => void;
  context?: any;
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({ navigate, context }) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [loadingFiles, setLoadingFiles] = React.useState(false);
  const [fetchedFiles, setFetchedFiles] = React.useState<ProjectFile[]>([]);
  const project = context?.project as Project;
  
  const projectFiles = React.useMemo(() => {
    if (context?.projectFiles && context.projectFiles.length > 0) return context.projectFiles as ProjectFile[];
    if (project?.files && project.files.length > 0) return project.files;
    return fetchedFiles;
  }, [context?.projectFiles, project?.files, fetchedFiles]);

  React.useEffect(() => {
    const hasFiles = (context?.projectFiles && context.projectFiles.length > 0) || (project?.files && project.files.length > 0);
    if (project && !hasFiles) {
      setLoadingFiles(true);
      import('../services/persistenceService').then(({ persistenceService }) => {
        persistenceService.getProjectFiles(project.id).then(files => {
          setFetchedFiles(files);
          setLoadingFiles(false);
        }).catch(err => {
          console.error("Error fetching project files for preview:", err);
          setLoadingFiles(false);
        });
      });
    }
  }, [project, context?.projectFiles]);

  const srcDoc = useMemo(() => {
    if (loadingFiles) {
        return `
            <html lang="ar" dir="rtl">
            <body style="background:#111; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px; animation: pulse 2s infinite;">⏳</div>
                <h2 style="margin-bottom: 10px;">جاري جلب الملفات...</h2>
                <p style="color: #888;">يرجى الانتظار قليلاً بينما نقوم بتجهيز المعاينة.</p>
                <style>
                    @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.5; transform: scale(0.9); } }
                </style>
            </body>
            </html>`;
    }
    if (!projectFiles || projectFiles.length === 0) {
      return `
        <html lang="ar" dir="rtl">
        <body style="background:#111; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">📂</div>
            <h2 style="margin-bottom: 10px;">لا توجد ملفات متوفرة</h2>
            <p style="color: #888;">لم نتمكن من العثور على ملفات لهذا المشروع للعرض.</p>
        </body>
        </html>`;
    }

    const htmlFile = projectFiles.find(f => f.name === 'index.html') || projectFiles.find(f => f.name.endsWith('.html'));
    const cssFiles = projectFiles.filter(f => f.name.endsWith('.css'));
    const jsFiles = projectFiles.filter(f => f.name.endsWith('.js'));

    if (!htmlFile) {
      return `
        <html lang="ar" dir="rtl">
        <body style="background:#111; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="margin-bottom: 10px;">ملف HTML مفقود</h2>
            <p style="color: #888;">ليتم عرض المعاينة، يجب وجود ملف HTML أساسي.</p>
        </body>
        </html>`;
    }

    let htmlContent = htmlFile.content;
    
    // Inject Trinity standards if needed, but for preview we usually just want to see what was built
    const styles = cssFiles.map(f => `<style data-filename="${f.name}">${f.content}</style>`).join('\n');
    const scripts = jsFiles.map(f => `<script data-filename="${f.name}">${f.content}</script>`).join('\n');

    if (htmlContent.includes('</head>')) {
      htmlContent = htmlContent.replace('</head>', `${styles}\n</head>`);
    } else {
      htmlContent = `${styles}\n${htmlContent}`;
    }

    if (htmlContent.includes('</body>')) {
      htmlContent = htmlContent.replace('</body>', `${scripts}\n</body>`);
    } else {
      htmlContent = `${htmlContent}\n${scripts}`;
    }

    return htmlContent;
  }, [projectFiles]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <RocketLaunchIcon className="w-16 h-16 mb-4 opacity-20" />
        <p>الرجاء تحديد مشروع للمعاينة</p>
        <button onClick={() => navigate('showroom')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl">الذهاب للمعرض</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('showroom')}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
            title="العودة للمعرض"
          >
            <ArrowLeftIcon className="w-5 h-5 rotate-180" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
               {project.iconUrl ? <img src={project.iconUrl} className="w-5 h-5" alt="" /> : <RocketLaunchIcon className="w-5 h-5 text-indigo-400" />}
               {project.name}
            </h1>
            <p className="text-xs text-slate-500 font-medium">قسم المعاينة والتحقق</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50">
          <button 
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded-lg transition-all ${device === 'desktop' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ComputerDesktopIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded-lg transition-all ${device === 'mobile' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <DevicePhoneMobileIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
             onClick={() => navigate('editApp', { project })}
             className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold border border-slate-700 transition-all flex items-center gap-2"
          >
            <CodeIcon className="w-4 h-4" />
            تعديل المشروع
          </button>
          <button 
             className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl border border-indigo-500/30 transition-all"
             onClick={() => {
                const shareUrl = `${window.location.origin}/shared/${(project as any).publicShareId || project.id}`;
                navigator.clipboard.writeText(shareUrl);
                alert('تم نسخ رابط المعاينة!');
             }}
          >
            <Share2Icon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-slate-900/20 p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        <div className="flex-1 flex items-center justify-center overflow-auto">
            <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 relative ${
                device === 'mobile' ? 'w-[375px] h-[667px] ring-8 ring-slate-800' : 'w-full h-full'
            }`}
            >
            {device === 'mobile' && (
                <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 flex justify-center items-center">
                <div className="w-16 h-1 bg-slate-700 rounded-full"></div>
                </div>
            )}
            <iframe 
                srcDoc={srcDoc}
                className={`w-full h-full border-none ${device === 'mobile' ? 'mt-6' : ''}`}
                title="Project Preview"
                sandbox="allow-scripts"
            />
            </motion.div>
        </div>

        {/* Right Sidebar - Checklist & Actions */}
        <div className="w-full md:w-80 flex flex-col gap-6 flex-shrink-0 animate-fade-in">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-indigo-400" />
                    خارطة طريق الإطلاق
                </h3>
                <div className="space-y-3">
                    {[
                        { text: 'معاينة التصميم وتجربة المستخدم', done: true },
                        { text: 'توليد المحتوى التسويقي للمشروع', done: false, action: () => navigate('marketingHub', { project }) },
                        { text: 'إنشاء الأيقونات والهوية البصرية', done: false, action: () => navigate('assetStudio', { project }) },
                        { text: 'تحسين SEO لمحركات البحث', done: false, action: () => navigate('seoOptimizer', { project }) },
                        { text: 'النشر في المعرض المجتمعي', done: false, action: () => navigate('showroom', { project }) },
                    ].map((item, i) => (
                        <div 
                            key={i} 
                            onClick={item.action}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                                item.done 
                                ? 'bg-indigo-500/10 border-indigo-500/20' 
                                : 'bg-slate-800/50 border-slate-700/50 hover:border-indigo-500/40 hover:bg-slate-800'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-indigo-500 text-white' : 'border-2 border-slate-600'}`}>
                                {item.done && <CheckIcon className="w-3 h-3" />}
                            </div>
                            <span className={`text-xs ${item.done ? 'text-slate-200 line-through opacity-70' : 'text-slate-400 hover:text-indigo-400'}`}>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-5">
                <h4 className="text-white text-sm font-bold mb-2">هل تحتاج لميزات جديدة؟</h4>
                <p className="text-[11px] text-indigo-200/60 leading-relaxed mb-4">يمكنك في أي وقت العودة للمحرر وطلب ميزات إضافية من المساعد الذكي.</p>
                <button 
                   onClick={() => navigate('editApp', { project })}
                   className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                >
                    متابعة التطوير عبر AI
                </button>
            </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="text-slate-500 text-xs flex items-center gap-4">
          <span className="flex items-center gap-1"><CodeIcon className="w-3.5 h-3.5" /> {projectFiles.length} ملفات</span>
          <span className="flex items-center gap-1 uppercase tracking-tight font-bold text-indigo-400/70">{project.type}</span>
        </div>
        <div className="flex items-center gap-4">
           <button 
              onClick={() => navigate('marketingHub', { project })}
              className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors"
           >
              <MegaphoneIcon className="w-4 h-4" />
              ترويج تسويقي
           </button>
           <button 
              onClick={() => navigate('assetStudio', { project })}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
           >
              <PaintBrushIcon className="w-4 h-4" />
              إنشاء أيقونات
           </button>
           <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" />
              تصدير الكود
           </button>
           <button 
              onClick={() => navigate('showroom', { project })}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-105"
           >
              <RocketLaunchIcon className="w-4 h-4" />
              نشر في معرض المجتمع
           </button>
        </div>
      </div>
    </div>
  );
};
