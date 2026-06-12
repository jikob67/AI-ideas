import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, ProjectSection, SectionType, View } from '../types';
import { useAuth } from '../hooks/useAuth';
import { BuilderHeader } from './builder/BuilderHeader';
import SectionSidebar from './builder/SectionSidebar';
import EditorPanel from './builder/EditorPanel';
import PreviewPanel from './builder/PreviewPanel';
import AiPanel from './builder/AiPanel';
import { BuildModal } from './builder/modals/BuildModal';
import { SparklesIcon, SpinnerIcon } from './Icons';
import { geminiService } from '../services/geminiService';
import QualityAnalysisModal from './builder/modals/QualityAnalysisModal';

interface AppBuilderProps {
  initialProject: Project | null;
  onExit: () => void;
}

const AppBuilder: React.FC<AppBuilderProps> = ({ initialProject, onExit }) => {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isVisualEditMode, setIsVisualEditMode] = useState(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [buildPlatform, setBuildPlatform] = useState<'web' | 'android' | 'ios' | 'api'>('web');
  
  const [commandBarState, setCommandBarState] = useState<{ top: number, left: number, width: number, sectionId: string, selector: string, tagName: string } | null>(null);
  const [visualEditCommand, setVisualEditCommand] = useState('');
  const [isProcessingVisualEdit, setIsProcessingVisualEdit] = useState(false);

  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const projectRef = useRef(project);


  const { currentUser } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Keep project ref up to date
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Autosave interval
  useEffect(() => {
    const autoSave = () => {
      const currentProject = projectRef.current;
      if (!currentProject || !currentUser?.email) return;

      setAutosaveStatus('saving');
      try {
        const savedApps: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
        const projectExists = savedApps.some(p => p.id === currentProject.id);
        const updatedApps = projectExists
          ? savedApps.map(p => (p.id === currentProject.id ? currentProject : p))
          : [currentProject, ...savedApps];

        localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedApps));

        setTimeout(() => {
          setAutosaveStatus('saved');
          setTimeout(() => setAutosaveStatus('idle'), 2000); // Hide message after 2s
        }, 500);
      } catch (e) {
        console.error("Autosave failed:", e);
        setAutosaveStatus('idle'); // Or an 'error' state
      }
    };

    const intervalId = setInterval(autoSave, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [currentUser]);


  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      if (initialProject.sections.length > 0) {
        // Try to find the first visible section, otherwise default to the first one
        const firstVisibleSection = initialProject.sections.find(s => s.type !== SectionType.DESIGN);
        setActiveSectionId(firstVisibleSection ? firstVisibleSection.id : initialProject.sections[0].id);
      }
    }
  }, [initialProject]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'VISUAL_EDITOR_ELEMENT_CLICKED' && isVisualEditMode) {
            const { rect, selector, sectionId, tagName } = event.data.payload;
            if (selector && sectionId) {
                // Adjust for scroll position of the main window is not needed if the builder is fullscreen
                const top = rect.top;
                const left = rect.left;

                setCommandBarState({ top: top + rect.height, left: left, width: Math.max(280, rect.width), sectionId, selector, tagName });
                setVisualEditCommand(''); // Reset command
            }
        }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isVisualEditMode]);

  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProject(updatedProject);
  }, []);
  
  const handleSaveProject = () => {
    if (!project || !currentUser?.email) return;
    const savedApps: Project[] = JSON.parse(localStorage.getItem(`appProjects_${currentUser.email}`) || '[]');
    const projectExists = savedApps.some(p => p.id === project.id);
    const updatedApps = projectExists 
        ? savedApps.map(p => p.id === project.id ? project : p)
        : [project, ...savedApps];

    localStorage.setItem(`appProjects_${currentUser.email}`, JSON.stringify(updatedApps));
    alert('Project saved!');
  };

  const activeSection = project?.sections.find(s => s.id === activeSectionId);

  const handleOpenBuildModal = (platform: 'web' | 'android' | 'ios' | 'api') => {
      setBuildPlatform(platform);
      setIsBuildModalOpen(true);
  }
  
  const handleVisualEditSubmit = async () => {
    if (!commandBarState || !visualEditCommand || !project) return;
    setIsProcessingVisualEdit(true);
    try {
        const updatedProject = await geminiService.modifyHtmlElement(project, commandBarState.sectionId, commandBarState.selector, visualEditCommand);
        handleUpdateProject(updatedProject);
    } catch (error) {
        console.error("Visual edit failed:", error);
        alert(`فشل التعديل المرئي: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        setIsProcessingVisualEdit(false);
        setCommandBarState(null);
    }
  };


  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold">لم يتم تحديد مشروع</h2>
          <p className="text-slate-400">الرجاء اختيار مشروع من لوحة التحكم لبدء التعديل.</p>
          <button onClick={onExit} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">اذهب إلى لوحة التحكم</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white">
      <BuilderHeader 
        project={project}
        device={device}
        onDeviceChange={setDevice}
        onSave={handleSaveProject}
        onOpenBuildModal={handleOpenBuildModal}
        onOpenAnalysisModal={() => setIsAnalysisModalOpen(true)}
        isVisualEditMode={isVisualEditMode}
        onToggleVisualEdit={() => {
            setIsVisualEditMode(!isVisualEditMode);
            setCommandBarState(null); // Close command bar when toggling mode
        }}
        autosaveStatus={autosaveStatus}
      />
      <div className="flex-grow flex flex-row overflow-hidden min-h-0">
        <SectionSidebar
          project={project}
          activeSectionId={activeSectionId}
          onSectionSelect={setActiveSectionId}
          onUpdateProject={handleUpdateProject}
          onExit={onExit}
        />

        {activeSection ? (
          <div className="flex-grow flex flex-row min-w-0">
            <EditorPanel
              section={activeSection}
              project={project}
              onUpdateProject={handleUpdateProject}
            />

            <div className="flex-1 flex flex-col min-w-0 relative">
              <PreviewPanel
                project={project}
                currentUser={currentUser}
                device={device}
                isVisualEditMode={isVisualEditMode}
                iframeRef={iframeRef}
              />
              {isVisualEditMode && commandBarState && (
                <div
                  className="absolute bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-lg flex items-center gap-2 animate-fade-in z-30"
                  style={{ top: commandBarState.top + 5, left: commandBarState.left, width: commandBarState.width }}
                >
                  <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded-md text-sky-300">{commandBarState.tagName.toLowerCase()}</span>
                  <input
                    type="text"
                    value={visualEditCommand}
                    onChange={e => setVisualEditCommand(e.target.value)}
                    placeholder={`اطلب تعديلاً لـ <${commandBarState.tagName.toLowerCase()}>...`}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-md p-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    autoFocus
                    onKeyPress={e => e.key === 'Enter' && handleVisualEditSubmit()}
                  />
                  <button onClick={handleVisualEditSubmit} disabled={isProcessingVisualEdit || !visualEditCommand} className="p-2 bg-indigo-600 rounded-md disabled:bg-slate-500 hover:bg-indigo-500 transition-colors">
                    {isProcessingVisualEdit ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <p>اختر قسمًا من القائمة لبدء التعديل.</p>
          </div>
        )}
      </div>

      <AiPanel project={project} onUpdateProject={handleUpdateProject} />

      <BuildModal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
        project={project}
        platform={buildPlatform}
      />

      <QualityAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        project={project}
        onUpdateProject={handleUpdateProject}
      />
    </div>
  );
};

export default AppBuilder;