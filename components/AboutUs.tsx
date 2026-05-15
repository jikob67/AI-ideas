import React from 'react';

const AboutUs: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-100 mb-4">عن AI ideas</h1>
                <p className="text-lg text-indigo-400 font-semibold">منصة AI ideas متكاملة لبناء وتصميم وتسويق المشاريع الرقمية.</p>
            </div>
            
            <div className="mt-10 bg-slate-800/50 border border-slate-700 rounded-xl p-8 space-y-6 text-slate-300 leading-relaxed">
                <section>
                    <h2 className="text-2xl font-semibold text-slate-100 mb-3">مهمتنا</h2>
                    <p>
                        مهمتنا في AI ideas هي تمكين المبدعين ورواد الأعمال والمطورين من تحويل أفكارهم الرائعة إلى واقع ملموس بأسرع وأسهل طريقة ممكنة. نحن نؤمن بأن الذكاء الاصطناعي يمكن أن يكون شريكًا إبداعيًا قويًا، يزيل الحواجز التقنية ويتيح للجميع التركيز على جوهر فكرتهم.
                    </p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold text-slate-100 mb-3">ماذا نقدم؟</h2>
                    <p>
                        نحن نقدم مجموعة متكاملة من الأدوات التي تعمل معًا بسلاسة لتحويل فكرتك من مجرد مفهوم إلى مشروع رقمي ناجح. من خلال محادثة واحدة، يمكنك:
                    </p>
                    <ul className="list-disc list-inside space-y-2 pr-4 mt-4">
                        <li><strong>بناء المشاريع:</strong> حوّل أفكارك إلى أي نوع من المشاريع البرمجية، من تطبيقات ومواقع إلى أنظمة متكاملة، مع أكواد نظيفة وقابلة للتخصيص.</li>
                        <li><strong>إنشاء المحتوى المرئي:</strong> صمم صورًا فنية، حوّل رسوماتك إلى لوحات رقمية، وأنشئ فيديوهات ترويجية مذهلة، كل ذلك بقوة الذكاء الاصطناعي.</li>
                        <li><strong>التسويق والنمو:</strong> احصل على استراتيجيات تسويقية مخصصة، واقتراحات للمحتوى، وأفكار تصميمية تساعدك على الوصول إلى جمهورك المستهدف.</li>
                        <li><strong>أتمتة المهام:</strong> دع الذكاء الاصطناعي يساعدك في المهام اليومية، من تحليل البيانات إلى كتابة المحتوى، مما يوفر لك الوقت للتركيز على النمو.</li>
                    </ul>
                </section>
                 <section>
                    <h2 className="text-2xl font-semibold text-slate-100 mb-3">ميزات المنصة</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-indigo-300">الصفحة الرئيسية</h3>
                            <p className="text-sm">واجهة الموقع التي تعرض ما يمكن فعله من خلاله وأمثلة للتطبيقات التي تم إنشاؤها.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">إنشاء التطبيق</h3>
                            <p className="text-sm">القسم الخاص ببدء تصميم التطبيق واختيار الإعدادات الأساسية مثل الاسم، النوع، الأقسام التي يحتويها التطبيق.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">الأقسام</h3>
                            <p className="text-sm">من هذا القسم يمكنك إضافة أو تعديل أو حذف الأقسام داخل التطبيق مثل الدردشة، البحث عن مستخدمين، وغيرها.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">التصميم</h3>
                            <p className="text-sm">لتحديد الألوان، الأيقونة، شاشة التحميل، القوائم، وغيرها من خيارات التصميم.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">الربح من التطبيق</h3>
                            <p className="text-sm">قسم خاص لإضافة الإعلانات وكيفية الربح من التطبيق.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">تحميل التطبيق</h3>
                            <p className="text-sm">يتيح لك تنزيل التطبيق على جهازك لمعاينته ومتابعة التعديلات دون الحاجة لإعادة رفعه دائماً.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">نشر التطبيق على Google Play</h3>
                            <p className="text-sm">إرشادات لنشر التطبيق على متجر جوجل بلاي.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">الصيانة والتحديث</h3>
                            <p className="text-sm">إدارة التحديثات والتعديلات بعد نشر التطبيق.</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-indigo-300">معرض التطبيقات وأمثلة</h3>
                            <p className="text-sm">يعرض أمثلة لتطبيقات تم إنشاؤها بواسطة المنصة.</p>
                        </div>
                    </div>
                </section>
                 <section>
                    <h2 className="text-2xl font-semibold text-slate-100 mb-3">رؤيتنا</h2>
                    <p>
                        نحن نسعى لأن نكون المنصة الرائدة التي تدمج بين الإبداع البشري والقدرات الفائقة للذكاء الاصطناعي، لخلق مستقبل يكون فيه بناء المشاريع الرقمية متاحًا للجميع، بغض النظر عن خلفيتهم التقنية.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default AboutUs;