import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FireIcon, 
  SparklesIcon as EyeIcon, 
  HeartIcon, 
  Share2Icon as ShareIcon,
  PlusIcon as PlusCircleIcon,
  RocketLaunchIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  AppleIcon,
  AndroidIcon,
  LinkExternalIcon
} from './Icons';
const HeartSolidIcon: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11.645 20.91l-.007-.003-.003-.001a11.478 11.478 0 01-1.055-.514c-1.15-.61-2.617-1.572-3.957-2.912a9.124 9.124 0 01-2.623-6.48c0-2.484 2.1-4.5 4.5-4.5 1.54 0 2.87.584 3.75 1.48.88-.896 2.21-1.48 3.75-1.48 2.4 0 4.5 2.016 4.5 4.5 0 2.488-1.5 4.53-2.623 6.48-1.34 1.34-2.807 2.302-3.957 2.912-.34.18-.84.444-1.055.514l-.003.001-.007.003-.037.017-.037-.017z" />
  </svg>
);

import { collection, query, getDocs, limit, orderBy, where, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SpinnerIcon, XMarkIcon, ArrowLeftIcon } from './Icons';
import { ProjectType } from '../types';

interface GalleryProject {
  id: string;
  name: string;
  ownerUid: string;
  type: string;
  iconUrl?: string;
  description?: string;
  likes?: number;
  views?: number;
  apkUrl?: string;
  ipaUrl?: string;
  liveUrl?: string;
}

