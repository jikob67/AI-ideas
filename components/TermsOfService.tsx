import React from 'react';

const TermsOfService: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-6">اتفاقية الاستخدام</h1>
            <div className="space-y-6 text-slate-300 leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">1. القبول بالشروط</h2>
                    <p>
                        باستخدامك لمنصة AI ideas، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من الشروط، فلا يجوز لك استخدام الخدمة.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">2. استخدام الخدمة</h2>
                    <ul className="list-disc list-inside space-y-2 pr-4">
                        <li>يجب أن تكون في السن القانوني لإنشاء عقد ملزم لاستخدام خدماتنا.</li>
                        <li>أنت مسؤول عن الحفاظ على أمان حسابك وكلمة المرور الخاصة بك.</li>
                        <li>توافق على عدم استخدام الخدمة لأي غرض غير قانوني أو محظور.</li>
                        <li>لا يجوز لك إنشاء محتوى يتضمن خطاب كراهية، أو عنف، أو مواد ضارة.</li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">3. الملكية الفكرية</h2>
                    <p>
                        أنت تحتفظ بجميع حقوق الملكية للمحتوى الذي تنشئه ("محتوى المستخدم")، بما في ذلك الأفكار والنصوص البرمجية والصور والفيديوهات. ومع ذلك، من خلال استخدام الخدمة، فإنك تمنح AI ideas ترخيصًا عالميًا وغير حصري وخاليًا من حقوق الملكية لاستخدام ونسخ وتعديل وتوزيع محتوى المستخدم الخاص بك لغرض تشغيل وتحسين وتوفير الخدمة.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">4. إخلاء المسؤولية</h2>
                    <p>
                        يتم توفير الخدمة "كما هي" دون أي ضمانات. نحن لا نضمن أن الخدمة ستكون خالية من الأخطاء أو أن مخرجات الذكاء الاصطناعي ستكون دقيقة أو موثوقة دائمًا. يجب عليك مراجعة والتحقق من أي محتوى مهم تم إنشاؤه بواسطة المنصة.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">5. إنهاء الحساب</h2>
                    <p>
                        نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت ولأي سبب، خاصة في حالة انتهاك هذه الشروط.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">6. تعديلات على الشروط</h2>
                    <p>
                        قد نقوم بتعديل هذه الشروط من وقت لآخر. سنبذل جهدًا معقولًا لإعلامك بالتغييرات الجوهرية. استمرار استخدامك للمنصة بعد هذه التغييرات يشكل موافقتك على الشروط الجديدة.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsOfService;