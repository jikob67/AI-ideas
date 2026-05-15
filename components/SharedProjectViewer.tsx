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
          setProject({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Project);
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
    if (!project || !project.files) return '';
    const htmlFile = project.files.find((f: any) => f.name === 'index.html');
    const cssFile = project.files.find((f: any) => f.name === 'style.css');
    const jsFile = project.files.find((f: any) => f.name === 'script.js');

    if (!htmlFile) {
        // If it's a section-based project
        let htmlContent = '';
        if (project.sections && project.sections.length > 0) {
            const htmlSection = project.sections.find((s: any) => s.type === 'تكويد مخصص' || s.type === 'HTML');
            if (htmlSection && htmlSection.config?.htmlContent) {
                return htmlSection.config.htmlContent;
            }
        }
        return '<html><body><div style="font-family:sans-serif;padding:2rem;">المشروع لا يحتوي على ملفات قابلة للعرض.</div></body></html>';
    }

    // Strip existing style/script tags if they exist to prevent duplication or we just inject
    let htmlContent = htmlFile.content.replace(/<link rel="stylesheet" href="style.css">?/g, '')
                                      .replace(/<script src="script.js" defer><\/script>?/g, '');

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${project.name || 'Shared Project'}</title>
                <style>${cssFile ? cssFile.content : ''}</style>
            </head>
            <body>
                ${htmlContent}
                <script>${jsFile ? jsFile.content : ''}</script>
            </body>
        </html>
    `;
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
