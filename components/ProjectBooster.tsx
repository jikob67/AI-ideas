
import React, { useState, useEffect, useMemo } from 'react';
import { Project, View, ProjectType, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useUsage } from '../hooks/useUsage';
import { 
    SparklesIcon, RocketLaunchIcon, GlobeAltIcon, 
    ArrowRightIcon, CheckIcon, CloseIcon, SpinnerIcon, 
    Share2Icon, LockClosedIcon, FireIcon, MagnifyingGlassIcon
} from './Icons';
import { INSPIRATIONAL_PROJECTS } from '../constants/inspirationalProjects';
import { ProjectCard } from './ProjectCard';

// --- Helper Components ---

const BoostModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    project: Project | null; 
    onConfirm: () => void;
    userPoints: number;
    cost: number; 
}> = ({ isOpen, onClose, project, onConfirm, userPoints, cost }) => {
    if (!isOpen || !project) return null;
    
    const canAfford = userPoints >= cost;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-purple-500/50 rounded-2xl p-6 w-full max-w-md relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-white"><CloseIcon className="w-5 h-5"/></button>
                
                <div className="text-center mb-6 pt-4">
                    <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <RocketLaunchIcon className="w-8 h-8 text-purple-400"/>
                    </div>
                    <h3 className="text-xl font-bold text-white">تعزيز المشروع</h3>
                    <p className="text-slate-400 mt-1">اجعل مشروع "{project.name}" يظهر في مقدمة صفحة الاستكشاف للجميع.</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-300">تكلفت التعزيز:</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">{cost} <SparklesIcon className="w-4 h-4"/></span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-300">رصيدك الحالي:</span>
                        <span className={`${canAfford ? 'text-green-400' : 'text-red-400'} font-bold`}>{userPoints}</span>
                    </div>
                </div>

                <button 
                    onClick={onConfirm}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        canAfford 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/20' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {canAfford ? 'تأكيد التعزيز 🚀' : 'نقاط غير كافية'}
                </button>
            </div>
        </div>
    );
};

