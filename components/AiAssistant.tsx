import React, { useState } from 'react';
import { Feature } from '../types';
import { ArrowLeftIcon } from './Icons';
import FeatureSelectionScreen from './ai/FeatureSelectionScreen';
import VideoGenerator from './ai/VideoGenerator';
import ImageGenerator from './ai/ImageGenerator';
import ImageEditor from './ai/ImageEditor';
import ImageAnalyzer from './ai/ImageAnalyzer';
import VideoAnalyzer from './ai/VideoAnalyzer';
import AudioTranscriber from './ai/AudioTranscriber';
import TextToSpeech from './ai/TextToSpeech';
import DataAnalysis from './DataAnalysis';
import ChatInterface from './ChatInterface';
import LiveConversation from './LiveConversation';

// This is a bit of a trick to get the navigate function down.
// In a real app, this would be handled by a routing or context solution.
// For now, we assume AiAssistant receives navigate as a prop from App.tsx
interface AiAssistantProps {
    navigate: (view: any, context?: any) => void;
    context?: any;
}


const AiAssistant: React.FC<AiAssistantProps> = ({ navigate, context }) => {
    const [templateText, setTemplateText] = useState<string | null>(null);
    const [activeFeature, setActiveFeature] = useState<Feature | null>(
        context?.targetFeature || (context?.prefillPrompt ? Feature.AI_CHAT : null)
    );

    const handleFeatureSelect = (feature: Feature, initialText?: string) => {
        if (initialText) setTemplateText(initialText);
        setActiveFeature(feature);
    };

    const handleBackToMenu = () => {
        setActiveFeature(null);
        setTemplateText(null);
    };

    const renderFeatureContent = () => {
        if (!activeFeature) {
             return <FeatureSelectionScreen onSelect={handleFeatureSelect} />;
        }
        
        const chatProps = (context?.prefillPrompt || templateText) 
            ? { initialMessage: context?.prefillPrompt || templateText } 
            : {};

        const featureUI: { [key in Feature]?: React.ReactNode } = {
            [Feature.GENERATE_VIDEO]: <VideoGenerator initialPrompt={context?.prefillPrompt || templateText} />,
            [Feature.GENERATE_IMAGE]: <ImageGenerator />,
            [Feature.EDIT_IMAGE]: <ImageEditor />,
            [Feature.ANALYZE_IMAGE]: <ImageAnalyzer />,
            [Feature.ANALYZE_VIDEO]: <VideoAnalyzer />,
            [Feature.DATA_ANALYSIS]: <DataAnalysis navigate={navigate} context={context}/>,
            [Feature.TRANSCRIBE_AUDIO]: <AudioTranscriber />,
            [Feature.TEXT_TO_SPEECH]: <TextToSpeech />,
            [Feature.LIVE_CONVERSATION]: <LiveConversation />,
            [Feature.AI_CHAT]: <ChatInterface feature={Feature.AI_CHAT} model="gemini-flash-latest" title="محادثة عامة" {...chatProps} />,
            [Feature.FAST_CHAT]: <ChatInterface feature={Feature.FAST_CHAT} model="gemini-flash-lite-latest" title="محادثة سريعة" {...chatProps} />,
            [Feature.THINKING_MODE_CHAT]: <ChatInterface feature={Feature.THINKING_MODE_CHAT} model="gemini-flash-latest" title="محادثة متعمقة" systemInstruction="You are a helpful expert assistant. Think carefully and provide comprehensive answers." config={{ thinkingConfig: { thinkingBudget: 32768 } }} {...chatProps} />,
            [Feature.WEB_SEARCH]: <ChatInterface feature={Feature.WEB_SEARCH} model="gemini-flash-latest" title="بحث معزز" config={{ tools: [{googleSearch: {}}] }} {...chatProps} />,
            [Feature.MAPS_SEARCH]: <ChatInterface feature={Feature.MAPS_SEARCH} model="gemini-flash-latest" title="بحث خرائط" config={{ tools: [{googleMaps: {}}] }} {...chatProps} />,
        };

        const specificUI = featureUI[activeFeature];

        if (!specificUI) {
            return (
                <div className="p-4 text-center">
                    <p>الميزة المحددة غير متوفرة بعد.</p>
                    <button onClick={handleBackToMenu} className="mt-4 text-indigo-400">العودة</button>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <header className="flex-shrink-0 p-3 border-b border-slate-700 flex items-center gap-3">
                    <button onClick={handleBackToMenu} className="p-2 rounded-full hover:bg-slate-700"><ArrowLeftIcon className="w-5 h-5"/></button>
                    <h2 className="font-bold text-lg text-white">{activeFeature}</h2>
                </header>
                <div className="flex-grow overflow-hidden">
                  {specificUI}
                </div>
            </div>
        );
    };

    return <div className="flex flex-col h-full bg-slate-800/30">{renderFeatureContent()}</div>;
};

// A wrapper component to satisfy App.tsx which doesn't pass navigate
const AiAssistantWrapper: React.FC<{navigate: (view: any, context?: any) => void; context?: any;}> = ({navigate, context}) => {
    return <AiAssistant navigate={navigate} context={context} />;
};


export default AiAssistantWrapper;
