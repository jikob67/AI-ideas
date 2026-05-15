import React from 'react';
import { Project, ProjectSection, SectionType } from '../../types';
import { PlusIcon, TrashIcon, ArrowLeftOnRectangleIcon } from '../Icons';
import { SECTION_DEFINITIONS } from '../../constants';

interface SectionSidebarProps {
    project: Project;
    activeSectionId: string | null;
    onSectionSelect: (id: string) => void;
    onUpdateProject: (project: Project) => void;
    onExit: () => void;
}

const SectionSidebar: React.FC<SectionSidebarProps> = ({
    project, activeSectionId, onSectionSelect, onUpdateProject, onExit
}) => {

    const handleAddSection = () => {
        // For simplicity, we'll add a new HTML section. A real implementation
        // would show a modal to select the section type.
        const newSection: ProjectSection = {
            id: `sec-${Date.now()}`,
            type: SectionType.HTML,
            title: 'قسم جديد',
            config: SECTION_DEFINITIONS.find(d => d.type === SectionType.HTML)!.defaultConfig,
        };
        const updatedProject = { ...project, sections: [...project.sections, newSection] };
        onUpdateProject(updatedProject);
        onSectionSelect(newSection.id);
    };

    const handleDeleteSection = (sectionId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
            const updatedSections = project.sections.filter(s => s.id !== sectionId);
            const updatedProject = { ...project, sections: updatedSections };
            onUpdateProject(updatedProject);
            if (activeSectionId === sectionId) {
                onSectionSelect(updatedSections[0]?.id || null);
            }
        }
    };

    return (
        <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-2 flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between p-2 mb-2">
                <h3 className="font-semibold text-slate-200">أقسام المشروع</h3>
                <button onClick={handleAddSection} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-700 hover:text-white" title="إضافة قسم جديد">
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {project.sections.map(section => (
                    <div key={section.id} className="flex group items-center">
                        <button
                            onClick={() => onSectionSelect(section.id)}
                            className={`w-full text-right p-2 rounded-md text-sm truncate ${activeSectionId === section.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400 hover:bg-slate-700/50'}`}
                        >
                            {section.title}
                        </button>
                        <button onClick={() => handleDeleteSection(section.id)} className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
            <div className="p-2 border-t border-slate-700">
                <button onClick={onExit} className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:bg-slate-700 hover:text-white p-2 rounded-md">
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    الخروج من المحرر
                </button>
            </div>
        </aside>
    );
};

export default SectionSidebar;