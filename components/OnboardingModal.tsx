import React from 'react';
import { CloseIcon, SparklesIcon, CommandLineIcon, PaintBrushIcon, RocketLaunchIcon } from './Icons';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const features = [
    { name: 'بناء المشاريع', icon: <CommandLineIcon className="w-6 h-6 text-indigo-400" />, description: 'حوّل أفكارك إلى كود برمجي فعال عبر أقسام مثل "فكرة إلى كود" و "نص إلى كود".' },
    { name: 'المساعد الذكي', icon: <SparklesIcon className="w-6 h-6 text-purple-400" />, description: 'استخدم أدوات الذكاء الاصطناعي لإنشاء صور، فيديوهات، وتحليل البيانات.' },
    { name: 'الإبداع الفني', icon: <PaintBrushIcon className="w-6 h-6 text-rose-400" />, description: 'حوّل صورك إلى أعمال فنية بأنماط مختلفة باستخدام "محول الفنون".' },
    { name: 'النمو والتسويق', icon: <RocketLaunchIcon className="w-6 h-6 text-green-400" />, description: 'استكشف "معزز المشاريع" و "المحتوى التسويقي" لنشر إبداعاتك والوصول لجمهور أوسع.' }
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors z-10"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        
        <div className="text-center">
            <h2 className="text-3xl font-bold text-white">مرحبًا بك في AI ideas!</h2>
            <p className="text-slate-400 mt-2">لمحة سريعة لمساعدتك على البدء.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map(feature => (
                <div key={feature.name} className="flex items-start gap-4">
                    <div className="flex-shrink-0 bg-slate-700/50 p-3 rounded-lg">
                        {feature.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">{feature.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
        
        <div className="mt-8 text-center">
            <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded-lg"
            >
                ابدأ الآن!
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;