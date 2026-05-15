import React from 'react';
import { Feature } from '../../types';
import { 
    VideoIcon, CameraIcon, SparklesIcon, ChartPieIcon, CommandLineIcon, ChatBubbleLeftRightIcon,
    GlobeAltIcon, MapIcon, PaintBrushIcon, SpeakerWaveIcon, FilmIcon, MicrophoneIcon
} from '../Icons';

const features = [
    { name: Feature.LIVE_CONVERSATION, icon: MicrophoneIcon, color: 'text-red-400', desc: 'تحدث مباشرةً مع Gemini.' },
    { name: Feature.GENERATE_VIDEO, icon: VideoIcon, color: 'text-red-400', desc: 'أنشئ فيديو من نص أو صورة.' },
    { name: Feature.GENERATE_IMAGE, icon: CameraIcon, color: 'text-pink-400', desc: 'ولّد صورًا عالية الجودة من وصف نصي.' },
    { name: Feature.EDIT_IMAGE, icon: PaintBrushIcon, color: 'text-rose-400', desc: 'عدّل صورك باستخدام أوامر نصية.' },
    { name: Feature.ANALYZE_IMAGE, icon: SparklesIcon, color: 'text-purple-400', desc: 'اطرح أسئلة حول محتوى صورة.' },
    { name: Feature.ANALYZE_VIDEO, icon: FilmIcon, color: 'text-violet-400', desc: 'احصل على رؤى من محتوى الفيديو.' },
    { name: Feature.TRANSCRIBE_AUDIO, icon: MicrophoneIcon, color: 'text-cyan-400', desc: 'حوّل كلامك المسجل إلى نص مكتوب.' },
    { name: Feature.TEXT_TO_SPEECH, icon: SpeakerWaveIcon, color: 'text-sky-400', desc: 'حوّل أي نص إلى ملف صوتي.' },
    { name: Feature.DATA_ANALYSIS, icon: ChartPieIcon, color: 'text-teal-400', desc: 'حلل البيانات واكتشف الأنماط.' },
    { name: Feature.WEB_SEARCH, icon: GlobeAltIcon, color: 'text-emerald-400', desc: 'احصل على إجابات مدعومة ببحث الويب.' },
    { name: Feature.MAPS_SEARCH, icon: MapIcon, color: 'text-lime-400', desc: 'ابحث عن أماكن ومعلومات محلية.' },
    { name: Feature.THINKING_MODE_CHAT, icon: ChatBubbleLeftRightIcon, color: 'text-indigo-400', desc: 'محادثة متعمقة للمهام المعقدة.' },
    { name: Feature.AI_CHAT, icon: ChatBubbleLeftRightIcon, color: 'text-blue-400', desc: 'محادثة عامة مع نموذج متوازن.' },
    { name: Feature.FAST_CHAT, icon: ChatBubbleLeftRightIcon, color: 'text-green-400', desc: 'محادثة سريعة لإجابات فورية.' },
];

const FeatureSelectionScreen: React.FC<{onSelect: (feature: Feature) => void}> = ({onSelect}) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 text-center animate-fade-in overflow-y-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white">المساعد الذكي الشامل</h1>
            <p className="text-slate-400 mt-2">ماذا تريد أن تنجز اليوم؟</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 w-full max-w-5xl">
                {features.map(feature => {
                    const Icon = feature.icon;
                    return (
                        <button 
                            key={feature.name} 
                            onClick={() => onSelect(feature.name)} 
                            className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500 transition-all text-center group"
                        >
                            <Icon className={`w-10 h-10 mx-auto mb-3 transition-colors ${feature.color}`} />
                            <p className="font-semibold text-white text-sm">{feature.name}</p>
                             <p className="text-xs text-slate-400 mt-1">{feature.desc}</p>
                        </button>
                    )
                })}
            </div>
        </div>
    );
}

export default FeatureSelectionScreen;
