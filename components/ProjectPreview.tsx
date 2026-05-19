import React, { useMemo } from 'react';
import { Project, ProjectFile, View } from '../types';
import { 
  ArrowLeftIcon, 
  ComputerDesktopIcon, 
  DevicePhoneMobileIcon,
  Share2Icon,
  CodeIcon,
  RocketLaunchIcon,
  ArrowDownTrayIcon
} from './Icons';
import { motion } from 'motion/react';

interface ProjectPreviewProps {
  navigate: (view: View, context?: any) => void;
  context?: any;
}

export const ProjectPreview: React.FC<ProjectPreviewProps> = ({ navigate, context }) => {
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const project = context?.project as Project;
  const projectFiles = context?.projectFiles as ProjectFile[] || project?.files || [];

  const srcDoc = useMemo(() => {
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
               {project.icon ? <span className="text-xl">{project.icon}</span> : <RocketLaunchIcon className="w-5 h-5 text-indigo-400" />}
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
      <div className="flex-1 bg-slate-900/20 p-6 flex items-center justify-center overflow-auto">
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

      {/* Footer Info */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="text-slate-500 text-xs flex items-center gap-4">
          <span className="flex items-center gap-1"><CodeIcon className="w-3.5 h-3.5" /> {projectFiles.length} ملفات</span>
          <span className="flex items-center gap-1 uppercase tracking-tight font-bold text-indigo-400/70">{project.type}</span>
        </div>
        <div className="flex items-center gap-2">
           <button className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-bold">
              <ArrowDownTrayIcon className="w-4 h-4" />
              تصدير الكود
           </button>
        </div>
      </div>
    </div>
  );
};
