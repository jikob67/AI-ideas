
import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { Project, SectionType } from '../types';
import { 
    BriefcaseIcon, CodeIcon, DotsVerticalIcon, TrashIcon, RectangleStackIcon, 
    ArrowDownTrayIcon, ArrowRightIcon, Share2Icon, FlutterIcon, FolderPlusIcon,
    PencilIcon, LinkIcon, UserIcon, GlobeAltIcon, CloseIcon, MagnifyingGlassIcon
} from './Icons';
import { useAuth } from '../hooks/useAuth';
import { persistenceService } from '../services/persistenceService';
import { generateFlutterCode, simulateFullBuild } from '../services/flutterService';
import { getBlob, deleteBlob, saveBlob } from '../services/storageService';
import { SECTIONS } from './Sidebar';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectCardProps {
    project: Project;
    onDelete: (id: string, skipConfirm?: boolean) => void;
    onEdit: (project: Project) => void;
    onUpdate: (project: Project) => void;
    categories: string[];
    onAddCategory: (name: string) => void;
}

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'حذف', isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <TrashIcon className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-grow">
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-slate-400 mt-2">{message}</p>
            </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
                إلغاء
            </button>
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-red-400"
            >
                {isLoading ? 'جاري...' : confirmText}
            </button>
        </div>
      </div>
    </div>
  );
};


const ShareModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    onUpdate: (project: Project) => void;
}> = ({ isOpen, onClose, project, onUpdate }) => {
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState<'view' | 'edit'>('view');
    const [copySuccess, setCopySuccess] = useState(false);

    if (!isOpen) return null;

    const handleAddUser = () => {
        if (!email) return;
        const sharedWith = project.sharedWith || [];
        if (sharedWith.some(s => s.email === email)) return;
        
        const updatedProject = {
            ...project,
            sharedWith: [...sharedWith, { email, permission }]
        };
        onUpdate(updatedProject);
        setEmail('');
    };

    const handleRemoveUser = (emailToRemove: string) => {
        const updatedProject = {
            ...project,
            sharedWith: (project.sharedWith || []).filter(s => s.email !== emailToRemove)
        };
        onUpdate(updatedProject);
    };

    const generatePublicLink = () => {
        const shareId = Math.random().toString(36).substring(2, 15);
        const updatedProject = {
            ...project,
            publicShareId: shareId
        };
        onUpdate(updatedProject);
    };

    const revokePublicLink = () => {
        const updatedProject = {
            ...project,
            publicShareId: ''
        };
        onUpdate(updatedProject);
    };

    const copyLink = () => {
        const link = `${window.location.origin}/share/${project.publicShareId}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">مشاركة المشروع</h3>
                
                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">مشاركة مع مستخدم (بريد إلكتروني)</label>
                    <div className="flex gap-2">
                        <input 
                            type="email" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="example@mail.com"
                            className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
                        />
                        <select 
                            value={permission}
                            onChange={e => setPermission(e.target.value as any)}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-sm outline-none"
                        >
                            <option value="view">مشاهدة</option>
                            <option value="edit">تعديل</option>
                        </select>
                        <button onClick={handleAddUser} className="bg-indigo-600 px-3 py-2 rounded-lg text-sm font-bold">إضافة</button>
                    </div>
                </div>

                {project.sharedWith && project.sharedWith.length > 0 && (
                    <div className="mb-6 max-h-32 overflow-y-auto border-t border-slate-700 pt-4">
                        {project.sharedWith.map(s => (
                            <div key={s.email} className="flex items-center justify-between mb-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-slate-400" />
                                    <span>{s.email}</span>
                                    <span className="text-xs text-slate-500">({s.permission === 'view' ? 'مشاهدة' : 'تعديل'})</span>
                                </div>
                                <button onClick={() => handleRemoveUser(s.email)} className="text-red-400 hover:text-red-300">إزالة</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t border-slate-700 pt-4">
                    <label className="block text-sm text-slate-400 mb-2">رابط عام</label>
                    {project.publicShareId ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <input 
                                    readOnly 
                                    value={`${window.location.origin}/share/${project.publicShareId}`}
                                    className="flex-grow bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400 outline-none"
                                />
                                <button onClick={copyLink} className="bg-slate-700 px-3 py-2 rounded-lg text-sm flex items-center gap-1">
                                    <LinkIcon className="w-4 h-4" />
                                    {copySuccess ? 'تم النسخ' : 'نسخ'}
                                </button>
                            </div>
                            <button onClick={revokePublicLink} className="text-sm text-red-400 hover:text-red-300 self-start mt-1">جعل الرابط خاص</button>
                        </div>
                    ) : (
                        <button onClick={generatePublicLink} className="w-full bg-slate-700 py-2 rounded-lg text-sm font-bold">إنشاء رابط عام</button>
                    )}
                </div>

                <button onClick={onClose} className="w-full mt-6 py-2 border border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-700">إغلاق</button>
            </div>
        </div>
    );
};


export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onEdit, onUpdate, categories, onAddCategory }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isFlutterLoading, setIsFlutterLoading] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [apkUrl, setApkUrl] = useState<string | undefined>(project.apkUrl);
    const [ipaUrl, setIpaUrl] = useState<string | undefined>(project.ipaUrl);
    const menuRef = useRef<HTMLDivElement>(null);
    const { currentUser, updateUser } = useAuth();

    useEffect(() => {
        const loadBlobs = async () => {
            if (project.apkBlobId && !apkUrl) {
                const blob = await getBlob(project.apkBlobId);
                if (blob) setApkUrl(URL.createObjectURL(blob));
            }
            if (project.ipaBlobId && !ipaUrl) {
                const blob = await getBlob(project.ipaBlobId);
                if (blob) setIpaUrl(URL.createObjectURL(blob));
            }
        };
        loadBlobs();
    }, [project.apkBlobId, project.ipaBlobId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteClick = () => {
        setIsMenuOpen(false);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (project.apkBlobId) await deleteBlob(project.apkBlobId);
        if (project.ipaBlobId) await deleteBlob(project.ipaBlobId);
        onDelete(project.id, true);
        setIsDeleteConfirmOpen(false);
    };

    const handleExportProject = async () => {
        try {
            let files = (project as any).files;
            if (!files || files.length === 0) {
                files = await persistenceService.getProjectFiles(project.id);
            }
            const fullProject = { ...project, files };
            const projectJson = JSON.stringify(fullProject, null, 2);
            const blob = new Blob([projectJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name.replace(/\s+/g, '_')}_export.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("فشل تصدير المشروع.");
        }
        setIsMenuOpen(false);
    };

    const handleDownloadProjectZip = async () => {
        setIsMenuOpen(false);
        const zip = new JSZip();

        let files = (project as any).files;
        if (!files || files.length === 0) {
            // Try fetching from subcollection
            files = await persistenceService.getProjectFiles(project.id);
        }

        if (files && files.length > 0) {
            files.forEach((file: any) => {
                zip.file(file.name, file.content);
            });
        } else {
             alert("لا توجد ملفات كود مرتبطة بهذا المشروع لتنزيلها.");
             return;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${project.name.replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const handleDuplicateProject = async () => {
        setIsMenuOpen(false);
        if (!currentUser?.email) return;

        try {
            // Get files
            let projectFiles = (project as any).files;
            if (!projectFiles || projectFiles.length === 0) {
                projectFiles = await persistenceService.getProjectFiles(project.id);
            }

            // Get messages
            let projectMessages = (project as any).messages;
            if (!projectMessages || projectMessages.length === 0) {
                projectMessages = await persistenceService.getProjectMessages(project.id);
            }

            const newId = `proj-dup-${Date.now()}`;
            const newProject = {
                ...JSON.parse(JSON.stringify(project)), // Deep copy metadata
                id: newId,
                name: `${project.name} (نسخة)`,
                timestamp: Date.now(),
                ownerUid: currentUser.uid,
                ownerEmail: currentUser.email,
                files: projectFiles,
                builderChat: projectMessages
            };

            // Save via persistence service
            await persistenceService.fullProjectSave(newProject, projectFiles, projectMessages);
            
            alert("تم تكرار المشروع بنجاح سيظهر الآن في لوحة التحكم.");
            window.location.reload(); // Refresh to see the new project
        } catch (error) {
            console.error("Duplicate failed:", error);
            alert("فشل تكرار المشروع.");
        }
    };

    const handleShare = () => {
        setIsMenuOpen(false);
        setIsShareModalOpen(true);
    };

    const handleConvertToFlutter = async () => {
        setIsMenuOpen(false);
        setIsFlutterLoading(true);
        try {
            let files = (project as any).files;
            if (!files || files.length === 0) {
                files = await persistenceService.getProjectFiles(project.id);
            }
            
            const tempProject = { ...project, files };
            const dartCode = await generateFlutterCode(tempProject as any);
            const { apkBlob, projectZip } = await simulateFullBuild(tempProject as any);
            
            const timestamp = Date.now();
            const zipBlobId = `zip-${timestamp}`;
            
            // Upload once and reuse if identical
            const zipUrl = await saveBlob(zipBlobId, projectZip);
            
            let finalApkUrl = zipUrl;
            let finalIpaUrl = zipUrl;
            let apkBlobId = zipBlobId;
            let ipaBlobId = zipBlobId;

            setApkUrl(finalApkUrl);
            setIpaUrl(finalIpaUrl);

            const updatedProjectMetadata = {
                ...project,
                flutterProjectUrl: zipUrl,
                apkUrl: finalApkUrl,
                ipaUrl: finalIpaUrl,
                apkBlobId,
                ipaBlobId,
                zipBlobId,
            };

            const newFile = { name: 'main.dart', language: 'dart', content: dartCode };
            
            // Save metadata
            await persistenceService.saveProjectMetadata(updatedProjectMetadata as any);
            // Save new file
            await persistenceService.saveFile(project.id, newFile);

            onUpdate(updatedProjectMetadata as any);
            alert("تم تحويل المشروع إلى Flutter بنجاح! تم حفظ التطبيقات بشكل دائم في مشروعك.");
        } catch (error) {
            console.error("Flutter conversion failed:", error);
            alert("فشل تحويل المشروع إلى Flutter.");
        } finally {
            setIsFlutterLoading(false);
        }
    };

    const handleTransfer = async (sectionId: string) => {
        const globalNavigate = (window as any).__appNavigate;
        if (globalNavigate) {
            let fullProject = { ...project };
            
            // 1. Try to find the full project from localStorage
            if (currentUser?.email) {
                const key = `appProjects_${currentUser.email}`;
                const savedApps: Project[] = JSON.parse(localStorage.getItem(key) || '[]');
                const foundLocal = savedApps.find(p => p.id === project.id);
                if (foundLocal) {
                    fullProject = { ...fullProject, ...foundLocal };
                }
            }
            
            // 2. If it still lacks files but database is available and user is authenticated
            if ((!fullProject.files || fullProject.files.length === 0) && currentUser?.uid) {
                try {
                    const dbFiles = await persistenceService.getProjectFiles(project.id);
                    if (dbFiles && dbFiles.length > 0) {
                        fullProject.files = dbFiles;
                    }
                } catch (e) {
                    console.error("Failed to load files for full project transfer:", e);
                }
                try {
                    const dbMsgs = await persistenceService.getProjectMessages(project.id);
                    if (dbMsgs && dbMsgs.length > 0) {
                        fullProject.builderChat = dbMsgs;
                    }
                } catch (e) {
                    console.error("Failed to load messages for full project transfer:", e);
                }
            }

            // 3. Fallback: if files empty, set default basic files
            if (!fullProject.files || fullProject.files.length === 0) {
                fullProject.files = [
                    { name: 'index.html', language: 'html', content: '<h1>' + fullProject.name + '</h1>' },
                    { name: 'style.css', language: 'css', content: 'body { font-family: sans-serif; }' },
                    { name: 'script.js', language: 'javascript', content: 'console.log("Loaded");' }
                ];
            }
            
            globalNavigate(sectionId, { project: fullProject });
        }
        setIsTransferOpen(false);
        setSearchQuery('');
    };

    const filteredSections = useMemo(() => {
        return SECTIONS.filter(section =>
            section.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.desc.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    const sectionsCount = useMemo(() => {
        return project.sections?.length || 0;
    }, [project.sections]);

    return (
        <>
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-indigo-500/50 transition-all duration-300">
                <div>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {project.iconUrl ? (
                                <img src={project.iconUrl} alt={`${project.name} icon`} className="w-12 h-12 rounded-lg object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center"><BriefcaseIcon className="w-6 h-6 text-indigo-400"/></div>
                            )}
                            <div>
                                <h4 className="font-bold text-md text-slate-200 truncate">{project.name}</h4>
                                <p className="text-xs text-slate-400">{project.type}</p>
                            </div>
                        </div>
                         <div className="relative" ref={menuRef}>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700"><DotsVerticalIcon className="w-5 h-5"/></button>
                            {isMenuOpen && (
                                <div className="kebab-menu-dropdown">
                                    <button onClick={() => onEdit(project)} className="kebab-menu-item"><PencilIcon className="w-4 h-4"/>تعديل</button>
                                    <button onClick={handleDuplicateProject} className="kebab-menu-item"><RectangleStackIcon className="w-4 h-4"/>تكرار</button>
                                    <button onClick={handleExportProject} className="kebab-menu-item"><ArrowDownTrayIcon className="w-4 h-4"/>تصدير JSON</button>
                                    <button onClick={handleDownloadProjectZip} className="kebab-menu-item"><CodeIcon className="w-4 h-4"/>تنزيل ZIP</button>
                                    <button onClick={handleConvertToFlutter} disabled={isFlutterLoading} className="kebab-menu-item text-blue-400">
                                        <FlutterIcon className="w-4 h-4"/>
                                        {isFlutterLoading ? 'جاري التحويل...' : 'تحويل إلى تطبيق (Flutter)'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsTransferOpen(true);
                                        }} 
                                        className="kebab-menu-item w-full"
                                    >
                                        <FolderPlusIcon className="w-4 h-4"/>نقل إلى قسم
                                    </button>
                                    <button onClick={handleShare} className="kebab-menu-item"><Share2Icon className="w-4 h-4"/>مشاركة</button>
                                    <div className="my-1 h-px bg-slate-700"></div>
                                    <button onClick={handleDeleteClick} className="kebab-menu-item text-red-400"><TrashIcon className="w-4 h-4"/>حذف</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px]">{project.description}</p>
                    <div className="text-xs text-slate-500 mt-2">
                        آخر تحديث: {new Date(project.timestamp).toLocaleDateString('ar-EG')}
                    </div>
                </div>
                <div className="flex flex-col gap-2 mt-4 border-t border-slate-700 pt-3">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                            {project.flutterProjectUrl && (
                                <a 
                                    href={project.flutterProjectUrl} 
                                    download={`${project.name.replace(/\s+/g, '_')}_flutter_project.zip`}
                                    className="text-[10px] bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors flex items-center gap-1"
                                >
                                    <FlutterIcon className="w-3 h-3" />
                                    مشروع Flutter
                                </a>
                            )}
                            {project.lastDeploymentUrl && (
                                <a 
                                    href={project.lastDeploymentUrl} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded border border-indigo-600/30 hover:bg-indigo-600/30 transition-colors flex items-center gap-1"
                                >
                                    <GlobeAltIcon className="w-3 h-3" />
                                    زيارة المشروع
                                </a>
                            )}
                        </div>
                        <button onClick={() => onEdit(project)} className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5">
                           <ArrowRightIcon className="w-4 h-4" />
                           فتح المحرر
                        </button>
                    </div>
                </div>
            </div>
            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                project={project} 
                onUpdate={onUpdate} 
            />
            <ConfirmationModal
                isOpen={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title={`حذف "${project.name}"`}
                message="هل أنت متأكد؟ سيتم نقل المشروع إلى سلة المهملات."
            />
            {/* Transfer System Modal */}
            <AnimatePresence>
                {isTransferOpen && (
                    <div 
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans text-right" 
                        id={`transfer-modal-overlay-${project.id}`} 
                        dir="rtl" 
                        onClick={() => setIsTransferOpen(false)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-right" 
                            onClick={e => e.stopPropagation()}
                            id={`transfer-modal-card-${project.id}`}
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 flex items-center gap-2">
                                        نظام النقل الذكي بين الأقسام
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                                        هل ترغب في تغيير طريقتك؟ يمكنك مواصلة العمل على نفس المحتوى والسياق الحالي لكن عبر الانتقال فورا إلى ميزة أو قسم فني آخر.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setIsTransferOpen(false)} 
                                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all self-start md:self-auto"
                                    id={`close-transfer-btn-${project.id}`}
                                >
                                    <CloseIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Control */}
                            <div className="p-4 bg-slate-900 border-b border-slate-800/60">
                                <div className="relative max-w-md mx-auto">
                                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-500">
                                        <MagnifyingGlassIcon className="w-5 h-5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="ابحث عن القسم أو الأداة..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-indigo-500/80 rounded-2xl py-3 pr-10 pl-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 transition-all text-right font-sans"
                                        id={`transfer-search-input-${project.id}`}
                                    />
                                    {searchQuery && (
                                        <button 
                                            onClick={() => setSearchQuery('')}
                                            className="absolute inset-y-0 left-3 flex items-center text-slate-500 hover:text-white text-xs"
                                        >
                                            مسح
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Grid of Sections */}
                            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar bg-slate-900/40">
                                {filteredSections.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id={`transfer-sections-grid-${project.id}`}>
                                        {filteredSections.map((section) => {
                                            const IconComponent = section.Icon;
                                            const activeView = (window as any).__activeView || '';
                                            const isCurrent = activeView === section.id;
                                            
                                            return (
                                                <button
                                                    key={section.id}
                                                    onClick={() => handleTransfer(section.id)}
                                                    className={`group text-right p-4 rounded-2xl border text-slate-300 transition-all flex flex-col justify-between h-[135px] duration-300 ${
                                                        isCurrent 
                                                            ? 'bg-indigo-600/10 border-indigo-500 ring-2 ring-indigo-500/20' 
                                                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/80 hover:-translate-y-1'
                                                    }`}
                                                    id={`transfer-item-${section.id}-${project.id}`}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className={`p-2 rounded-xl ${section.bg} ${section.color} group-hover:scale-110 transition-transform duration-300`}>
                                                            <IconComponent className="w-5 h-5" />
                                                        </div>
                                                        {isCurrent && (
                                                            <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-bold">القسم الحالي</span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <h4 className="text-white font-bold text-xs group-hover:text-indigo-300 transition-colors font-sans">{section.label}</h4>
                                                        <p className="text-[10px] text-slate-500 leading-normal mt-1 line-clamp-2 group-hover:text-slate-400 transition-colors font-sans">{section.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12" id="no-sections-found">
                                        <p className="text-slate-500 text-sm font-sans">عذراً، لم نتمكن من العثور على أي قسم يطابق بحثك.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Banner */}
                            <div className="bg-slate-950 p-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-sans">
                                <span>نظام نقل السياق الذكي v1.1</span>
                                <span>اختر القسم لتوجيه فكرتك أو كودك الحالي إليه فوراً</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};