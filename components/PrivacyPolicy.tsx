import React from 'react';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-6">سياسة الخصوصية</h1>
            <div className="space-y-6 text-slate-300 leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">1. مقدمة</h2>
                    <p>
                        أهلاً بك في AI ideas. نحن ملتزمون بحماية خصوصيتك وأمان بياناتك. تشرح هذه السياسة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية عند استخدامك لمنصتنا.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">2. المعلومات التي نجمعها</h2>
                    <ul className="list-disc list-inside space-y-2 pr-4">
                        <li><strong>معلومات الحساب:</strong> عند إنشاء حساب، نجمع اسمك، بريدك الإلكتروني، والصورة الشخصية (اختياري).</li>
                        <li><strong>بيانات المشاريع:</strong> نحفظ الأفكار، الأكواد، الصور، والفيديوهات التي تنشئها على المنصة لتمكينك من الوصول إليها وتعديلها.</li>
                        <li><strong>بيانات الاستخدام:</strong> نجمع معلومات حول كيفية تفاعلك مع خدماتنا، مثل الميزات التي تستخدمها وعدد المرات، وذلك لتحسين الخدمة وتخصيص تجربتك.</li>
                        <li><strong>معلومات الدفع:</strong> عند الترقية، نجمع عنوان محفظتك الرقمية لتأكيد المعاملات. لا نقوم بتخزين أي مفاتيح خاصة.</li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">3. كيف نستخدم معلوماتك</h2>
                    <p>
                        نستخدم المعلومات التي نجمعها للأغراض التالية:
                    </p>
                    <ul className="list-disc list-inside space-y-2 pr-4 mt-2">
                        <li>لتقديم وتشغيل وصيانة خدماتنا.</li>
                        <li>لتحسين وتخصيص وتوسيع خدماتنا.</li>
                        <li>لفهم وتحليل كيفية استخدامك لخدماتنا.</li>
                        <li>لتطوير منتجات وخدمات وميزات ووظائف جديدة.</li>
                        <li>للتواصل معك، سواء بشكل مباشر أو من خلال أحد شركائنا، بما في ذلك خدمة العملاء، وتزويدك بالتحديثات والمعلومات الأخرى المتعلقة بالخدمة، ولأغراض تسويقية وترويجية.</li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">4. مشاركة البيانات</h2>
                    <p>
                        نحن لا نبيع معلوماتك الشخصية أو نشاركها مع أطراف ثالثة لأغراضهم التسويقية. قد نشارك البيانات مع مزودي الخدمة الذين يساعدوننا في تشغيل المنصة (مثل خدمات الاستضافة)، بشرط التزامهم بالحفاظ على سرية بياناتك.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">5. حقوقك</h2>
                    <p>
                        لديك الحق في الوصول إلى معلوماتك الشخصية وتحديثها أو حذفها. يمكنك القيام بذلك من خلال صفحة ملفك الشخصي أو عن طريق الاتصال بنا مباشرة.
                    </p>
                </section>
                <section>
                    <h2 className="text-xl font-semibold text-indigo-400 mb-2">6. التغييرات على هذه السياسة</h2>
                    <p>
                        قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنعلمك بأي تغييرات عن طريق نشر السياسة الجديدة على هذه الصفحة.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;