
import React, { useMemo } from 'react';
import { Project, User, SectionType, DesignConfig, LayoutComponent, StoreProduct, BlogPost } from '../../types';
import DevicePreview from '../DevicePreview';
import { SECTION_DEFINITIONS, HIDDEN_SECTIONS } from '../../constants';


interface PreviewPanelProps {
  project: Project | null;
  currentUser: User | null;
  device: 'desktop' | 'mobile';
  isVisualEditMode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ project, currentUser, device, isVisualEditMode, iframeRef }) => {
    
    const srcDoc = useMemo(() => {
        if (!project) return '<html><body></body></html>';

        const designSection = project.sections.find(s => s.type === SectionType.DESIGN);
        const designConfig = (designSection?.config || {}) as Partial<DesignConfig>;
        const { colors, layout } = {
            colors: designConfig.colors || SECTION_DEFINITIONS.find(d => d.type === SectionType.DESIGN)!.defaultConfig.colors,
            layout: designConfig.layout || SECTION_DEFINITIONS.find(d => d.type === SectionType.DESIGN)!.defaultConfig.layout,
        };
        
        if (!colors || !layout) return '<html><body>إعدادات تصميم المشروع مفقودة.</body></html>';

        const logoUrl = project.iconUrl;
        
        const cssVars = `
            :root {
                --primary-color: ${colors.primary};
                --secondary-color: ${colors.secondary};
                --background-color: ${colors.background};
                --text-color: ${colors.text};
                --header-background-color: ${colors.headerBackground};
            }
        `;

        const sharedCss = `
            /* General styles */
            * { box-sizing: border-box; }
            html { scroll-behavior: smooth; }
            body { font-family: sans-serif; background-color: var(--background-color); color: var(--text-color); margin: 0; }
            h1, h2, h3, h4, h5, h6 { margin: 0; font-weight: 600; }
            p { margin: 0; line-height: 1.6; }
            section { padding: 3rem 2rem; }
            .section-title { font-size: 2.2rem; color: var(--primary-color); margin-bottom: 2rem; border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem; display: inline-block; }

            /* Card styles */
            .card {
                border: 1px solid #374151;
                padding: 1rem;
                border-radius: 12px;
                background: #1f2937;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }

            /* Grid layout */
            .grid { display: grid; gap: 1.5rem; }
            .grid-cols-auto { grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }

            /* Button styles */
            .btn {
                background-color: var(--primary-color);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
                text-decoration: none;
            }
            .btn:hover { background-color: var(--secondary-color); }
            
            /* Form styles */
            .form-group { margin-bottom: 1rem; text-align: right; }
            .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; }
            .form-input, .form-textarea {
                width: 100%;
                background-color: #374151;
                border: 1px solid #4b5563;
                color: var(--text-color);
                padding: 0.75rem;
                border-radius: 6px;
                font-size: 1rem;
            }
            .form-textarea { min-height: 120px; resize: vertical; }

            /* Store Specific */
            .product-card img { width: 100%; aspect-ratio: 1/1; object-fit: cover; border-radius: 8px; }
            .product-card h3 { margin-top: 0.75rem; margin-bottom: 0.25rem; font-size: 1.2rem; }
            .product-card .price { margin: 0; font-weight: bold; color: var(--secondary-color); font-size: 1.4rem; }
            
            /* Blog Specific */
            .blog-post { margin-bottom: 2rem; }
            .blog-post h3 { font-size: 1.8rem; margin-bottom: 0.5rem; color: var(--text-color); }
            .blog-post .meta { font-size: 0.8rem; color: #9ca3af; margin-bottom: 1rem; }
            .blog-post p { opacity: 0.9; line-height: 1.7; }
            .blog-post a { color: var(--primary-color); text-decoration: none; font-weight: 600; }

            /* Chat Specific */
            .chat-container { max-width: 600px; margin: auto; height: 500px; border: 1px solid #374151; border-radius: 8px; display: flex; flex-direction: column; background-color: #111827; }
            .chat-messages { flex-grow: 1; padding: 1rem; overflow-y: auto; }
            .chat-message { display: flex; margin-bottom: 1rem; max-width: 80%; }
            .chat-message .bubble { padding: 0.75rem 1rem; border-radius: 1.2rem; line-height: 1.5; }
            .chat-message.bot { align-self: flex-start; }
            .chat-message.user { align-self: flex-end; }
            .chat-message.bot .bubble { background-color: #374151; border-bottom-left-radius: 0.25rem; }
            .chat-message.user .bubble { background-color: var(--primary-color); color: white; border-bottom-right-radius: 0.25rem; }
            .chat-input { display: flex; padding: 1rem; border-top: 1px solid #374151; gap: 0.5rem; }

            /* User List Specific */
            .user-list-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #1f2937; border-radius: 8px; }
            .user-avatar { width: 50px; height: 50px; border-radius: 50%; background: var(--primary-color); color: white; display:flex; align-items:center; justify-content:center; font-weight: bold; }
            .user-info h4 { font-size: 1.1rem; }
            .user-info p { font-size: 0.9rem; color: #9ca3af; }

            /* Watermark Style */
            .watermark-overlay { position: fixed; bottom: 10px; right: 10px; padding: 4px 12px; background: rgba(0,0,0,0.7); color: white; font-size: 12px; border-radius: 20px; pointer-events: none; font-family: sans-serif; z-index: 99999; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1); }
        `;

        const renderComponents = (components: LayoutComponent[] = []) => {
            return components.map(c => {
                if (c.type === 'link') return `<a href="${c.link}" style="color: var(--text-color); text-decoration: none; margin: 0 10px;">${c.text}</a>`;
                if (c.type === 'button') return `<button style="background-color: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 4px; margin: 0 10px; cursor: pointer;">${c.text}</button>`;
                return `<span style="margin: 0 10px;">${c.text}</span>`;
            }).join('');
        };

        const headerHtml = layout.header.enabled ? `
            <header style="background-color: var(--header-background-color); color: var(--text-color); padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; backdrop-filter: blur(10px); background-color: ${colors.headerBackground}99;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="height: 40px; border-radius: 4px;" />` : ''}
                    <h1 style="font-size: 1.5em; margin: 0;">${project.name}</h1>
                </div>
                <nav>${renderComponents(layout.header.components)}</nav>
            </header>` : '';

        const footerHtml = layout.footer.enabled ? `
            <footer style="background-color: var(--header-background-color); color: var(--text-color); padding: 2rem; text-align: center; border-top: 1px solid #374151;">
                ${renderComponents(layout.footer.components)}
            </footer>` : '';

        let bodyContent = project.sections
            .filter(s => !HIDDEN_SECTIONS.includes(s.type))
            .map(section => {
                let content = '';
                
                // Prefer custom HTML content if provided by AI or user, regardless of type
                if (section.config.htmlContent) {
                    content = section.config.htmlContent;
                } else {
                    switch (section.type) {
                        case SectionType.HTML:
                            content = section.config.htmlContent || '';
                            break;
                    case SectionType.STORE:
                        const products = (section.config.products as StoreProduct[]) || [{id: '1', name: 'منتج نموذجي', price: 19.99, imageUrl: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400', description: 'هذا وصف قصير للمنتج.'}];
                        content = `<h2 class="section-title">${section.title}</h2><div class="grid grid-cols-auto">${products.map(p => `<div class="card product-card">
                            <img src="${p.imageUrl}" alt="${p.name}"/>
                            <h3>${p.name}</h3>
                            <div style="display:flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                                <p class="price">${p.price}$</p>
                                <button class="btn">أضف للسلة</button>
                            </div>
                        </div>`).join('') || '<p>لا توجد منتجات لعرضها.</p>'}</div>`;
                        break;
                    case SectionType.BLOG:
                        const posts = (section.config.posts as BlogPost[]) || [{id:'1', title:'عنوان مقالة نموذجية', content: 'هذا هو محتوى المقالة، يمكنك كتابة المزيد هنا...', author: 'المدير', date: new Date().toISOString()}];
                        content = `<h2 class="section-title">${section.title}</h2><div>${posts.map(p => `<div class="blog-post">
                            <h3>${p.title}</h3>
                            <div class="meta">بواسطة ${p.author} بتاريخ ${new Date(p.date).toLocaleDateString('ar-EG')}</div>
                            <p>${p.content.substring(0, 200)}...</p>
                            <a href="#">اقرأ المزيد &rarr;</a>
                        </div>`).join('') || '<p>لا توجد مقالات لعرضها.</p>'}</div>`;
                        break;
                    case SectionType.CHAT:
                         content = `<h2 class="section-title">${section.title}</h2><div class="chat-container">
                            <div class="chat-messages">
                                <div class="chat-message bot"><div class="bubble">مرحباً! كيف يمكنني مساعدتك اليوم؟</div></div>
                                <div class="chat-message user"><div class="bubble">أهلاً، لدي سؤال بخصوص طلبي.</div></div>
                                <div class="chat-message bot"><div class="bubble">بالتأكيد، ما هو رقم طلبك؟</div></div>
                            </div>
                            <div class="chat-input">
                                <input class="form-input" type="text" placeholder="اكتب رسالتك هنا..." />
                                <button class="btn">إرسال</button>
                            </div>
                        </div>`;
                        break;
                    case SectionType.ADS:
                        const adConfig = section.config || {};
                        let adContent = '';
                        if (adConfig.admob?.enabled) {
                            adContent += `
                                <div style="background: #222; border: 1px dashed #555; color: #888; text-align: center; padding: 20px; margin: 20px auto; max-width: 728px; min-height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; border-radius: 8px;">
                                    <p style="margin: 0; font-weight: bold; font-size: 1.2rem;">AdMob Banner Placeholder</p>
                                    ${adConfig.admob.bannerId ? `<p style="margin: 5px 0 0; font-size: 0.8rem;">ID: ${adConfig.admob.bannerId}</p>` : ''}
                                </div>
                            `;
                        }
                        if (adConfig.unity?.enabled) {
                            adContent += `
                                <div style="background: #222; border: 1px dashed #555; color: #888; text-align: center; padding: 20px; margin: 20px auto; max-width: 468px; min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; border-radius: 8px;">
                                    <p style="margin: 0; font-weight: bold; font-size: 1.2rem;">Unity Ad Placeholder</p>
                                    ${adConfig.unity.gameId ? `<p style="margin: 5px 0 0; font-size: 0.8rem;">Game ID: ${adConfig.unity.gameId}</p>` : ''}
                                </div>
                            `;
                        }
                        if (!adContent) {
                            adContent = `<p style="color: #9ca3af; text-align: center;">لم يتم تفعيل أي إعلانات في هذا القسم.</p>`;
                        }
                        content = `<h2 class="section-title">${section.title}</h2>${adContent}`;
                        break;
                    case SectionType.MAP:
                        content = `<h2 class="section-title">${section.title}</h2><div style="height: 500px; border-radius: 8px; overflow: hidden;"><iframe width="100%" height="100%" style="border:0" loading="lazy" allowfullscreen src="https://maps.google.com/maps?q=${section.config.initialLat},${section.config.initialLng}&hl=ar&z=14&amp;output=embed"></iframe></div>`;
                        break;
                    case SectionType.FORM:
                        const fields = section.config.fields || [{label: 'البريد الإلكتروني', name: 'email', type:'email'}];
                        content = `<h2 class="section-title">${section.title}</h2><form style="max-width: 500px; margin: auto; background: #1f2937; padding: 2rem; border-radius: 8px;">
                            ${fields.map((field: any) => `<div class="form-group">
                                <label class="form-label" for="${field.name}">${field.label}</label>
                                ${field.type === 'textarea' ? `<textarea id="${field.name}" name="${field.name}" class="form-textarea"></textarea>` : `<input type="${field.type}" id="${field.name}" name="${field.name}" class="form-input" />`}
                            </div>`).join('')}
                            <button type="submit" class="btn">${section.config.submitText || 'إرسال'}</button>
                        </form>`;
                        break;
                     case SectionType.USERS:
                         content = `<h2 class="section-title">${section.title}</h2><div class="grid" style="grid-template-columns: 1fr;">
                            <div class="user-list-item"><div class="user-avatar">AM</div><div class="user-info"><h4>أحمد محمد</h4><p>ahmed@example.com</p></div></div>
                            <div class="user-list-item"><div class="user-avatar">FS</div><div class="user-info"><h4>فاطمة السيد</h4><p>fatima@example.com</p></div></div>
                         </div>`;
                         break;
                    default:
                        content = `<h2 class="section-title">${section.title}</h2><p style="color: #9ca3af;">(معاينة قسم '${section.type}' قيد التطوير)</p>`;
                }
            }
                // Each section now has a unique ID attribute
                return `<section id="${section.id}">${content}</section>`;
            }).join('\n');
        
        // Strict watermark enforcement for free users
        let watermarkHTML = '';
        if (currentUser?.plan === 'free') {
            watermarkHTML = `<div class="watermark-overlay" id="ai-ideas-watermark">⚡ AI ideas</div>`;
        }

        return `
            <!DOCTYPE html><html lang="ar" dir="rtl">
            <head>
                <title>${project.name}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    ${cssVars}
                    ${sharedCss}
                </style>
            </head>
            <body>
                ${headerHtml}
                <main>${bodyContent}</main>
                ${footerHtml}
                ${watermarkHTML}
            </body></html>
         `;
    }, [project, currentUser]);

    return (
        <DevicePreview 
            srcDoc={srcDoc} 
            device={device as any} 
            isVisualEditMode={isVisualEditMode}
            iframeRef={iframeRef}
        />
    );
};

export default PreviewPanel;
