import React, { useState } from 'react';
import { Project, ProjectSection, ProjectType } from '../../../types';
import EditorField from './EditorField';
import SettingGroup from '../SettingGroup';
// FIX: Corrected import path for DesignEditor
import DesignEditor from './DesignEditor';
import { UploadIcon, SparklesIcon, SpinnerIcon } from '../../Icons';
import { useUsage } from '../../../hooks/useUsage';
import { geminiService } from '../../../services/geminiService';
import UpgradeModal from '../../UpgradeModal';


interface GeneralEditorProps {
    project: Project;
    onUpdateProjectInfo: (updates: Partial<Project>) => void;
    section: ProjectSection; // The design section
    onUpdate: (s: ProjectSection) => void;
}

const GeneralEditor: React.FC<GeneralEditorProps> = ({ project, onUpdateProjectInfo, section, onUpdate }) => {
    
    const [iconPreview, setIconPreview] = useState<string | null>(project.iconUrl || null);
    const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
    const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const { isLimitReached, incrementUsage } = useUsage();
    
    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setIconPreview(dataUrl);
                onUpdateProjectInfo({ iconUrl: dataUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateIcon = async () => {
        if (isLimitReached(ProjectType.GENERATE_ICON)) {
            setUpgradeModalOpen(true);
            return;
        }
        setIsGeneratingIcon(true);
        try {
            const imageBase64 = await geminiService.generateProjectIcon(project.name, project.description);
            const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
            setIconPreview(dataUrl);
            onUpdateProjectInfo({ iconUrl: dataUrl });
            incrementUsage(ProjectType.GENERATE_ICON);
        } catch (error) {
            console.error("Failed to generate icon:", error);
            alert("فشل إنشاء الأيقونة. يرجى المحاولة مرة أخرى.");
        } finally {
            setIsGeneratingIcon(false);
        }
    };

    return (
        <div className="space-y-4">
            <SettingGroup title="معلومات المشروع">
                <EditorField label="اسم المشروع">
                    <input
                        type="text"
                        value={project.name}
                        onChange={e => onUpdateProjectInfo({ name: e.target.value })}
                        className="w-full bg-slate-700 p-2 rounded-md text-sm"
                    />
                </EditorField>
                <EditorField label="وصف المشروع">
                    <textarea
                        value={project.description}
                        onChange={e => onUpdateProjectInfo({ description: e.target.value })}
                        rows={3}
                        className="w-full bg-slate-700 p-2 rounded-md text-sm resize-y"
                    />
                </EditorField>
                <EditorField label="أيقونة المشروع">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                           {(iconPreview || project.iconUrl) ? (
                                <img src={iconPreview || project.iconUrl} alt="Icon Preview" className="w-full h-full object-cover rounded-lg" />
                           ) : (
                                <span className="text-xs text-slate-500">لا يوجد</span>
                           )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="icon-upload" className="cursor-pointer bg-slate-600 hover:bg-slate-500 text-slate-300 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                                <UploadIcon className="w-5 h-5" />
                                <span>تغيير</span>
                            </label>
                            <input id="icon-upload" type="file" className="sr-only" accept="image/*" onChange={handleIconChange} />
                            <button onClick={handleGenerateIcon} disabled={isGeneratingIcon} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:bg-slate-500">
                                {isGeneratingIcon ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                <span>إنشاء بواسطة AI</span>
                            </button>
                        </div>
                    </div>
                </EditorField>
            </SettingGroup>

            <DesignEditor section={section} onUpdate={onUpdate} />

            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
        </div>
    );
};

export default GeneralEditor;