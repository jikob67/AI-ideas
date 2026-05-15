import React, { useState, useEffect, useRef } from 'react';
import Auth from './Auth';
import { SparklesIcon, CodeIcon, PaintBrushIcon, DollarSignIcon, ArrowLeftIcon, WrenchScrewdriverIcon, RectangleGroupIcon, LightBulbIcon, RocketLaunchIcon, QuoteIcon, GlobeIcon } from './Icons';
import Footer from './Footer';
import { View } from '../types';

const useTypingEffect = (words: string[], typeSpeed = 100, deleteSpeed = 50, delay = 2000) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(typeSpeed);

    useEffect(() => {
        const handleTyping = () => {
            const currentWord = words[wordIndex % words.length];
            const updatedText = isDeleting
                ? currentWord.substring(0, text.length - 1)
                : currentWord.substring(0, text.length + 1);

            setText(updatedText);

            if (!isDeleting && updatedText === currentWord) {
                setIsDeleting(true);
                setTypingSpeed(delay); // Pause at end of word
            } else if (isDeleting && updatedText === '') {
                setIsDeleting(false);
                setWordIndex(prev => prev + 1);
                setTypingSpeed(typeSpeed);
            } else {
                 setTypingSpeed(isDeleting ? deleteSpeed : typeSpeed);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, wordIndex, words, typeSpeed, deleteSpeed, delay, typingSpeed]);
    
    return text;
};


const LandingPage: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    const [showAuth, setShowAuth] = useState(false);
    const typedText = useTypingEffect(['تطبيقات جوال.', 'مواقع ويب.', 'أنظمة إدارية.', 'متاجر إلكترونية.', 'ألعاب.', 'لوحات تحكم.'], 120, 60, 2500);

     useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        const sections = document.querySelectorAll('.fade-in-section');
        sections.forEach(section => observer.observe(section));

        return () => sections.forEach(section => observer.unobserve(section));
    }, []);

    const features = [
        {
            name: 'بناء من رابط',
            description: 'أدخل رابط أي موقع إلكتروني، وسيقوم الذكاء الاصطناعي بتحليله وبناء مشروع متكامل (HTML, CSS, JS) مستوحى منه.',
            icon: <GlobeIcon className="w-8 h-8 text-indigo-400" />,
        },
        {
            name: 'أنشئ بدون كود',
            description: 'حوّل فكرتك إلى مشروع حقيقي عبر واجهة بسيطة. اترك كتابة الأكواد المعقدة لمهندس الذكاء الاصطناعي.',
            icon: <CodeIcon className="w-8 h-8 text-indigo-400" />,
        },
        {
            name: 'مكونات قوية وجاهزة',
            description: 'أضف ميزات متنوعة مثل الدردشة، الخرائط، المتاجر، وقواعد البيانات بنقرة زر واحدة.',
            icon: <RectangleGroupIcon className="w-8 h-8 text-green-400" />,
        },
        {
            name: 'تصميم يعكس هويتك',
            description: 'تحكم كامل في الألوان والأيقونات وتخطيط الصفحات لإنشاء تصميم فريد يتناسب مع علامتك التجارية.',
            icon: <PaintBrushIcon className="w-8 h-8 text-rose-400" />,
        },
        {
            name: 'حقق الدخل من مشروعك',
            description: 'أضف إعلانات بسهولة أو قم بإنشاء عضويات مدفوعة لتحقيق الربح من مشروعك الرقمي.',
            icon: <DollarSignIcon className="w-8 h-8 text-lime-400" />,
        },
        {
            name: 'نشر فوري',
            description: 'احصل على رابط معاينة حي يعمل فورًا، أو قم تحميل ملفات المشروع كاملة للنشر على أي منصة.',
            icon: <RocketLaunchIcon className="w-8 h-8 text-sky-400" />,
        },
        {
            name: 'صيانة وتحديثات ذكية',
            description: 'اطلب تعديلات أو ميزات جديدة باللغة الطبيعية، وسيقوم الذكاء الاصطناعي بتنفيذها لك.',
            icon: <WrenchScrewdriverIcon className="w-8 h-8 text-amber-400" />,
        },
    ];

    const testimonials = [
        {
            quote: "مذهل! وصفت فكرة نظام إدارة للمخزون، وخلال دقائق حصلت على لوحة تحكم تعمل بكامل طاقتها مع قاعدة بيانات. هذا يتجاوز الخيال.",
            name: "أحمد منصور",
            role: "صاحب متجر"
        },
        {
            quote: "بصفتي مصممة، كنت أبحث دائمًا عن طريقة لتحويل تصاميمي إلى مواقع ويب تفاعلية بسرعة. AI ideas هو الحل الأمثل. أحصل على كود نظيف وتصميم مطابق.",
            name: "سارة كريم",
            role: "مصممة واجهات"
        },
        {
            quote: "أفضل ما في المنصة هو مساعد الذكاء الاصطناعي. أطلب منه تعديلاً مثل 'أضف قسم للمقالات'، وخلال ثوانٍ أرى التغيير أمامي في المعاينة الحية. إنه مثل وجود مطور خبير بجانبي.",
            name: "يوسف علي",
            role: "صاحب مدونة"
        },
    ];

    if (showAuth) {
        return <Auth onBackToLanding={() => setShowAuth(false)} onNavigate={onNavigate} />;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <header className="sticky top-0 z-50 bg-gray-900/70 backdrop-blur-md border-b border-slate-800">
                <div className="container mx-auto flex justify-between items-center p-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold">AI ideas</span>
                    </div>
                    <button onClick={() => setShowAuth(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-lg transition-transform transform hover:scale-105 flex items-center gap-2">
                        <span>ابدأ الآن</span>
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            
            <main>
                <section className="hero-bg text-center py-20 md:py-32">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-100 leading-tight">
                           حوّل فكرتك إلى مشروع برمجي متكامل
                            <br/>
                            <span className="text-purple-400 inline-block min-h-[50px] md:min-h-[80px]">
                                {typedText}
                                <span className="typing-cursor"></span>
                            </span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-300">
                            منصة AI ideas هي مهندس برمجيات يعمل بالذكاء الاصطناعي. صف فكرتك، وسيقوم النظام بتحليلها، كتابة الكود، تصميم الواجهات، ونشر مشروعك في دقائق.
                        </p>
                         <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={() => setShowAuth(true)} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 text-lg">
                                ابدأ مشروعك الأول مجانًا
                            </button>
                             <a href="#features" className="w-full sm:w-auto bg-slate-700/50 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                                شاهد الميزات
                            </a>
                        </div>
                    </div>
                </section>
                
                 <section className="py-20 fade-in-section">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold">كيف يعمل؟</h2>
                             <p className="mt-4 max-w-xl mx-auto text-slate-400">
                                ثلاث خطوات بسيطة تفصلك عن إطلاق مشروعك للعالم.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border-2 border-indigo-500/50">
                                    <LightBulbIcon className="w-10 h-10 text-indigo-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">1. صف مشروع أحلامك</h3>
                                <p className="text-slate-400">ابدأ بوصف ما تريد بناءه. كلما كنت أكثر تحديدًا، كانت النتيجة أفضل.</p>
                            </div>
                            <div className="flex flex-col items-center">
                                 <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border-2 border-green-500/50">
                                    <SparklesIcon className="w-10 h-10 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">2. يبنيها مهندس الـ AI</h3>
                                <p className="text-slate-400">شاهد الذكاء الاصطناعي وهو يكتب الأكواد، يصمم الواجهات، ويبني مشروعك أمام عينيك.</p>
                            </div>
                             <div className="flex flex-col items-center">
                                 <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 border-2 border-sky-500/50">
                                    <RocketLaunchIcon className="w-10 h-10 text-sky-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">3. تفاعل، عدّل، وانشر</h3>
                                <p className="text-slate-400">تفاعل مع المعاينة الحية، اطلب تعديلات باللغة الطبيعية، ثم انشر مشروعك بنقرة زر.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20 bg-slate-800/20 fade-in-section">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">منصة متكاملة. إمكانيات لا محدودة.</h2>
                            <p className="mt-4 max-w-2xl mx-auto text-slate-400">
                                أدوات قوية تأخذك من الفكرة الأولية إلى النشر والنمو، كلها مدعومة بالذكاء الاصطناعي.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <div key={index} className="glass-card p-6 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group">
                                    <div className="mb-4 transition-transform duration-300 group-hover:scale-110">{feature.icon}</div>
                                    <h3 className="text-xl font-bold text-slate-200 mb-2">{feature.name}</h3>
                                    <p className="text-slate-400">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                 <section id="testimonials" className="py-20 fade-in-section">
                     <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold">يثق بنا المبدعون ورواد الأعمال</h2>
                             <p className="mt-4 max-w-2xl mx-auto text-slate-400">
                                لا تأخذ كلامنا فقط، انظر ماذا يقول مستخدمونا.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {testimonials.map((testimonial, index) => (
                                <div key={index} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 flex flex-col">
                                    <QuoteIcon className="w-8 h-8 text-indigo-500 mb-4" />
                                    <p className="text-slate-300 flex-grow">"{testimonial.quote}"</p>
                                    <div className="mt-4 pt-4 border-t border-slate-700">
                                        <h4 className="font-bold text-white">{testimonial.name}</h4>
                                        <p className="text-sm text-slate-400">{testimonial.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                <section className="py-20 fade-in-section">
                    <div className="container mx-auto px-4 text-center bg-indigo-600/20 py-16 rounded-2xl border border-indigo-500/30">
                         <h2 className="text-3xl md:text-4xl font-bold">هل أنت جاهز لبناء فكرتك القادمة؟</h2>
                         <p className="mt-4 max-w-xl mx-auto text-indigo-200">
                            انضم إلى آلاف المبدعين الذين يستخدمون AI ideas لتحويل أفكارهم إلى واقع.
                         </p>
                         <button onClick={() => setShowAuth(true)} className="mt-8 bg-white hover:bg-slate-200 text-indigo-600 font-bold py-3 px-8 rounded-lg transition-transform transform hover:scale-105 text-lg">
                            ابدأ مشروعك الأول مجانًا
                        </button>
                    </div>
                </section>
            </main>
            
            <Footer navigate={onNavigate} />
        </div>
    );
};

export default LandingPage;