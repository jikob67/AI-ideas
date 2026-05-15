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
}


const AiAssistant: React.FC<AiAssistantProps> = ({ navigate }) => {
    const [activeFeature, setActiveFeature] = useState<Feature | null>(null);

    const handleFeatureSelect = (feature: Feature) => {
        setActiveFeature(feature);
    };

    const handleBackToMenu = () => {
        setActiveFeature(null);
    };

    const renderFeatureContent = () => {
        if (!activeFeature) {
             return <FeatureSelectionScreen onSelect={handleFeatureSelect} />;
        }
        
        const featureUI: { [key in Feature]?: React.ReactNode } = {
            [Feature.GENERATE_VIDEO]: <VideoGenerator />,
            [Feature.GENERATE_IMAGE]: <ImageGenerator />,
            [Feature.EDIT_IMAGE]: <ImageEditor />,
            [Feature.ANALYZE_IMAGE]: <ImageAnalyzer />,
            [Feature.ANALYZE_VIDEO]: <VideoAnalyzer />,
            [Feature.DATA_ANALYSIS]: <DataAnalysis navigate={navigate}/>,
            [Feature.TRANSCRIBE_AUDIO]: <AudioTranscriber />,
            [Feature.TEXT_TO_SPEECH]: <TextToSpeech />,
            [Feature.LIVE_CONVERSATION]: <LiveConversation />,
            [Feature.AI_CHAT]: <ChatInterface feature={Feature.AI_CHAT} model="gemini-2.5-flash" title="محادثة عامة" />,
            [Feature.FAST_CHAT]: <ChatInterface feature={Feature.FAST_CHAT} model="gemini-flash-lite-latest" title="محادثة سريعة" />,
            [Feature.THINKING_MODE_CHAT]: <ChatInterface feature={Feature.THINKING_MODE_CHAT} model="gemini-2.5-pro" title="محادثة متعمقة" systemInstruction="You are a helpful expert assistant. Think carefully and provide comprehensive answers." config={{ thinkingConfig: { thinkingBudget: 32768 } }} />,
            [Feature.WEB_SEARCH]: <ChatInterface feature={Feature.WEB_SEARCH} model="gemini-2.5-flash" title="بحث معزز" config={{ tools: [{googleSearch: {}}] }} />,
            [Feature.MAPS_SEARCH]: <ChatInterface feature={Feature.MAPS_SEARCH} model="gemini-2.5-flash" title="بحث خرائط" config={{ tools: [{googleMaps: {}}] }} />,
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
const AiAssistantWrapper: React.FC<{navigate: (view: any, context?: any) => void;}> = ({navigate}) => {
    return <AiAssistant navigate={navigate} />;
};


export default AiAssistantWrapper;
