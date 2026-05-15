import React from 'react';
import { Project, ProjectSection, SectionType } from '../../types';
import UsersEditor from './editors/UsersEditor';
import ChatEditor from './editors/ChatEditor';
import StoreEditor from './editors/StoreEditor';
import BlogEditor from './editors/BlogEditor';
import HtmlEditor from './editors/HtmlEditor';
import AdsEditor from './editors/AdsEditor';
import GenericEditor from './editors/GenericEditor';
import RssEditor from './editors/RssEditor';
import FormEditor from './editors/FormEditor';
import GeneralEditor from './editors/GeneralEditor';
import MediaEditor from './editors/MediaEditor';
import NotificationsEditor from './editors/NotificationsEditor';

interface EditorPanelProps {
    section: ProjectSection;
    project: Project;
    onUpdateProject: (project: Project) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ section, project, onUpdateProject }) => {
    
    const handleUpdateSection = (updatedSection: ProjectSection) => {
        const updatedSections = project.sections.map(s => s.id === updatedSection.id ? updatedSection : s);
        onUpdateProject({ ...project, sections: updatedSections });
    };

    const handleUpdateProjectInfo = (updates: Partial<Project>) => {
        onUpdateProject({ ...project, ...updates });
    }

    const renderEditor = () => {
        // Special case for the "Design" section which is more of a general project setting
        if (section.type === SectionType.DESIGN) {
            return <GeneralEditor project={project} onUpdateProjectInfo={handleUpdateProjectInfo} section={section} onUpdate={handleUpdateSection} />;
        }

        switch(section.type) {
            case SectionType.USERS:
                return <UsersEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.CHAT:
                return <ChatEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.STORE:
                return <StoreEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.BLOG:
                return <BlogEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.HTML:
                return <HtmlEditor section={section} onUpdate={handleUpdateSection} project={project} onUpdateProject={onUpdateProject} />;
            case SectionType.ADS:
                return <AdsEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.RSS:
                return <RssEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.FORM:
                return <FormEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.MEDIA:
                return <MediaEditor section={section} onUpdate={handleUpdateSection} />;
            case SectionType.NOTIFICATIONS:
                return <NotificationsEditor section={section} onUpdate={handleUpdateSection} />;
            // Add other specific editors here
            default:
                return <GenericEditor section={section} onUpdate={handleUpdateSection} />;
        }
    };
    
    return (
        <aside className="w-[350px] bg-slate-800 border-r border-slate-700 p-4 flex flex-col flex-shrink-0">
            <div className="mb-4">
                <input 
                    type="text"
                    value={section.title}
                    onChange={(e) => handleUpdateSection({ ...section, title: e.target.value })}
                    className="w-full bg-transparent text-lg font-bold text-white focus:outline-none focus:bg-slate-700 rounded-md p-1"
                />
                <p className="text-xs text-slate-500">{section.type}</p>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {renderEditor()}
            </div>
        </aside>
    );
};

export default EditorPanel;