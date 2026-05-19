import React from 'react';
import { 
  LightBulbIcon, 
  AcademicCapIcon, 
  QuestionMarkCircleIcon, 
  CommandLineIcon, 
  RocketLaunchIcon,
  SparklesIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from './Icons';
import { motion } from 'motion/react';

export const GuideBoard: React.FC = () => {
    const sections = [
        {
            title: 'كيف تبدأ؟',
            icon: <RocketLaunchIcon className="w-6 h-6 text-indigo-400" />,
            steps: [
                'اختر طريقة البناء المناسبة (فكرة، نص، شاشة، أو مخطط).',
                'أوصف مشروعك بدقة للذكاء الاصطناعي.',
                'اضغط على "توليد الكود" وانتظر المعالجة.',
                'انتقل إلى المجلد البرمجي لمشاهدة الملفات.'
            ]
        },
        {
            title: 'دورة حياة المشروع',
            icon: <AcademicCapIcon className="w-6 h-6 text-emerald-400" />,
            steps: [
                'البناء: استخدام أدوات التوليد الآلي.',
                'المعاينة: التحقق من النتيجة في قسم "المعاينة والتحقق".',
                'التعديل: استخدام المساعد الذكي لإضافة ميزات جديدة.',
                'النشر: مشاركة المشروع في معرض المجتمع.'
            ]
        },
        {
            title: 'الأدوات المتقدمة',
            icon: <SparklesIcon className="w-6 h-6 text-purple-400" />,
            steps: [
                'Asset Studio: لإنشاء أيقونات وشعارات احترافية.',
                'Marketing: لتوليد حملات تسويقية لمشروعك.',
                'SEO Optimizer: لتحسين ظهور مشروعك في محركات البحث.',
                'Analysis: لتحليل كود المشروع وجودة الواجهات.'
            ]
        }
    ];

    return (
        <div className="flex flex-col h-full bg-slate-950 font-sans">
            <div className="p-8 max-w-5xl mx-auto w-full">
                <header className="mb-12 text-center">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 bg-indigo-600/10 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/20 mb-4"
                    >
                        <AcademicCapIcon className="w-4 h-4" />
                        <span className="text-sm font-bold">الأكاديمية التعليمية</span>
                    </motion.div>
                    <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">دليل منصة AI Ideas</h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">تعرف على كيفية الانتقال من مجرد فكرة إلى واقع ملموس وتطبيق متكامل باستخدام قوة الذكاء الاصطناعي.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {sections.map((section, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform">
                                {section.icon}
                            </div>
                            <h2 className="text-xl font-bold text-white mb-6 underline decoration-indigo-500 decoration-2 underline-offset-8">{section.title}</h2>
                            <ul className="space-y-4">
                                {section.steps.map((step, sIdx) => (
                                    <li key={sIdx} className="flex gap-3 items-start text-slate-300 text-sm leading-relaxed">
                                        <CheckCircleIcon className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-16 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-8 overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-4">نصيحة الخبراء 💡</h2>
                        <p className="text-indigo-200/80 leading-relaxed max-w-3xl">
                            للحصول على أفضل النتائج، حاول أن تكون وصفياً قدر الإمكان عند استخدام أدوات التوليد من النص. 
                            بدلاً من قول "أريد صفحة دخول"، جرب "صمم صفحة دخول عصرية بأسلوب زجاجي (Glassmorphism) تتضمن حقلين للبريد وكلمة المرور مع خلفية متحركة".
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <LightBulbIcon className="w-32 h-32 text-white" />
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-500 text-sm flex items-center justify-center gap-2">
                        <QuestionMarkCircleIcon className="w-4 h-4" />
                        هل زلت بحاجة للمساعدة؟ <button className="text-indigo-400 hover:underline font-bold">تواصل مع الدعم الفني</button>
                    </p>
                </div>
            </div>
        </div>
    );
};
