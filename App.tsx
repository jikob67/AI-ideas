
import React from 'react';
import { UsageProvider } from './contexts/UsageContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AiAssistant from './components/AiAssistant';
import Sidebar from './components/Sidebar';
import { View, Project, ProjectSection, SectionType, ProjectFile } from './types';
import Profile from './components/Profile';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import ContactUs from './components/ContactUs';
import AboutUs from './components/AboutUs';
import ArtConverter from './components/ArtConverter';
import Support from './components/Support';
import Marketing from './components/Marketing';
// FIX: Changed to named import as ProjectBooster does not have a default export.
import { ProjectBooster } from './components/ProjectBooster';
// FIX: Changed to named import as SoftwareProjectBuilder does not have a default export.
import { SoftwareProjectBuilder } from './components/SoftwareProjectBuilder';
import ProfessionalTemplateGenerator from './components/ProfessionalTemplateGenerator';
import Trash from './components/Trash';
import ProfitSource from './components/ProfitSource';
import DrawToCode from './components/DrawToCode';
import DataAnalysis from './components/DataAnalysis';
import AiContentDetector from './components/AiContentDetector';
import Changelog from './components/Changelog';
import LiveConversation from './components/LiveConversation';
import FileConverter from './components/FileConverter';
import { SeoOptimizer } from './components/SeoOptimizer';
import { Showroom } from './components/Showroom';
import { AssetStudio } from './components/AssetStudio';
import { useAuth } from './hooks/useAuth';
import LandingPage from './components/LandingPage';
import AppealPage from './components/AppealPage';
// Added ArrowLeftIcon to fix ReferenceError at line 234
import { SpinnerIcon, ArrowLeftIcon } from './components/Icons';
import OnboardingModal from './components/OnboardingModal';

type GenerationMode = 'idea' | 'text' | 'screen' | 'recognizer';

