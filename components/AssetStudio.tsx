import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SparklesIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BeakerIcon,
  CodeIcon,
  PlusIcon as SquaresPlusIcon,
  PhotoIcon,
  RocketLaunchIcon as Square3Stack3DIcon,
  RocketLaunchIcon as PaintBrushIcon,
  RocketLaunchIcon as WrenchIcon,
  RocketLaunchIcon as CpuChipIcon
} from './Icons';
import { geminiService } from '../services/geminiService';

type AssetType = 'icon' | 'pattern' | 'button' | 'card' | 'navbar';

export const AssetStudio: React.FC<{ context?: any }> = ({ context }) => {
  const [selectedType, setSelectedType] = useState<AssetType>('icon');
  const [prompt, setPrompt] = useState(context?.project ? `مشروع ${context.project.name}: ${context.project.description}` : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    try {
      let fullPrompt = '';
      switch (selectedType) {
        case 'icon':
          fullPrompt = `Create a high-quality icon design based on: ${prompt}. Minimalist, vector style, for a modern UI.`;
          break;
        case 'pattern':
          fullPrompt = `Generate a seamless web background pattern design (CSS or SVG) based on: ${prompt}. Elegant and subtle.`;
          break;
        case 'button':
          fullPrompt = `Generate a modern CSS/HTML button component with unique hover effects based on: ${prompt}. Return full code.`;
          break;
        case 'card':
          fullPrompt = `Design a beautiful responsive UI card component (HTML/Tailwind) for: ${prompt}. Dark mode friendly.`;
          break;
        default:
          fullPrompt = prompt;
      }

      // For code types, we use generateText, for visuals we use generateImage
      if (['icon', 'pattern'].includes(selectedType)) {
        const base64 = await geminiService.generateImage(fullPrompt, 'ai_asset');
        setResult(`data:image/png;base64,${base64}`);
      } else {
        const code = await geminiService.generateText(`${fullPrompt}. Return ONLY the HTML/Tailwind/CSS code in a code block.`);
        const match = code.match(/```(?:html)?([\s\S]*?)```/);
        setResult(match ? match[1].trim() : code);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const types: { id: AssetType; label: string; icon: any; color: string }[] = [
    { id: 'icon', label: 'أيقونات ذكية', icon: SparklesIcon, color: 'text-amber-400' },
    { id: 'pattern', label: 'أنماط خلفية', icon: PaintBrushIcon, color: 'text-pink-400' },
    { id: 'button', label: 'أزرار تفاعلية', icon: Square3Stack3DIcon, color: 'text-blue-400' },
    { id: 'card', label: 'بطاقات واجهة', icon: SquaresPlusIcon, color: 'text-purple-400' },
    { id: 'navbar', label: 'أشرطة ملاحة', icon: WrenchIcon, color: 'text-green-400' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto font-sans h-full flex flex-col overflow-hidden">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-white flex items-center justify-center gap-3">
          <BeakerIcon className="w-10 h-10 text-indigo-400" />
          استوديو الأصول (Asset Studio)
        </h1>
        <p className="text-slate-400 mt-2 text-lg">صمم أدق تفاصيل واجهتك باستخدام قوى الذكاء الاصطناعي</p>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 flex flex-col items-center gap-8 mb-8">
        <div className="flex flex-wrap justify-center gap-4">
          {types.map(t => (
             <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`p-4 rounded-2xl flex flex-col items-center gap-3 transition-all border-2 w-32 ${
                selectedType === t.id 
                  ? 'bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : 'bg-slate-900 border-transparent hover:border-slate-700'
              }`}
             >
               <t.icon className={`w-8 h-8 ${t.color}`} />
               <span className={`text-xs font-bold ${selectedType === t.id ? 'text-white' : 'text-slate-500'}`}>{t.label}</span>
             </button>
          ))}
        </div>

        <div className="w-full max-w-2xl relative">
          <input 
            type="text" 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`صف ما تريد تصميمه (مثلاً: ${selectedType === 'icon' ? 'أيقونة محفظة رقمية بلون ذهبي' : 'زر متوهج بستايل سايبربانك'})...`}
            className="w-full bg-slate-950 border border-slate-800 p-5 pr-14 rounded-2xl text-white focus:outline-none focus:border-indigo-500 transition-all text-lg shadow-inner"
          />
          <CpuChipIcon className="absolute left-5 top-5 w-7 h-7 text-slate-700" />
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 px-6 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
            إنشاء
          </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 border border-slate-800 rounded-3xl p-8 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {!result && !isGenerating ? (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="flex-1 flex flex-col items-center justify-center text-center text-slate-600"
            >
              <PhotoIcon className="w-20 h-20 mb-4 opacity-20" />
              <p className="text-xl">تظهر النتائج هنا بعد الإنشاء</p>
            </motion.div>
          ) : isGenerating ? (
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center gap-6"
             >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                  <SparklesIcon className="absolute inset-0 m-auto w-10 h-10 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-lg mb-1">يقوم الذكاء الاصطناعي بنحت أصلك...</p>
                  <p className="text-slate-500 text-sm">عملية دقيقة لضمان أعلى جودة ممكنة</p>
                </div>
             </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-400" />
                   تم الإنشاء بنجاح
                </h3>
                <div className="flex gap-2">
                  <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl text-slate-300 transition-all border border-slate-700">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-900 rounded-2xl p-6 flex items-center justify-center overflow-auto border border-white/5 shadow-2xl">
                 {['icon', 'pattern'].includes(selectedType) ? (
                    <img src={result!} alt="Generated Asset" className="max-w-full max-h-full rounded-xl shadow-2xl" />
                 ) : (
                    <div className="w-full h-full flex flex-col">
                       <div className="flex-1 p-4 bg-slate-950 rounded-xl font-mono text-sm text-indigo-300 overflow-auto border border-slate-800" dir="ltr">
                          <pre>{result}</pre>
                       </div>
                       <div className="mt-4 flex items-center justify-center p-8 bg-white/5 rounded-xl border border-white/5">
                          <div dangerouslySetInnerHTML={{ __html: result! }} />
                       </div>
                    </div>
                 )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
