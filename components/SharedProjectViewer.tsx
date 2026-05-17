import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Project } from '../types';
import { SpinnerIcon } from './Icons';

export const SharedProjectViewer: React.FC = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      const pathParts = window.location.pathname.split('/');
      const shareId = pathParts[2]; // /share/:shareId

      if (!shareId) {
        setError('رابط غير صالح');
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'projects'), where('publicShareId', '==', shareId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('المشروع غير موجود أو تم حذفه');
        } else {
          const projectDoc = querySnapshot.docs[0];
          const projectData = { id: projectDoc.id, ...projectDoc.data() } as Project;
          
          // Fetch files from subcollection if not present in main doc
          const filesSnap = await getDocs(collection(db, 'projects', projectDoc.id, 'files'));
          const files = filesSnap.docs.map(doc => doc.data() as any);
          
          setProject({ ...projectData, files });
        }
      } catch (err: any) {
        console.error(err);
        setError('حدث خطأ أثناء جلب المشروع');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, []);

  const srcDoc = useMemo(() => {
    if (!project) return '';
    const files = (project as any).files || [];
    
    const htmlFile = files.find((f: any) => f.name === 'index.html') || files.find((f: any) => f.name.endsWith('.html'));
    const cssFiles = files.filter((f: any) => f.name.endsWith('.css'));
    const jsFiles = files.filter((f: any) => f.name.endsWith('.js'));

    if (!htmlFile) {
        // If it's a section-based project
        if (project.sections && project.sections.length > 0) {
            const htmlSection = project.sections.find((s: any) => s.type === 'تكويد مخصص' || s.type === 'HTML');
            if (htmlSection && htmlSection.config?.htmlContent) {
                return htmlSection.config.htmlContent;
            }
        }
        return '<html lang="ar" dir="rtl"><body style="background:#111; color:#fff; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">المشروع لا يحتوي على ملفات قابلة للعرض.</body></html>';
    }

    let htmlContent = htmlFile.content;
    
    // If it's just a fragment, wrap it
    if (!htmlContent.includes('<html') && !htmlContent.includes('<body')) {
        htmlContent = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${htmlContent}</body></html>`;
    }

    const styles = cssFiles.map((f: any) => `<style data-filename="${f.name}">${f.content}</style>`).join('\n');
    const scripts = jsFiles.map((f: any) => `<script data-filename="${f.name}">${f.content}</script>`).join('\n');

    // Inject styles and scripts
    if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `${styles}\n</head>`);
    } else if (htmlContent.includes('<body>')) {
         htmlContent = htmlContent.replace('<body>', `<body>\n${styles}`);
    } else {
        htmlContent = `${styles}\n${htmlContent}`;
    }

    if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `${scripts}\n</body>`);
    } else {
        htmlContent = `${htmlContent}\n${scripts}`;
    }

    return htmlContent;
  }, [project]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
            <SpinnerIcon className="w-12 h-12 animate-spin mx-auto text-indigo-500 mb-4" />
            <p>جاري تحميل الموقع...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center max-w-md bg-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">عذراً</h1>
            <p className="text-slate-300">{error}</p>
            <a href="/" className="inline-block mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">العودة للرئيسية</a>
        </div>
      </div>
    );
  }

  return (
    <iframe 
        title={project.name} 
        srcDoc={srcDoc} 
        className="w-full h-screen border-0 bg-white" 
        sandbox="allow-scripts allow-forms allow-popups allow-modals"
    />
  );
};