const App: React.FC = () => {
  const { currentUser, loading, updateUser } = useAuth();
  const [activeView, setActiveView] = React.useState<View>('ideaToCode');
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [navigationContext, setNavigationContext] = React.useState<any>(null);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const navigate = React.useCallback((view: View, context?: any) => {
    setNavigationContext(context);
    setActiveView(view);
  }, []);

  React.useEffect(() => {
      if (currentUser?.isNewUser) {
          setShowOnboarding(true);
      }
  }, [currentUser]);

  React.useEffect(() => {
    // This effect now only clears the context after a short delay
    // The SoftwareProjectBuilder will handle consuming it on its own first render.
    if (navigationContext) {
      const timer = setTimeout(() => setNavigationContext(null), 500);
      return () => clearTimeout(timer);
    }
  }, [navigationContext, activeView]);

  // Effect to handle redirection for specific project types, moved here to fix conditional hook call.
  React.useEffect(() => {
    if (activeView === 'editApp') {
        const projectToEdit = navigationContext?.project || null;
        if (projectToEdit && projectToEdit.creationMode && ['ideaToCode', 'textToCode', 'screenToCode', 'uiRecognizer', 'drawToCode'].includes(projectToEdit.creationMode)) {
             navigate(projectToEdit.creationMode, { project: projectToEdit });
        }
    }
  }, [activeView, navigationContext, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }

  const handleCloseOnboarding = () => {
      if (currentUser?.isNewUser) {
          updateUser({ isNewUser: false });
      }
      setShowOnboarding(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };


  // Allow viewing privacy and terms without login
  const publicViews: View[] = ['privacy', 'terms'];
  if (!currentUser && !publicViews.includes(activeView)) {
    return <LandingPage onNavigate={navigate} />;
  }
  
  if (currentUser?.isBanned) {
    return <AppealPage />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'editApp': {
        const projectToEdit = navigationContext?.project || null;

        if (!projectToEdit) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                        <h2 className="text-xl font-bold">لم يتم تحديد مشروع</h2>
                        <p className="text-slate-400">الرجاء اختيار مشروع من لوحة التحكم لبدء التعديل.</p>
                        <button onClick={() => navigate('ideaToCode')} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg">العودة إلى لوحة التحكم</button>
                    </div>
                </div>
            );
        }
        
        // If a redirect is pending (handled by the top-level useEffect), show a loader.
        // This view will be shown for one render cycle before the redirect happens.
        if (projectToEdit.creationMode && ['ideaToCode', 'textToCode', 'screenToCode', 'uiRecognizer', 'drawToCode'].includes(projectToEdit.creationMode)) {
            return <div className="flex items-center justify-center h-full"><SpinnerIcon className="w-8 h-8 animate-spin"/></div>;
        }

        // For all other projects (Art, old projects), open in generic file editor
        let builderModeForEdit: GenerationMode = 'text'; // Default mode for generic edits
        
        let projectForEditor = { ...projectToEdit };

        // Convert section-based projects to file-based for the editor
        if ((!projectForEditor.files || projectForEditor.files.length === 0) && projectForEditor.sections && projectForEditor.sections.length > 0) {
            const htmlSection = projectForEditor.sections.find((s: ProjectSection) => s.type === SectionType.HTML);
            let htmlContent = htmlSection?.config?.htmlContent || '<h1>Content not found</h1><p>This project was section-based and could not be fully converted.</p>';

            const styleRegex = /<style>([\s\S]*?)<\/style>/i;
            const scriptRegex = /<script>([\s\S]*?)<\/script>/i;

            const styleMatch = htmlContent.match(styleRegex);
            const scriptMatch = htmlContent.match(scriptRegex);

            const cssContent = styleMatch ? styleMatch[1].trim() : '';
            const jsContent = scriptMatch ? scriptMatch[1].trim() : '';
            
            htmlContent = htmlContent.replace(styleRegex, '').replace(scriptRegex, '');
            
            if (cssContent && !htmlContent.includes('<link rel="stylesheet" href="style.css">')) {
                if (htmlContent.includes('</head>')) {
                    htmlContent = htmlContent.replace('</head>', '  <link rel="stylesheet" href="style.css">\n</head>');
                } else {
                    htmlContent = `<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${projectForEditor.name}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n` + htmlContent;
                }
            }
           
            if (jsContent && !htmlContent.includes('script.js')) {
                 if (htmlContent.includes('</body>')) {
                    htmlContent = htmlContent.replace('</body>', '  <script src="script.js" defer></script>\n</body>');
                } else {
                    htmlContent += '\n<script src="script.js" defer></script>';
                }
            }
            
            const files: ProjectFile[] = [
                { name: 'index.html', language: 'html', content: htmlContent.trim() },
                { name: 'style.css', language: 'css', content: cssContent },
                { name: 'script.js', language: 'javascript', content: jsContent },
            ];
            
            projectForEditor.files = files;
        }

        return <SoftwareProjectBuilder 
                  navigate={navigate} 
                  mode={builderModeForEdit} 
                  context={{ project: projectForEditor }} 
               />;
      }
      case 'aiAssistant':
        return <AiAssistant navigate={navigate} />;
      case 'projectBooster':
        return <ProjectBooster navigate={navigate} />;
      case 'profile':
        return <Profile />;
      case 'about':
        return <AboutUs />;
      case 'terms':
        return <TermsOfService />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'contact':
        return <ContactUs />;
      case 'artConverter':
        return <ArtConverter navigate={navigate} />;
      case 'professionalTemplateGenerator':
        return <ProfessionalTemplateGenerator navigate={navigate} />;
      case 'support':
        return <Support navigate={navigate} />;
      case 'marketing':
        return <Marketing context={navigationContext} navigate={navigate} />;
      case 'profitSource':
        return <ProfitSource navigate={navigate} />;
      case 'ideaToCode':
        return <SoftwareProjectBuilder navigate={navigate} mode="idea" context={navigationContext} />;
      case 'textToCode':
        return <SoftwareProjectBuilder navigate={navigate} mode="text" context={navigationContext} />;
      case 'screenToCode':
        return <SoftwareProjectBuilder navigate={navigate} mode="screen" context={navigationContext} />;
      case 'uiRecognizer':
        return <SoftwareProjectBuilder navigate={navigate} mode="recognizer" context={navigationContext} />;
      case 'drawToCode':
        return <DrawToCode navigate={navigate} context={navigationContext} />;
      case 'fileConverter':
        return <FileConverter navigate={navigate} />;
      case 'projectWizard':
        return <SoftwareProjectBuilder navigate={navigate} mode="wizard" context={navigationContext} />;
      case 'linkWizard':
        return <SoftwareProjectBuilder navigate={navigate} mode="url" context={navigationContext} />;
      case 'trash':
        return <Trash navigate={navigate} />;
      case 'dataAnalysis':
        return <DataAnalysis navigate={navigate} />;
      case 'aiContentDetector':
        return <AiContentDetector />;
      case 'changelog':
        return <Changelog />;
      case 'live':
        return <LiveConversation />;
      case 'urlToCode':
        return <SoftwareProjectBuilder navigate={navigate} mode="url" context={navigationContext} />;
      case 'seoOptimizer':
        return <SeoOptimizer />;
      case 'showroom':
        return <Showroom />;
      case 'assetStudio':
        return <AssetStudio />;
      default:
        return <SoftwareProjectBuilder navigate={navigate} mode="idea" context={navigationContext} />;
    }
  };

  const fullScreenViews: View[] = ['editApp', 'aiAssistant', 'support', 'ideaToCode', 'textToCode', 'screenToCode', 'uiRecognizer', 'drawToCode', 'dataAnalysis', 'aiContentDetector', 'changelog', 'live', 'fileConverter', 'privacy', 'terms', 'projectWizard', 'linkWizard', 'urlToCode', 'seoOptimizer', 'showroom', 'assetStudio'];
  const isFullScreen = fullScreenViews.includes(activeView);

  return (
    <UsageProvider>
      <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
        {currentUser && (
          <Sidebar activeView={activeView} setActiveView={navigate} isOpen={isSidebarOpen} openOnboarding={() => setShowOnboarding(true)} />
        )}
        <div className="flex-1 flex flex-col min-w-0">
          <Header toggleSidebar={currentUser ? toggleSidebar : undefined} />
          <main className={`flex-grow ${isFullScreen ? 'flex flex-col overflow-hidden' : 'container mx-auto p-4 md:p-6 lg:p-8 overflow-y-auto'}`}>
            {!currentUser && publicViews.includes(activeView) && (
              <div className="mb-6">
                 <button onClick={() => navigate('ideaToCode')} className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors">
                    <ArrowLeftIcon className="w-5 h-5"/> العودة للرئيسية
                 </button>
              </div>
            )}
            {renderContent()}
          </main>
          {!isFullScreen && <Footer navigate={navigate} />}
        </div>
      </div>
      <OnboardingModal isOpen={showOnboarding} onClose={handleCloseOnboarding} />
    </UsageProvider>
  );
};

export default App;
