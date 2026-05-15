
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { View, ProjectType } from './types';
import { 
  ArrowRightIcon, 
  ArrowLeftIcon, 
  UploadIcon, 
  CheckIcon,
  RocketLaunchIcon,
  TypeIcon,
  FileTextIcon,
  ImageIcon,
  GlobeIcon,
  LoaderIcon
} from './components/Icons';

interface LinkWizardProps {
  navigate: (view: View, context?: any) => void;
}

export const LinkWizard: React.FC<LinkWizardProps> = ({ navigate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    icon: null as string | null,
    name: '',
    url: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, icon: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
    else handleSubmit();
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLogs(['جاري تحليل الرابط...', 'جاري جلب محتوى الصفحة...', 'جاري معالجة البيانات بالذكاء الاصطناعي...']);
    
    // Simulate project creation or redirect to urlToCode logic
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to urlToCode with the pre-filled data
      navigate('urlToCode', { 
        initialProject: {
          name: formData.name,
          description: formData.description,
          url: formData.url,
          iconUrl: formData.icon,
          type: ProjectType.WEBSITE
        }
      });
    }, 2000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">رفع آيقونة المشروع</h2>
              <p className="text-slate-400">اختر صورة تعبر عن هوية مشروعك الجديد</p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group"
            >
              {formData.icon ? (
                <div className="relative">
                  <img src={formData.icon} alt="Icon Preview" className="w-32 h-32 rounded-2xl object-cover shadow-2xl border-4 border-slate-800" />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                    <CheckIcon className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UploadIcon className="w-10 h-10 text-slate-400 group-hover:text-indigo-400" />
                  </div>
                  <span className="text-slate-300 font-medium">اضغط هنا لرفع الصورة</span>
                  <span className="text-slate-500 text-sm mt-2">PNG, JPG (أقصى حجم 2MB)</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleIconUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TypeIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">تسمية المشروع</h2>
              <p className="text-slate-400">ما هو الاسم الذي اخترته لمشروعك؟</p>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="مثال: متجر السعادة، تطبيق اللياقة..."
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600"
                autoFocus
              />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GlobeIcon className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">رابط الموقع المرجعي</h2>
              <p className="text-slate-400">أدخل الرابط الذي تريد بناء المشروع بناءً عليه</p>
            </div>

            <div className="relative">
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600"
                autoFocus
              />
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileTextIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">وصف المشروع</h2>
              <p className="text-slate-400">اشرح ما تريد تعديله أو إضافته على الفكرة الأساسية</p>
            </div>

            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب وصفاً تفصيلياً هنا..."
                rows={5}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-slate-600 resize-none"
                autoFocus
              />
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 h-full flex flex-col justify-center">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1 relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                  s <= step ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {s < step ? <CheckIcon className="w-6 h-6" /> : s}
              </div>
              <span className={`text-xs mt-2 font-medium transition-colors ${s <= step ? 'text-indigo-400' : 'text-slate-600'}`}>
                {s === 1 ? 'الأيقونة' : s === 2 ? 'الاسم' : s === 3 ? 'الرابط' : 'الوصف'}
              </span>
              {s < 4 && (
                <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 transition-all duration-500 ${
                  s < step ? 'bg-indigo-600' : 'bg-slate-800'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 opacity-50" />
        
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all ${
              step === 1 ? 'opacity-0 pointer-events-none' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowRightIcon className="w-5 h-5" />
            السابق
          </button>

          <button
            onClick={nextStep}
            disabled={isSubmitting || (step === 2 && !formData.name) || (step === 3 && !formData.url)}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all shadow-xl ${
              isSubmitting || (step === 2 && !formData.name) || (step === 3 && !formData.url)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-500/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <LoaderIcon className="w-5 h-5 animate-spin" />
                جاري التحليل...
              </>
            ) : (
              <>
                {step === 4 ? 'ابدأ بناء المشروع' : 'التالي'}
                {step === 4 ? <RocketLaunchIcon className="w-5 h-5" /> : <ArrowLeftIcon className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>
      </div>

      {isSubmitting && (
        <div className="mt-8 space-y-2">
          {logs.map((log, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className="text-xs text-slate-500 font-mono text-center"
            >
              {log}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          سيقوم النظام بتحليل الرابط وبناء مشروع HTML + CSS + JS متكامل
        </p>
      </div>
    </div>
  );
};
