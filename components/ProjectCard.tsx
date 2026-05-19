
import React, { useState, useRef, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { Project, SectionType } from '../types';
import { 
    BriefcaseIcon, CodeIcon, DotsVerticalIcon, TrashIcon, RectangleStackIcon, 
    ArrowDownTrayIcon, ArrowRightIcon, Share2Icon, FlutterIcon, FolderPlusIcon,
    PencilIcon, LinkIcon, UserIcon
} from './Icons';
import { useAuth } from '../hooks/useAuth';
import { persistenceService } from '../services/persistenceService';
import { generateFlutterCode, simulateFullBuild } from '../services/flutterService';
import { getBlob, deleteBlob, saveBlob } from '../services/storageService';

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
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [apkUrl, setApkUrl] = useState<string | undefined>(project.apkUrl);
    const [ipaUrl, setIpaUrl] = useState<string | undefined>(project.ipaUrl);
    const menuRef = useRef<HTMLDivElement>(null);
    const categoryMenuRef = useRef<HTMLDivElement>(null);
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
            if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
                setIsCategoryMenuOpen(false);
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
            const { apkBlob, ipaBlob } = await simulateFullBuild();
            
            const apkBlobId = `apk-${Date.now()}`;
            const ipaBlobId = `ipa-${Date.now()}`;
            
            await saveBlob(apkBlobId, apkBlob);
            await saveBlob(ipaBlobId, ipaBlob);

            const apkUrl = URL.createObjectURL(apkBlob);
            const ipaUrl = URL.createObjectURL(ipaBlob);

            setApkUrl(apkUrl);
            setIpaUrl(ipaUrl);

            const updatedProjectMetadata = {
                ...project,
                flutterProjectUrl: 'source_code_generated',
                apkUrl,
                ipaUrl,
                apkBlobId,
                ipaBlobId,
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

    const handleMoveToCategory = (category: string) => {
        onUpdate({ ...project, category });
        setIsCategoryMenuOpen(false);
        setIsMenuOpen(false);
    };

    const handleCreateAndMoveToCategory = () => {
        if (!newCategoryName) return;
        onAddCategory(newCategoryName);
        onUpdate({ ...project, category: newCategoryName });
        setNewCategoryName('');
        setIsCategoryMenuOpen(false);
        setIsMenuOpen(false);
    };

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
                                    <div className="relative" ref={categoryMenuRef}>
                                        <button onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)} className="kebab-menu-item w-full">
                                            <FolderPlusIcon className="w-4 h-4"/>نقل إلى قسم
                                        </button>
                                        {isCategoryMenuOpen && (
                                            <div className="absolute left-full top-0 ml-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 w-48 z-[70]">
                                                {categories.map(cat => (
                                                    <button key={cat} onClick={() => handleMoveToCategory(cat)} className="w-full text-right px-3 py-2 hover:bg-slate-700 rounded-md text-sm truncate">
                                                        {cat}
                                                    </button>
                                                ))}
                                                <div className="mt-2 pt-2 border-t border-slate-700">
                                                    <input 
                                                        type="text" 
                                                        value={newCategoryName}
                                                        onChange={e => setNewCategoryName(e.target.value)}
                                                        placeholder="قسم جديد..."
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs mb-1"
                                                    />
                                                    <button onClick={handleCreateAndMoveToCategory} className="w-full bg-indigo-600 py-1 rounded text-xs font-bold">إضافة ونقل</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                        <div className="flex gap-2">
                            {apkUrl && (
                                <a 
                                    href={apkUrl} 
                                    download={`${project.name.replace(/\s+/g, '_')}_v1.0.apk`}
                                    className="text-[10px] bg-green-600/20 text-green-400 px-2 py-1 rounded border border-green-600/30 hover:bg-green-600/30 transition-colors"
                                >
                                    تنزيل APK
                                </a>
                            )}
                            {ipaUrl && (
                                <a 
                                    href={ipaUrl} 
                                    download={`${project.name.replace(/\s+/g, '_')}_v1.0.ipa`}
                                    className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30 hover:bg-blue-600/30 transition-colors"
                                >
                                    تنزيل IPA
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
        </>
    );
};