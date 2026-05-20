import React, { useEffect, useRef } from 'react';

interface DevicePreviewProps {
  srcDoc: string;
  device: 'mobile' | 'desktop';
  isVisualEditMode: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

const DevicePreview: React.FC<DevicePreviewProps> = ({ srcDoc, device, isVisualEditMode, iframeRef }) => {
    
    const injectedScript = `
        <script>
            const isEditMode = ${isVisualEditMode};
            
            // Intercept uncaught JavaScript errors
            window.onerror = function(message, source, lineno, colno, error) {
                window.parent.postMessage({
                    type: 'IFRAME_ERROR_DETECTED',
                    payload: { 
                        message: String(message), 
                        lineno: lineno || 0, 
                        colno: colno || 0,
                        type: 'runtime_error'
                    }
                }, '*');
                return false;
            };

            // Intercept unhandled Promise rejections
            window.addEventListener('unhandledrejection', function(event) {
                window.parent.postMessage({
                    type: 'IFRAME_ERROR_DETECTED',
                    payload: { 
                        message: event.reason ? String(event.reason.message || event.reason) : 'Unhandled promise rejection', 
                        type: 'promise_rejection'
                    }
                }, '*');
            });

            // Intercept console.error calls
            console.error = (function(oldError) {
                return function() {
                    oldError.apply(console, arguments);
                    const msg = Array.from(arguments).map(arg => {
                        if (typeof arg === 'object') {
                            try { return JSON.stringify(arg); } catch(e) { return String(arg); }
                        }
                        return String(arg);
                    }).join(' ');
                    
                    window.parent.postMessage({
                        type: 'IFRAME_ERROR_DETECTED',
                        payload: { 
                            message: msg, 
                            type: 'console_error'
                        }
                    }, '*');
                };
            })(console.error);

            function getUniqueSelector(el) {
                if (!el || !el.tagName) return null;
                if (el.id) return \`#\${el.id}\`;
                
                let path = '', parent;
                while ((parent = el.parentElement)) {
                    let tag = el.tagName.toLowerCase();
                    let siblings = Array.from(parent.children);
                    // Filter out script and style tags from siblings to get a stable index
                    let sameTagSiblings = siblings.filter(e => e.tagName === el.tagName);
                    
                    if (sameTagSiblings.length > 1) {
                        let index = sameTagSiblings.indexOf(el);
                        tag += \`:nth-of-type(\${index + 1})\`;
                    }
                    path = tag + (path ? ' > ' + path : '');
                    el = parent;
                    if (el.tagName === 'BODY' || el.tagName === 'HTML') break;
                }
                return path;
            }

            if (isEditMode) {
                document.body.style.cursor = 'crosshair';
                let currentHover = null;
                
                document.addEventListener('mouseover', e => {
                    if (currentHover) currentHover.removeAttribute('data-ve-hover');
                    if(e.target && e.target.setAttribute) {
                       e.target.setAttribute('data-ve-hover', 'true');
                       currentHover = e.target;
                    }
                });
                
                document.addEventListener('mouseleave', () => {
                     if (currentHover) currentHover.removeAttribute('data-ve-hover');
                }, true);

                document.addEventListener('click', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    let targetElement = e.target;
                    
                    // Ignore clicks on watermark
                    if(targetElement.id === 'ai-ideas-watermark') return;

                    let parent = targetElement;
                    let sectionId = null;
                    while(parent && parent.tagName !== 'BODY') {
                        if (parent.tagName === 'SECTION' && parent.id && parent.id.startsWith('sec-')) {
                            sectionId = parent.id;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    
                    // If no section was found, try to find the closest parent section
                    if (!sectionId && targetElement.closest) {
                         const closestSection = targetElement.closest('section[id^="sec-"]');
                         if (closestSection) sectionId = closestSection.id;
                    }

                    const selector = getUniqueSelector(targetElement);
                    const rect = targetElement.getBoundingClientRect();
                    
                    const iframeRect = window.frameElement.getBoundingClientRect();

                    window.parent.postMessage({
                        type: 'VISUAL_EDITOR_ELEMENT_CLICKED',
                        payload: { 
                            selector, 
                            sectionId,
                            tagName: targetElement.tagName, 
                            rect: { 
                                top: rect.top + iframeRect.top, 
                                left: rect.left + iframeRect.left, 
                                width: rect.width, 
                                height: rect.height 
                            } 
                        }
                    }, '*');
                }, true);
            }
        </script>
        <style>
            [data-ve-hover] {
                outline: 2px dashed rgba(79, 70, 229, 0.7) !important;
                outline-offset: 2px;
                box-shadow: 0 0 15px rgba(79, 70, 229, 0.5);
                cursor: crosshair !important;
            }
        </style>
    `;

    const finalSrcDoc = srcDoc.includes('</head>') 
        ? srcDoc.replace('</head>', `${injectedScript}</head>`)
        : `<head>${injectedScript}</head>${srcDoc}`;

    
    const deviceStyles = {
        desktop: 'w-full h-full rounded-lg',
        mobile: 'w-[375px] h-[667px] border-[12px] border-gray-800 rounded-[40px] shadow-2xl'
    };
    
    return (
        <div className="w-full h-full flex items-center justify-center p-2 md:p-4 bg-slate-900 transition-all duration-300">
           <div 
            className={`relative flex-shrink-0 transition-all duration-300 origin-center ${device !== 'desktop' ? 'bg-black' : ''} ${deviceStyles[device]}`}
            style={device === 'desktop' ? {} : { transform: 'scale(0.9)', transformOrigin: 'center' }}
           >
             <iframe
                ref={iframeRef}
                key={isVisualEditMode.toString() + srcDoc} // Force re-render on mode change or content change
                title="Project Preview"
                srcDoc={finalSrcDoc}
                className="w-full h-full border-0 bg-white"
                style={device !== 'desktop' ? { borderRadius: '26px' } : {}}
                sandbox="allow-scripts allow-same-origin"
              />
            {device === 'mobile' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-lg"></div>}
           </div>
        </div>
    );
};

export default DevicePreview;