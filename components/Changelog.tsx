import React from 'react';

const changelogData = [
    {
        version: 'v1.4.0',
        date: '2024-08-02',
        changes: [
            { type: 'improved', text: 'فكرة إلى كود: تحسينات على ساحر الأفكار لدعم صقل الأفكار بشكل أعمق وتحديد الميزات بدقة أكبر.' },
            { type: 'improved', text: 'نص إلى كود: دعم رفع ملفات متعددة (صور، صوت) لتوفير سياق أكثر ثراءً عند بناء المشروع.' },
            { type: 'improved', text: 'شاشة إلى كود: زيادة دقة التعرف على المكونات المعقدة وحالات التحميل.' },
            { type: 'new', text: 'محلل الواجهات: إضافة تحليل لتدفق المستخدم (User Flow) واقتراحات لتحسينه.' },
            { type: 'new', text: 'تحليل البيانات: دعم استيراد البيانات مباشرة من Google Sheets و Excel.' },
            { type: 'improved', text: 'كاشف المحتوى الذكي: زيادة دقة الكشف عن المحتوى الصوتي والمرئي.' },
            { type: 'new', text: 'مساعد AI الشامل: إضافة ذاكرة للمحادثات السابقة بين الجلسات.' },
            { type: 'new', text: 'محادثة مباشرة: دعم مكالمات الفيديو التجريبية مع تحليل فوري للصور.' },
            { type: 'new', text: 'معزز المشاريع: إضافة نظام تقييم وتعليقات من المستخدمين الآخرين.' },
            { type: 'improved', text: 'المحتوى التسويقي: توليد حملات إعلانية متكاملة (صور + نصوص + استهداف).' },
            { type: 'new', text: 'مصدر ربح: إضافة تكامل تجريبي مع Stripe لقبول المدفوعات والاشتراكات مباشرة.' },
            { type: 'improved', text: 'محول الفنون: دعم أنماط فنية جديدة وإمكانية دمج الأنماط.' },
            { type: 'new', text: 'قوالب احترافية: إضافة مكتبة قوالب جاهزة للاستخدام الفوري.' },
            { type: 'improved', text: 'سلة المحذوفات: إمكانية معاينة المشاريع قبل استعادتها.' },
            { type: 'new', text: 'الملف الشخصي: إضافة صفحة إحصائيات شخصية تظهر أكثر الميزات استخدامًا.' },
            { type: 'improved', text: 'لمحة / نبذة: تحديث دليل البدء ليشمل فيديوهات تعليمية قصيرة.' },
            { type: 'improved', text: 'الدعم الفني: ربط الدعم الفني بمشاريع المستخدم لحل المشاكل بشكل أسرع.' },
            { type: 'fixed', text: 'سجل التغييرات: تحسين تصميم الصفحة لسهولة القراءة والوصول.' },
        ]
    },
    {
        version: 'v1.3.0',
        date: '2024-07-31',
        changes: [
            { type: 'new', text: 'إضافة ساحر "فكرة إلى كود" التفاعلي لتطوير الأفكار قبل بنائها.' },
            { type: 'new', text: 'إضافة ميزة "توصيات الربح" الذكية في قسم مصدر الربح.' },
            { type: 'new', text: 'إضافة إمكانية استبدال النقاط بباقات Pro في الملف الشخصي.' },
            { type: 'improved', text: 'تحديث "محلل الواجهات" لعرض قائمة بالمكونات المكتشفة.' },
            { type: 'improved', text: 'تمكين تحديث المعاينة الحية للقوالب الاحترافية عند تغيير الألوان والخطوط.' },
            { type: 'improved', text: 'إضافة اقتراحات ذكية للسمات والخطوط في مولد القوالب.' },
            { type: 'improved', text: 'دعم عرض النسخ النصي المباشر في "المحادثة المباشرة".' },
            { type: 'improved', text: 'تحسين واجهة "نص إلى كود" و "شاشة إلى كود" لدعم رفع ملفات سياق إضافية.' },
            { type: 'improved', text: 'تفعيل الردود المتدفقة في "الدعم الفني" لتجربة أسرع.' },
            { type: 'improved', text: 'إضافة اقتراحات ذكية للمحتوى في قسم "المحتوى التسويقي".' },
            { type: 'improved', text: 'تحسين عرض القائمة في لوحة التحكم وإضافة إجراءات سريعة.' },
        ]
    },
    {
        version: 'v1.2.0',
        date: '2024-07-28',
        changes: [
            { type: 'new', text: 'إضافة ميزة "كاشف المحتوى الذكي" للكشف عن النصوص والصور التي تم إنشاؤها بواسطة AI.' },
            { type: 'new', text: 'إضافة صفحة سجل التغييرات (Changelog) لعرض آخر التحديثات.' },
            { type: 'improved', text: 'تحسين أداء مولّد القوالب الاحترافية.' },
            { type: 'fixed', text: 'إصلاح مشكلة في محرر الأقسام عند حفظ إعدادات الإعلانات.' },
        ]
    },
    {
        version: 'v1.1.0',
        date: '2024-07-25',
        changes: [
            { type: 'new', text: 'إطلاق ميزة "تحليل البيانات" مع تصور مرئي.' },
            { type: 'improved', text: 'تحسين واجهة المستخدم في قسم "معزز المشاريع".' },
            { type: 'fixed', text: 'إصلاح مشكلة عدم ظهور أيقونة المشروع في بعض الحالات.' },
        ]
    },
    {
        version: 'v1.0.0',
        date: '2024-07-20',
        changes: [
            { type: 'new', text: 'الإطلاق الأولي لمنصة AI ideas.' },
        ]
    }
];

const Changelog: React.FC = () => {
    
    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'new': return 'changelog-badge-new';
            case 'improved': return 'changelog-badge-improved';
            case 'fixed': return 'changelog-badge-fixed';
            default: return 'bg-gray-700 text-gray-300';
        }
    };
    
    const getBadgeText = (type: string) => {
        switch (type) {
            case 'new': return 'جديد';
            case 'improved': return 'تحسين';
            case 'fixed': return 'إصلاح';
            default: return type;
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-800/30 animate-fade-in">
            <header className="flex-shrink-0 p-4 border-b border-slate-700 text-center">
                <h1 className="text-2xl font-bold text-white">سجل التغييرات</h1>
                <p className="text-slate-400 mt-1">آخر التحديثات والإصلاحات والميزات الجديدة للمنصة.</p>
            </header>
            <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-3xl mx-auto space-y-12">
                    {changelogData.map(entry => (
                        <div key={entry.version}>
                            <div className="flex items-baseline gap-4">
                                <h2 className="text-2xl font-bold text-slate-100">{entry.version}</h2>
                                <p className="text-sm text-slate-400">{entry.date}</p>
                            </div>
                            <ul className="mt-4 space-y-3 border-r border-slate-700 pr-6">
                                {entry.changes.map((change, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className={`changelog-badge ${getBadgeClass(change.type)}`}>
                                            {getBadgeText(change.type)}
                                        </span>
                                        <p className="text-slate-300">{change.text}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Changelog;