export const ProjectBooster: React.FC<{ navigate: (view: View, context?: any) => void }> = ({ navigate }) => {
    const { currentUser, updateUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState<'explore' | 'my-projects'>('explore');
    const [myProjects, setMyProjects] = useState<Project[]>([]);
    const [publishedProjects, setPublishedProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Modal State
    const [boostModalData, setBoostModalData] = useState<{isOpen: boolean, project: Project | null}>({ isOpen: false, project: null });
    const [feedbackMsg, setFeedbackMsg] = useState('');

    // Constants
    const BOOST_COST = 500;

    useEffect(() => {
        if (currentUser?.email) {
            const savedUserProjects: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
            setMyProjects(savedUserProjects);
            
            const localPublished: Project[] = JSON.parse(localStorage.getItem('publishedProjects') || '[]');
            
            // Ensure no duplicates if user is viewing their own published project in Explore
            const combined = [...INSPIRATIONAL_PROJECTS, ...localPublished];
            // Basic dedup by ID
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            
            // Sort: Boosted first, then by date
            unique.sort((a, b) => {
                if (a.isBoosted && !b.isBoosted) return -1;
                if (!a.isBoosted && b.isBoosted) return 1;
                return b.timestamp - a.timestamp;
            });

            setPublishedProjects(unique);
        }
    }, [currentUser, activeTab]);

    const handleTogglePublish = (project: Project) => {
        const isNowPublished = !project.isPublished;
        
        const updatedMyProjects = myProjects.map(p => 
            p.id === project.id ? { ...p, isPublished: isNowPublished } : p
        );
        setMyProjects(updatedMyProjects);
        localStorage.setItem(`appProjects_${currentUser?.email}`, JSON.stringify(updatedMyProjects));

        let localPublished: Project[] = JSON.parse(localStorage.getItem('publishedProjects') || '[]');
        if (isNowPublished) {
            localPublished.push({ ...project, isPublished: true });
        } else {
            localPublished = localPublished.filter(p => p.id !== project.id);
        }
        localStorage.setItem('publishedProjects', JSON.stringify(localPublished));

        setFeedbackMsg(isNowPublished ? 'تم نشر المشروع بنجاح!' : 'تم إلغاء النشر.');
        setTimeout(() => setFeedbackMsg(''), 3000);
    };

    const handleBoostClick = (project: Project) => {
        setBoostModalData({ isOpen: true, project });
    };

    const confirmBoost = async () => {
        const project = boostModalData.project;
        if (!project || !currentUser) return;

        if ((currentUser.points || 0) < BOOST_COST) {
            alert("لا توجد نقاط كافية!");
            return;
        }

        await updateUser({ points: (currentUser.points || 0) - BOOST_COST });

        const updatedProject = { 
            ...project, 
            isBoosted: true, 
            boostEndDate: Date.now() + (7 * 24 * 60 * 60 * 1000)
        };

        const updatedMyProjects = myProjects.map(p => p.id === project.id ? updatedProject : p);
        setMyProjects(updatedMyProjects);
        localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedMyProjects));

        if (project.isPublished) {
            let localPublished: Project[] = JSON.parse(localStorage.getItem('publishedProjects') || '[]');
            localPublished = localPublished.map(p => p.id === project.id ? updatedProject : p);
            localStorage.setItem('publishedProjects', JSON.stringify(localPublished));
        }

        setBoostModalData({ isOpen: false, project: null });
        setFeedbackMsg('🚀 تم تعزيز المشروع بنجاح!');
        setTimeout(() => setFeedbackMsg(''), 3000);
    };

    const copyToClipboard = async (project: Project) => {
        try {
             await navigator.clipboard.writeText(`${project.name}\n${project.description}`);
             setFeedbackMsg('تم نسخ تفاصيل المشروع للحافظة');
        } catch (err) {
             setFeedbackMsg('فشل النسخ للحافظة');
        }
        setTimeout(() => setFeedbackMsg(''), 2000);
    };

    const handleShare = async (project: Project) => {
        if (!navigator.share) {
            copyToClipboard(project);
            return;
        }

        const shareData: ShareData = {
            title: project.name,
            text: project.description,
        };

        // Safe check for valid URL protocol before sharing URL
        if (window.location.protocol.startsWith('http')) {
            shareData.url = window.location.href;
        }

        try {
            await navigator.share(shareData);
            if (currentUser) {
               await updateUser({ points: (currentUser.points || 0) + 10 });
            }
        } catch (err: any) {
            console.warn('Share API error:', err);
            // Fallback to clipboard if share fails (e.g. invalid URL or permission denied)
            copyToClipboard(project);
        }
    };

    const handleEdit = (project: Project) => {
        // Determine the correct builder view based on the project's creation mode
        // Default to 'ideaToCode' if not specified, ensuring we open a specific builder
        const targetView = project.creationMode || 'ideaToCode';

        const isMine = myProjects.some(p => p.id === project.id);
        
        if (isMine) {
            navigate(targetView, { project });
        } else {
            const newProject: Project = {
                ...project,
                id: `copy-${project.id}-${Date.now()}`,
                name: `${project.name} (نسخة)`,
                ownerEmail: currentUser?.email,
                timestamp: Date.now(),
                isPublished: false,
                isBoosted: false,
                creationMode: targetView // Preserve the correct creation mode for the copy
            };
            
            const updatedUserProjects = [newProject, ...myProjects];
            setMyProjects(updatedUserProjects);
            localStorage.setItem(`appProjects_${currentUser?.email}`, JSON.stringify(updatedUserProjects));
            
            navigate(targetView, { project: newProject });
        }
    };

    const filteredList = useMemo(() => {
        const source = activeTab === 'explore' ? publishedProjects : myProjects;
        return source.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [activeTab, publishedProjects, myProjects, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white animate-fade-in">
            {/* Header */}
            <header className="flex-shrink-0 p-6 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <RocketLaunchIcon className="w-8 h-8 text-indigo-500"/>
                            معزز المشاريع
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">اكتشف مشاريع ملهمة، انشر إبداعاتك، وعزز وصولك.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button 
                            onClick={() => setActiveTab('explore')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'explore' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            استكشاف
                        </button>
                        <button 
                            onClick={() => setActiveTab('my-projects')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'my-projects' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            مشاريعي
                        </button>
                    </div>
                </div>
                
                <div className="mt-6 relative max-w-xl mx-auto">
                    <input 
                        type="text" 
                        placeholder="ابحث عن مشاريع..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-3 pl-4 pr-12 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"/>
                </div>
            </header>

            {/* Content */}
            <main className="flex-grow overflow-y-auto p-6">
                {feedbackMsg && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg z-50 animate-fade-in-up">
                        {feedbackMsg}
                    </div>
                )}

                {filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <GlobeAltIcon className="w-16 h-16 mb-4 opacity-20"/>
                        <p>لا توجد مشاريع لعرضها.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredList.map(project => (
                            <div key={project.id} className={`relative bg-slate-800 border ${project.isBoosted ? 'border-purple-500/50 shadow-purple-900/20 shadow-xl' : 'border-slate-700'} rounded-xl overflow-hidden transition-all hover:transform hover:-translate-y-1 group`}>
                                {project.isBoosted && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                                        <FireIcon className="w-3 h-3"/> مميز
                                    </div>
                                )}
                                
                                {/* Project Preview/Icon Area */}
                                <div className="h-40 bg-slate-700/50 relative overflow-hidden flex items-center justify-center">
                                    {project.iconUrl ? (
                                        <>
                                            <img src={project.iconUrl} alt={project.name} className="w-full h-full object-cover opacity-50 blur-sm absolute inset-0" />
                                            <img src={project.iconUrl} alt={project.name} className="w-20 h-20 rounded-xl object-cover shadow-lg relative z-10" />
                                        </>
                                    ) : (
                                        <div className="w-20 h-20 bg-slate-600 rounded-xl flex items-center justify-center relative z-10">
                                            <SparklesIcon className="w-10 h-10 text-slate-400"/>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-white text-lg truncate">{project.name}</h3>
                                    <p className="text-slate-400 text-xs mb-3">{project.type}</p>
                                    <p className="text-slate-300 text-sm line-clamp-2 h-10 mb-4">{project.description}</p>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                        <div className="flex gap-2">
                                            {activeTab === 'my-projects' ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleTogglePublish(project)}
                                                        className={`p-2 rounded-lg transition-colors ${project.isPublished ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                                        title={project.isPublished ? "إلغاء النشر" : "نشر للعامة"}
                                                    >
                                                        {project.isPublished ? <GlobeAltIcon className="w-5 h-5"/> : <LockClosedIcon className="w-5 h-5"/>}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleBoostClick(project)}
                                                        className={`p-2 rounded-lg transition-colors ${project.isBoosted ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700 text-slate-400 hover:bg-purple-500/20 hover:text-purple-400'}`}
                                                        title="تعزيز المشروع"
                                                        disabled={project.isBoosted}
                                                    >
                                                        <RocketLaunchIcon className="w-5 h-5"/>
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-500 py-2">بواسطة: {project.ownerEmail ? project.ownerEmail.split('@')[0] : 'AI Agent'}</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button onClick={() => handleShare(project)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                <Share2Icon className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(project)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1 transition-colors"
                                            >
                                                {activeTab === 'my-projects' ? 'تعديل' : 'نسخ وتعديل'} <ArrowRightIcon className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            <BoostModal 
                isOpen={boostModalData.isOpen} 
                onClose={() => setBoostModalData({ isOpen: false, project: null })} 
                project={boostModalData.project}
                onConfirm={confirmBoost}
                userPoints={currentUser?.points || 0}
                cost={BOOST_COST}
            />
        </div>
    );
};
