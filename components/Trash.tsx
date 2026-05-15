import React, { useState, useEffect } from 'react';
import { Project, View } from '../types';
import { TrashIcon, CodeIcon, ArrowPathIcon, PencilSquareIcon } from './Icons';
import { useAuth } from '../hooks/useAuth';

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

const Trash: React.FC<{
    navigate: (view: View, context?: { project: Project }) => void;
}> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const [deletedApps, setDeletedApps] = useState<Project[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (!currentUser?.email) return;
    const savedDeletedApps = JSON.parse(localStorage.getItem(`deletedProjects_${currentUser.email}`) || '[]');
    setDeletedApps(savedDeletedApps);
  }, [currentUser]);

  const updateDeletedApps = (updatedApps: Project[]) => {
      if (!currentUser?.email) return;
      setDeletedApps(updatedApps);
      localStorage.setItem(`deletedProjects_${currentUser.email}`, JSON.stringify(updatedApps));
  }

  const handleRestore = (appId: string) => {
    if (!currentUser?.email) return;
    const appToRestore = deletedApps.find(p => p.id === appId);
    if (!appToRestore) return;

    // Add back to active projects
    const activeApps = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
    const updatedActiveApps = [appToRestore, ...activeApps];
    localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedActiveApps));

    // Remove from deleted projects
    const updatedDeleted = deletedApps.filter(p => p.id !== appId);
    updateDeletedApps(updatedDeleted);
    
    alert(`تم استعادة مشروع "${appToRestore.name}" بنجاح.`);
  };
  
  const handleOpenDeleteConfirm = (project: Project) => {
    setProjectToDelete(project);
  };

  const handleDeletePermanently = () => {
    if (!projectToDelete) return;
    const updatedDeleted = deletedApps.filter(p => p.id !== projectToDelete.id);
    updateDeletedApps(updatedDeleted);
    setProjectToDelete(null);
  };

  const handleEdit = (projectToEdit: Project) => {
    navigate('editApp', { project: projectToEdit });
  };

  return (
    <>
        <div className="animate-fade-in space-y-8">
            <header>
                <h2 className="text-3xl font-bold text-slate-100">سلة المحذوفات</h2>
                <p className="text-slate-400">المشاريع المحذوفة. يمكنك استعادتها أو حذفها نهائيًا.</p>
            </header>

            <div>
                {deletedApps.length === 0 ? (
                     <div className="text-center py-20 px-6 bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-lg">
                        <TrashIcon className="mx-auto h-12 w-12 text-slate-500"/>
                        <h3 className="mt-4 text-lg font-medium text-white">سلة المحذوفات فارغة</h3>
                        <p className="mt-2 text-sm text-slate-400">عند حذف المشاريع من لوحة التحكم، ستظهر هنا.</p>
                    </div>
                ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {deletedApps.map(app => (
                            <div key={app.id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-slate-600 transition-all duration-300">
                               <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        {app.iconUrl ? (
                                            <img src={app.iconUrl} alt={`${app.name} icon`} className="w-12 h-12 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center"><CodeIcon className="w-6 h-6 text-indigo-400"/></div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-md text-slate-200 truncate">{app.name}</h4>
                                            <p className="text-xs text-slate-400">{app.type}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        تاريخ الحذف: {new Date(app.timestamp).toLocaleString('ar-EG')}
                                    </p>
                               </div>
                               <div className="flex items-center gap-2 mt-4 border-t border-slate-700 pt-3">
                                   <button 
                                        onClick={() => handleRestore(app.id)}
                                        className="text-sm bg-green-600 hover:bg-green-500 text-white font-semibold px-3 py-2 rounded-md transition-colors flex items-center justify-center gap-1.5"
                                        title="استعادة المشروع"
                                    >
                                       <ArrowPathIcon className="w-4 h-4" />
                                       استعادة
                                   </button>
                                    <button 
                                        onClick={() => handleEdit(app)}
                                        className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-md transition-colors"
                                        title="فتح في المحرر"
                                    >
                                       <PencilSquareIcon className="w-5 h-5" />
                                    </button>
                                   <button 
                                        onClick={() => handleOpenDeleteConfirm(app)} 
                                        className="ml-auto p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-md transition-colors"
                                        title="حذف نهائي"
                                    >
                                       <TrashIcon className="w-5 h-5" />
                                   </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
          </div>
        </div>
        <ConfirmationModal
            isOpen={!!projectToDelete}
            onClose={() => setProjectToDelete(null)}
            onConfirm={handleDeletePermanently}
            title={`حذف "${projectToDelete?.name}" نهائياً`}
            message="هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء."
            confirmText="نعم، احذف نهائياً"
        />
    </>
  );
};

export default Trash;