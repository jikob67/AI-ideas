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
  ChatBubbleLeftRightIcon
} from './Icons';
const HeartSolidIcon = HeartIcon;

import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { SpinnerIcon } from './Icons';

interface GalleryProject {
  id: string;
  name: string;
  ownerUid: string;
  type: string;
  icon?: string;
  description?: string;
  likes?: number;
  views?: number;
}

export const Showroom: React.FC = () => {
  const [projects, setProjects] = useState<GalleryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('الجميع');
  const [liked, setLiked] = useState<string[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'projects'),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
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

    fetchProjects();
  }, []);

  const toggleLike = (id: string) => {
    if (liked.includes(id)) {
      setLiked(liked.filter(i => i !== id));
    } else {
      setLiked([...liked, id]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans h-full flex flex-col overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white flex items-center gap-3">
            <TrophyIcon className="w-10 h-10 text-yellow-400" />
            معرض المجتمع (Showroom)
          </h1>
          <p className="text-slate-400 mt-2 text-lg italic">استلهم، تعلم، وشارك إبداعاتك البرمجية مع العالم</p>
        </div>
        <button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-3 transition-all transform hover:scale-105 active:scale-95 leading-none">
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
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-700">
             <RocketLaunchIcon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
             <h3 className="text-xl font-bold text-slate-400">لا توجد مشاريع منشورة بعد</h3>
             <p className="text-slate-500 mt-2">كن الأول في نشر مشروعك في المعرض!</p>
          </div>
        ) : projects.map((project, idx) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
          >
            <div className="relative aspect-video overflow-hidden bg-slate-800 flex items-center justify-center">
              {project.icon ? (
                <img 
                  src={project.icon} 
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="text-4xl">🚀</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
              <div className="absolute top-4 right-4 group-hover:block hidden transition-all">
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20">
                   <RocketLaunchIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                  {project.type === 'app' ? 'تطبيق ويب' : 'موقع إلكتروني'}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="text-white font-bold truncate mb-1 text-lg">{project.name}</h3>
              <p className="text-slate-500 text-xs flex items-center gap-1.5 mb-4 italic truncate">
                {project.description || 'لا يوجد وصف متاح لهذا المشروع.'}
              </p>
              
              <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleLike(project.id)}
                    className="flex items-center gap-1.5 transition-colors group/like"
                  >
                    {liked.includes(project.id) ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-slate-500 group-hover/like:text-red-400" />
                    )}
                    <span className={`text-xs font-bold ${liked.includes(project.id) ? 'text-red-400' : 'text-slate-500'}`}>
                      {(project.likes || 0) + (liked.includes(project.id) ? 1 : 0)}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <EyeIcon className="w-5 h-5" />
                    <span className="text-xs font-bold">{project.views || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-2 transition-all hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400">
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
