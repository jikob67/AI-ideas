import React, { useState } from 'react';
import { Project } from '../../types';
import {
    SaveIcon, ComputerDesktopIcon, DevicePhoneMobileIcon,
    ArrowTopRightOnSquareIcon, ArchiveBoxArrowDownIcon, EyeIcon, EyeOffIcon, ShieldCheckIcon,
    CopyIcon, CheckIcon
} from '../Icons';

interface BuilderHeaderProps {
    project: Project;
    device: 'desktop' | 'mobile';
    onDeviceChange: (device: 'desktop' | 'mobile') => void;
    onSave: () => void;
    onOpenBuildModal: (platform: 'web' | 'android' | 'ios' | 'api') => void;
    isVisualEditMode: boolean;
    onToggleVisualEdit: () => void;
    onOpenAnalysisModal: () => void;
    autosaveStatus: 'idle' | 'saving' | 'saved';
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
    project, device, onDeviceChange, onSave, onOpenBuildModal, isVisualEditMode, onToggleVisualEdit, onOpenAnalysisModal, autosaveStatus
}) => {
    const [copiedId, setCopiedId] = useState(false);
    const handleCopyId = () => {
        navigator.clipboard.writeText(project.id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <header className="flex-shrink-0 bg-gray-900/70 backdrop-blur-sm border-b border-slate-700 p-2 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white truncate max-w-[200px]">{project.name}</h2>
                    <p className="text-xs text-slate-400">{project.type}</p>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-800 rounded-md">
                    <span className="text-xs font-mono text-slate-500" dir="ltr">{project.id}</span>
                    <button onClick={handleCopyId} title="نسخ الرمز">
                        {copiedId ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-slate-400 hover:text-white" />}
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={onToggleVisualEdit} title="التعديل المرئي" className={`p-1.5 rounded ${isVisualEditMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}>
                    {isVisualEditMode ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                </button>
                <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-md">
                    <button onClick={() => onDeviceChange('desktop')} title="Desktop View" className={`p-1.5 rounded ${device === 'desktop' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-700'}`}><ComputerDesktopIcon className="w-5 h-5"/></button>
                    <button onClick={() => onDeviceChange('mobile')} title="Mobile View" className={`p-1.5 rounded ${device === 'mobile' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-700'}`}><DevicePhoneMobileIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => onOpenBuildModal('web')} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md"><ArrowTopRightOnSquareIcon className="w-4 h-4"/>نشر</button>
                <button onClick={() => onOpenBuildModal('web')} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md"><ArchiveBoxArrowDownIcon className="w-4 h-4"/>تحميل</button>
                <button onClick={onOpenAnalysisModal} className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md" title="تحليل جودة المشروع">
                    <ShieldCheckIcon className="w-4 h-4 text-green-400"/>
                    <span>تحليل الجودة</span>
                </button>
                <div className="w-28 text-center">
                    {autosaveStatus === 'saving' && <span className="text-xs text-slate-400 animate-pulse">جاري الحفظ...</span>}
                    {autosaveStatus === 'saved' && <span className="text-xs text-green-400">تم الحفظ تلقائيًا</span>}
                </div>
                <button onClick={onSave} className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-md"><SaveIcon className="w-4 h-4"/>حفظ</button>
            </div>
        </header>
    );
};