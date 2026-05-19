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

const FeatureSelectionScreen: React.FC<{onSelect: (feature: Feature, initialText?: string) => void}> = ({onSelect}) => {
    return (
        <div className="flex flex-col items-center h-full p-4 md:p-8 text-center animate-fade-in overflow-y-auto custom-scrollbar">
            <h1 className="text-3xl md:text-5xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">المساعد الذكي الشامل</h1>
            <p className="text-slate-400 mt-2 text-lg">ماذا تريد أن تنجز اليوم؟ اختر أداتك الذكية</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8 w-full max-w-5xl">
                {features.map(feature => {
                    const Icon = feature.icon;
                    return (
                        <button 
                            key={feature.name} 
                            onClick={() => onSelect(feature.name)} 
                            className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all text-center group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-[40px] group-hover:bg-indigo-500/10 transition-all" />
                            <Icon className={`w-12 h-12 mx-auto mb-3 transition-transform group-hover:scale-110 duration-300 ${feature.color}`} />
                            <p className="font-bold text-white text-sm">{feature.name}</p>
                             <p className="text-[10px] text-slate-500 mt-1 leading-tight">{feature.desc}</p>
                        </button>
                    )
                })}
            </div>

            <div className="mt-16 w-full max-w-5xl text-right pb-12">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 justify-end">
                    أفكار سريعة للبدء
                    <span className="w-8 h-[2px] bg-indigo-500/30" />
                    <SparklesIcon className="w-5 h-5 text-indigo-400" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                        "اشرح لي مفهوم الـ API وكيفية استخدامه في React",
                        "ساعدني في كتابة الكود البرمجي لساعة رقمية تفاعلية",
                        "حلل لي أداء كود جافا سكريبت التالي بحثاً عن الأخطاء",
                        "كيف يمكنني تحويل تطبيقي من الويب إلى تطبيق موبايل؟",
                        "اقترح لي 5 أفكار لمشاريع ناشئة تعتمد على الذكاء الاصطناعي",
                        "صمم لي هيكل قاعدة بيانات لمتجر إلكتروني متكامل"
                    ].map((prompt, i) => (
                        <button 
                            key={i}
                            onClick={() => onSelect(Feature.AI_CHAT, prompt)} 
                            className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-300 text-xs font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all text-right shadow-lg shadow-black/20"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default FeatureSelectionScreen;