export const Showroom: React.FC<{ navigate: (view: any, context?: any) => void }> = ({ navigate }) => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الجميع');
  const [liked, setLiked] = useState<string[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [userProjects, setUserProjects] = useState<GalleryProject[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishForm, setPublishForm] = useState({
    apkUrl: '',
    ipaUrl: '',
    liveUrl: ''
  });

  useEffect(() => {
    fetchPublishedProjects();
  }, [filter]);

  const fetchPublishedProjects = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'projects'),
        where('isPublished', '==', true),
        orderBy('timestamp', 'desc'),
        limit(24)
      );

      // Map filter names to categories if stored in DB, or filter client-side.
      // For now, let's just fetch all and filter in memory if filter !== 'الجميع'
      
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryProject[];
      setProjects(fetched);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (filter === 'الجميع') return true;
    const typeMap: Record<string, ProjectType> = {
      'تطبيقات ويب': ProjectType.WEB_APP,
      'متاجر': ProjectType.STORE,
      'ألعاب': ProjectType.GAME,
      'واجهات UI': ProjectType.UI_ANALYSIS, // Using UI_ANALYSIS as UI category
      'بورتفوليو': ProjectType.WEBSITE
    };
    // Special handling for the enum values which are Arabic strings
    return p.type === typeMap[filter] || (p as any).category === filter;
  });

  const fetchUserProjects = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'projects'),
        where('ownerUid', '==', auth.currentUser.uid),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const unpublished = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((p: any) => !p.isPublished) as GalleryProject[];

      setUserProjects(unpublished);
    } catch (err) {
      console.error("Error fetching user projects:", err);
    }
  };

  const handleOpenPublish = () => {
    setShowPublishModal(true);
    fetchUserProjects();
  };

  const handlePublish = async (projectId: string) => {
    setPublishing(true);
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        isPublished: true,
        publishedAt: Date.now(),
        likes: 0,
        views: 0,
        ...publishForm
      });
      setShowPublishModal(false);
      setPublishForm({ apkUrl: '', ipaUrl: '', liveUrl: '' });
      fetchPublishedProjects();
    } catch (err) {
      console.error("Error publishing project:", err);
      alert("فشل نشر المشروع، تأكد من صلاحياتك.");
    } finally {
      setPublishing(false);
    }
  };

  const toggleLike = async (project: GalleryProject) => {
    if (!auth.currentUser) {
      alert("الرجاء تسجيل الدخول أولاً للإعجاب بالمشاريع.");
      return;
    }

    const isLiked = liked.includes(project.id);
    const newLiked = isLiked 
      ? liked.filter(id => id !== project.id) 
      : [...liked, project.id];
    
    setLiked(newLiked);
    
    // Optimistic update
    setProjects(prev => prev.map(p => 
      p.id === project.id 
        ? { ...p, likes: (p.likes || 0) + (isLiked ? -1 : 1) } 
        : p
    ));

    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        likes: (project.likes || 0) + (isLiked ? -1 : 1)
      });
    } catch (err) {
      console.error("Error updating likes:", err);
      // Revert on error
      setLiked(prev => isLiked ? [...prev, project.id] : prev.filter(id => id !== project.id));
      setProjects(prev => prev.map(p => 
        p.id === project.id 
          ? { ...p, likes: (p.likes || 0) + (isLiked ? 1 : -1) } 
          : p
      ));
    }
  };

  const handleViewProject = async (project: GalleryProject) => {
    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        views: (project.views || 0) + 1
      });
      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, views: (p.views || 0) + 1 } : p
      ));
    } catch (err) {
      console.error("Error updating views:", err);
    }
    
    // Determine the view based on project type
    // If it's a standard app built via the main builder:
    if (project.type === ProjectType.WEB_APP || project.type === ProjectType.STORE || project.type === ProjectType.GAME) {
      navigate('editApp', { project }); 
    } else if (project.type === ProjectType.UI_ANALYSIS) {
      navigate('uiRecognizer', { project });
    } else {
      navigate('editApp', { project });
    }
  };

  const handleDownload = (url: string | undefined, type: string) => {
    if (!url) {
      alert(`عذراً، لا يوجد ملف ${type} متاح حالياً لهذا المشروع.`);
      return;
    }
    // Create a temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${type.toLowerCase()}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans h-full flex flex-col overflow-hidden relative">
      {/* ... (Modal remains same) ... */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <RocketLaunchIcon className="w-6 h-6 text-indigo-500" />
                نشـر مـشـروع جـديـد
              </h2>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <p className="text-slate-400 mb-6 text-sm">اختر أحد مشاريعك لنشرها في معرض المجتمع وأضف روابط التحميل إذا وجدت.</p>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  placeholder="رابط APK (أندرويد)" 
                  value={publishForm.apkUrl}
                  onChange={e => setPublishForm({...publishForm, apkUrl: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input 
                  type="text" 
                  placeholder="رابط IPA (آيفون)" 
                  value={publishForm.ipaUrl}
                  onChange={e => setPublishForm({...publishForm, ipaUrl: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input 
                  type="text" 
                  placeholder="رابط الموقع (https://)" 
                  value={publishForm.liveUrl}
                  onChange={e => setPublishForm({...publishForm, liveUrl: e.target.value})}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {userProjects.length === 0 ? (
                <div className="text-center py-10 text-slate-500 italic">
                  لم يتم العثور على مشاريع غير منشورة...
                </div>
              ) : (
                userProjects.map(proj => (
                  <div key={proj.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center text-xl">
                        🚀
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{proj.name}</h4>
                        <p className="text-slate-400 text-xs truncate max-w-[200px]">{proj.description || 'بدون وصف'}</p>
                      </div>
                    </div>
                    <button
                      disabled={publishing}
                      onClick={() => handlePublish(proj.id)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {publishing ? 'جاري النشر...' : 'نشر المعرض'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <TrophyIcon className="w-10 h-10 text-yellow-400" />
            معرض المجتمع (Showroom)
          </h1>
          <p className="text-slate-400 mt-2 text-lg italic">استلهم، تعلم، وشارك إبداعاتك البرمجية مع العالم</p>
        </div>
        <button 
          onClick={handleOpenPublish}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 leading-none"
        >
          <PlusCircleIcon className="w-6 h-6" />
          نشر مشروعي هنا
        </button>
      </div>

      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {['الجميع', 'تطبيقات ويب', 'متاجر', 'ألعاب', 'واجهات UI', 'بورتفوليو'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-white text-indigo-900 shadow-xl' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
            <SpinnerIcon className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
            <p className="text-lg">جاري تحميل إبداعات المجتمع...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700">
             <RocketLaunchIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
             <h3 className="text-xl font-bold text-slate-400">لا توجد مشاريع في هذا القسم</h3>
             <p className="text-slate-500 mt-2">كن الأول في نشر مشروعك هنا!</p>
          </div>
        ) : filteredProjects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
            onClick={() => handleViewProject(project)}
          >
            <div className="relative aspect-video overflow-hidden bg-slate-800 flex items-center justify-center">
              {project.iconUrl ? (
                <img 
                  src={project.iconUrl} 
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-4xl transition-transform group-hover:scale-125 duration-300">🚀</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  {project.type || 'مشروع'}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-white font-bold truncate mb-1 text-lg">{project.name}</h3>
              <p className="text-slate-500 text-xs flex items-center gap-1.5 mb-4 italic truncate">
                {project.description || 'لا يوجد وصف متاح لهذا المشروع.'}
              </p>
              
              <div className="flex flex-col gap-3 mb-4">
                 <button 
                  onClick={(e) => { e.stopPropagation(); handleViewProject(project); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                 >
                    فتح المشروع
                    <ArrowLeftIcon className="w-4 h-4" />
                 </button>

                 <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDownload(project.apkUrl, 'APK');
                      }}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${project.apkUrl ? 'bg-slate-800 border-slate-700 text-green-400 hover:bg-slate-750' : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                    >
                      <AndroidIcon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold">APK</span>
                    </button>
                    
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleDownload(project.ipaUrl, 'IPA');
                      }}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${project.ipaUrl ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-750' : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                    >
                      <AppleIcon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold">IPA</span>
                    </button>

                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (project.liveUrl) window.open(project.liveUrl, '_blank');
                        else if ((project as any).publicShareId) window.open(`/shared/${(project as any).publicShareId}`, '_blank');
                        else alert('لا يوجد رابط معاينة حية حالياً لهذا المشروع.'); 
                      }}
                      className={`flex flex-col items-center justify-center py-2 rounded-xl border transition-all ${project.liveUrl || (project as any).publicShareId ? 'bg-slate-800 border-slate-700 text-purple-400 hover:bg-slate-750' : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                    >
                      <LinkExternalIcon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-bold">HTTPS</span>
                    </button>
                 </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(project); }}
                    className="flex items-center gap-1.5 transition-colors group/like"
                  >
                    {liked.includes(project.id) ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-slate-500 group-hover/like:text-red-400" />
                    )}
                    <span className={`text-xs font-bold ${liked.includes(project.id) ? 'text-red-400' : 'text-slate-500'}`}>
                      {project.likes || 0}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <EyeIcon className="w-5 h-5" />
                    <span className="text-xs font-bold">{project.views || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); alert('تم نسخ رابط المشاركة!'); }}
                    className="p-2 transition-all hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400"
                   >
                      <ShareIcon className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-4">
          <FireIcon className="w-10 h-10 text-orange-500" />
          <div>
            <h4 className="text-white font-bold">تحدي المبرمجين الأسبوعي!</h4>
            <p className="text-indigo-300/70 text-sm">أفضل مشروع يحصل على 1000 نقطة ووسام الذهب في البروفايل.</p>
          </div>
        </div>
        <button className="bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">شارك الآن</button>
      </div>
    </div>
  );
};
