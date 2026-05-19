import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FireIcon, 
  EyeIcon, 
  HeartIcon, 
  ShareIcon,
  PlusIcon,
  RocketLaunchIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  AppleIcon,
  AndroidIcon,
  LinkExternalIcon,
  HeartSolidIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  XMarkIcon,
  SpinnerIcon
} from './Icons';

import { collection, query, getDocs, limit, orderBy, where, updateDoc, doc, increment } from 'firebase/firestore';
import { db, auth } from '../firebase';
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

export const Showroom: React.FC<{ navigate: (view: any, context?: any) => void; context?: any }> = ({ navigate, context }) => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الجميع');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'views'>('newest');
  const [liked, setLiked] = useState<string[]>([]);
  useEffect(() => {
    const savedLiked = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('liked_')) {
        savedLiked.push(key.replace('liked_', ''));
      }
    }
    setLiked(savedLiked);
  }, []);
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
    if (context?.project) {
      setShowPublishModal(true);
      fetchUserProjects();
    }
  }, [filter, context]);

  const fetchPublishedProjects = async () => {
    setLoading(true);
    try {
      let q = query(
        collection(db, 'projects'),
        where('isPublished', '==', true),
        orderBy(sortBy === 'newest' ? 'publishedAt' : sortBy, 'desc'),
        limit(48)
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
    const matchesFilter = filter === 'الجميع' || p.type === filter || (p as any).category === filter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
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
    if (!auth.currentUser) {
      alert("الرجاء تسجيل الدخول أولاً لتتمكن من نشر مشاريعك.");
      return;
    }
    setShowPublishModal(true);
    fetchUserProjects();
  };

  const handlePublish = async (projectId: string) => {
    if (!auth.currentUser) return;
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
      alert("تم نشر مشروعك بنجاح في معرض المجتمع!");
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
    if (!isLiked) {
      localStorage.setItem(`liked_${project.id}`, 'true');
    } else {
      localStorage.removeItem(`liked_${project.id}`);
    }
    
    // Optimistic update
    setProjects(prev => prev.map(p => 
      p.id === project.id 
        ? { ...p, likes: (p.likes || 0) + (isLiked ? -1 : 1) } 
        : p
    ));

    try {
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        likes: increment(isLiked ? -1 : 1)
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
        views: increment(1)
      });
      setProjects(prev => prev.map(p => 
        p.id === project.id ? { ...p, views: (p.views || 0) + 1 } : p
      ));
    } catch (err) {
      console.error("Error updating views:", err);
    }
    
    // Determine the view based on project type
    // New requirement: Redirect all showroom "Open Project" clicks to the Preview section
    navigate('preview', { project });
  };

  const handleDownload = (url: string | undefined, type: string) => {
    if (!url) {
      alert(`عذراً، لا يوجد ملف ${type} متاح حالياً لهذا المشروع.`);
      return;
    }
    
    // Safety check for URL to prevent XSS
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('تم اكتشاف رابط غير آمن، لا يمكن التحميل.');
      return;
    }

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12 animate-fade-in">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <TrophyIcon className="w-10 h-10 text-yellow-400" />
            معرض المبدعين
          </h1>
          <p className="text-slate-400 mt-2 text-lg">استكشف وساهم في مشاريع تم بناؤها بالذكاء الاصطناعي</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <button 
                onClick={handleOpenPublish}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-8 rounded-2xl shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 leading-none"
            >
                <PlusIcon className="w-6 h-6" />
                انشر مشروعك
            </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-3xl border border-slate-800 mb-8">
        <div className="relative w-full lg:w-96 group">
          <MagnifyingGlassIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="ابحث عن مشاريع ملهمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl py-2.5 pr-12 pl-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-hide">
          {['الجميع', 'تطبيقات ويب', 'متاجر', 'ألعاب', 'واجهات UI', 'بورتفوليو'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold flex-shrink-0 transition-all ${
                filter === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl w-full lg:w-auto justify-center">
            {[
                { id: 'newest', label: 'الأحدث' },
                { id: 'likes', label: 'الأكثر إعجاباً' },
                { id: 'views', label: 'الأكثر مشاهدة' }
            ].map(s => (
                <button
                    key={s.id}
                    onClick={() => setSortBy(s.id as any)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === s.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    {s.label}
                </button>
            ))}
        </div>
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
            className="group bg-slate-900/60 rounded-[2rem] overflow-hidden border border-slate-800 hover:border-indigo-500/40 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-[420px]"
            onClick={() => handleViewProject(project)}
          >
            <div className="relative h-48 overflow-hidden bg-slate-800">
              {project.iconUrl ? (
                <img 
                   src={project.iconUrl} 
                   alt={project.name}
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <RocketLaunchIcon className="w-12 h-12 text-slate-700 mb-2 opacity-50" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Preview</span>
                </div>
              )}
              
              <div className="absolute top-4 left-4 flex gap-2">
                 <div className="bg-slate-950/80 backdrop-blur-md text-indigo-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-indigo-500/20 shadow-xl flex items-center gap-1.5 uppercase tracking-tighter">
                    <SparklesIcon className="w-3 h-3" />
                    AI Build
                 </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-4 right-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">
                {project.type || 'عام'}
              </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-white font-bold text-xl mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">{project.name}</h3>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6 flex-1">
                {project.description || 'هذا المشروع تم إنشاؤه ووصفه بدقة عالية باستخدام تقنيات الذكاء الاصطناعي المتقدمة لتوفير حلول مبتكرة.'}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(project); }}
                    className={`flex items-center gap-1.5 transition-all ${liked.includes(project.id) ? 'text-pink-500 font-bold scale-110' : 'text-slate-500 hover:text-pink-400'}`}
                  >
                    {liked.includes(project.id) ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                    <span className="text-sm">{project.likes || 0}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <EyeIcon className="w-5 h-5" />
                    <span className="text-sm">{project.views || 0}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                   <button 
                      onClick={(e) => { e.stopPropagation(); handleViewProject(project); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/40"
                   >
                     معاينة
                   </button>
                   <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const shareUrl = `${window.location.origin}/shared/${(project as any).publicShareId || project.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert('تم نسخ الرابط!'); 
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-indigo-400 transition-all border border-slate-700"
                   >
                      <ShareIcon className="w-4 h-4" />
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
