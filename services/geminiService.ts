import { Type, Modality } from '@google/genai';
import { Project, ProjectFile, ProjectSection, ProjectType, DesignConfig, MarketingSuggestion, MarketingAsset, Message, SectionType, User, ProjectIdea } from '../types';
import { SECTION_DEFINITIONS, getInitialSectionsForProjectType, PLAN_SECTIONS } from '../constants';
import { auth } from '../firebase';

// A helper function to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class GeminiService {
    private static instance: GeminiService;

    private constructor() {}

    public static getInstance(): GeminiService {
        if (!GeminiService.instance) {
            GeminiService.instance = new GeminiService();
        }
        return GeminiService.instance;
    }

    private sanitizeBase64(base64: string): string {
        if (!base64) return "";
        return base64.split(',')[1] || base64;
    }

    private async callGenerate(model: string, contents: any, config?: any, retries: number = 3) {
        try {
            const response = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, contents, config })
            });

            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                let errorMsg = 'Failed to generate content';
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const err = await response.json();
                        errorMsg = err.error || errorMsg;
                    } catch (e) {
                        errorMsg = response.statusText || errorMsg;
                    }
                } else {
                    errorMsg = await response.text();
                    // If it's HTML, just use a generic message with the status
                    if (errorMsg.trim().startsWith('<!DOCTYPE') || errorMsg.trim().startsWith('<html')) {
                        errorMsg = `API Error ${response.status}: ${response.statusText}`;
                    }
                }

                // Handle 429 (Rate Limit) and 503 (Service Unavailable/High Demand)
                if ((response.status === 429 || response.status === 503) && retries > 0) {
                    console.warn(`Gemini API ${response.status} for ${model}, retrying... (${retries} left)`);
                    await delay(3000 * (4 - retries)); // Exponential backoff
                    return this.callGenerate(model, contents, config, retries - 1);
                }
                throw new Error(errorMsg);
            }

            if (contentType && !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Non-JSON response received (Status ${response.status}). Raw: ${text.slice(0, 150)}`);
            }

            return await response.json();
        } catch (error: any) {
            const isRetryable = error.message?.includes('429') || 
                                error.message?.includes('503') || 
                                error.message?.includes('UNAVAILABLE') ||
                                error.message?.includes('Unexpected token') ||
                                error.message?.includes('is not valid JSON') ||
                                error.message?.includes('Non-JSON response');

            if (isRetryable && retries > 0) {
                console.warn(`[Client] Retrying generate due to temporary error: ${error.message}. (${retries} left)`);
                await delay(3000 * (4 - retries));
                return this.callGenerate(model, contents, config, retries - 1);
            }
            throw error;
        }
    }

    private parseAIJson(text: string): any {
        if (!text) throw new Error("Empty response from AI");
        
        // Clean text from possible markdown block markers
        const cleanText = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
        
        try {
            return JSON.parse(cleanText);
        } catch (e) {
            // Attempt to extract the first JSON object found in the text
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const jsonCandidate = cleanText.substring(firstBrace, lastBrace + 1);
                try {
                    return JSON.parse(jsonCandidate);
                } catch (innerE) {
                    console.error("Nested JSON parse failed:", innerE);
                }
            }
            
            console.error("Original JSON parse failed. Raw text:", text.slice(0, 500));
            throw new Error(`Invalid JSON format: ${cleanText.slice(0, 50)}...`);
        }
    }

    private async *callStream(model: string, contents: any, config?: any) {
        const response = await fetch('/api/gemini/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, contents, config })
        });

        if (!response.ok) throw new Error('Streaming failed');
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    yield JSON.parse(line.slice(6));
                }
            }
        }
    }

    // --- Core Generation Methods ---

    async generateContent(prompt: string, model: string = 'gemini-flash-latest', config?: any): Promise<any> {
        const contents = [{ role: 'user', parts: [{ text: prompt }] }];
        return this.callGenerate(model, contents, config);
    }

    async generateText(prompt: string, model: string = 'gemini-flash-latest', config?: any): Promise<string> {
        const result = await this.generateContent(prompt, model, config);
        return result.response.candidates[0].content.parts[0].text;
    }

    async generateTextStream({ prompt, model, systemInstruction, config, onChunk, onComplete }: {
        prompt: string;
        model: string;
        systemInstruction?: string;
        config?: any;
        onChunk: (chunk: string) => void;
        onComplete: () => void;
    }) {
        try {
            const stream = this.callStream(model, [{ role: 'user', parts: [{ text: prompt }] }], {
                ...config,
                ...(systemInstruction && { systemInstruction }),
            });

            for await (const chunk of stream) {
                if (chunk.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    onChunk(chunk.response.candidates[0].content.parts[0].text);
                }
            }
        } catch (e) {
            console.error(`[GeminiService] Error in generateTextStream for model ${model}:`, e);
            onChunk(`\n\n**ERROR**: ${e instanceof Error ? e.message : 'An unknown error occurred.'}`);
        } finally {
            onComplete();
        }
    }
    
    // --- Specific Use Case Methods ---

    async getSupportResponseWithContext(query: string, project: Project | null, images: { base64: string; mimeType: string }[]): Promise<any> {
        const escalateToEmailSupport = {
            name: 'escalateToEmailSupport',
            description: 'تستخدم هذه الدالة عندما لا تتمكن من حل مشكلة المستخدم وتحتاج إلى تصعيدها إلى فريق دعم بشري.',
            parameters: {
                type: Type.OBJECT,
                properties: {
                    summary: {
                        type: Type.STRING,
                        description: 'ملخص موجز لمشكلة المستخدم لملء تذكرة الدعم مسبقًا.',
                    },
                },
                required: ['summary'],
            },
        };

        const systemInstruction = `أنت مساعد دعم فني ذكي لمنصة "AI ideas". مهمتك هي مساعدة المستخدمين في حل مشاكلهم.
        **قواعد المنصة الأساسية**:
        - أي مشروع يجب أن يحتوي دائماً على ثلاث ملفات أساسية: index.html (الهيكل)، style.css (التصميم)، script.js (المنطق). لا يمكن التخلي عن هذا الهيكل.
        - التعديلات الذكية تتم مباشرة على هذه الملفات بدلاً من إنشاء مشروع جديد.
        - أي تقنيات إضافية (مثل APIs أو قواعد بيانات) هي طبقات ثانوية لا تكسر الهيكل الأساسي.

        1.  **حل المشاكل**: قدم إجابات منطقية وحلولاً عملية قابلة للتطبيق مع خطوات واضحة أو أكواد.
        2.  **التوصية**: إذا سأل المستخدم عن كيفية بناء مشروع، قم باقتراح القسم الأنسب له (فكرة إلى كود، نص إلى كود، إلخ).
        3.  **تحليل السياق**: استخدم معلومات المشروع المرفقة ولقطات الشاشة لتشخيص المشكلة بدقة.
        4.  **إصلاح الأخطاء**: إذا كان هناك خطأ، حدد السبب وقدم الحل.
        5.  **التصعيد**: إذا كنت عاجزًا تمامًا عن حل المشكلة، استخدم دالة escalateToEmailSupport لتصعيد الأمر.`;
        
        const parts: any[] = [{ text: query }];

        if (project) {
            const projectContext = { id: project.id, name: project.name, type: project.type, description: project.description, files: (project as any).files?.map((f: any) => f.name) || [] };
            parts.push({ text: `\n\n--- سياق المشروع ---\n${JSON.stringify(projectContext, null, 2)}` });
        }

        images.forEach(image => {
            parts.push({ inlineData: { data: this.sanitizeBase64(image.base64), mimeType: image.mimeType } });
        });

        return this.callGenerate('gemini-flash-latest', [{ role: 'user', parts }], {
            systemInstruction,
            tools: [{ functionDeclarations: [escalateToEmailSupport] }],
        });
    }

    async sendSupportEmail(payload: any): Promise<{ success: boolean }> {
        console.log('Simulating sending email with payload:', payload);
        // This is a mock. In a real app, this would be an API call to a secure backend.
        await delay(2000);
        // Simulate a possible failure
        if (payload.userEmail.includes('fail')) {
            throw new Error("Simulated email sending failure.");
        }
        return { success: true };
    }

     async refinePrompt(prompt: string): Promise<string> {
        const systemInstruction = `You are an expert prompt engineer. Rephrase the following user request to be clearer, more detailed, and better structured for a code generation AI. Do not change the core meaning or add new features. The response must be only the refined prompt text in Arabic, with no extra explanations.`;
        return this.generateText(prompt, 'gemini-flash-latest', { systemInstruction });
    }

    async generateProjectIcon(name: string, description: string): Promise<string> {
        const prompt = `Minimalist, modern, flat vector icon for a digital project. Project name: "${name}". Description: "${description}". The icon should be simple, clean, symbolic, and suitable for a mobile app or website favicon. No text. Centered on a plain, solid-color background.`;
        try {
            const response = await fetch('/api/gemini/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, aspectRatio: '1:1' })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to generate image');
            }
            const data = await response.json();
            if (data.base64) {
                return data.base64;
            }
            throw new Error('No icon was generated.');
        } catch (e) {
            console.warn('[GeminiService] generateProjectIcon failed or rate limited. Using premium safe base64 PNG icon fallback:', e);
            // Fully valid 128x128 transparent PNG base64 that decodes correctly in all browsers even when prefixed with data:image/jpeg;base64
            return "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAAI0lEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAD4Gf/gAAX0YMoAAAAAASUVORK5CYII=";
        }
    }

    async generateSupportResponse(query: string): Promise<string> {
        const systemInstruction = `You are a helpful and friendly customer support agent for a platform called "AI ideas". Your goal is to assist users with their questions about the platform. Be concise and clear. The platform helps users build web apps, mobile apps, and generate marketing content using AI.`;
        return this.generateText(query, 'gemini-flash-latest', { systemInstruction });
    }

    async generateImage(prompt: string, aspectRatio: string): Promise<string> {
        try {
            const response = await fetch('/api/gemini/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, aspectRatio })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to generate image');
            }
            const data = await response.json();
            if (data.base64) {
                return data.base64;
            }
            throw new Error('No image was generated.');
        } catch (e) {
            console.warn('[GeminiService] generateImage failed or rate limited. Using premium safe base64 PNG abstract fallback:', e);
            // Fully valid 128x128 transparent PNG base64 that decodes correctly in all browsers even when prefixed with data:image/jpeg;base64
            return "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAAI0lEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAD4Gf/gAAX0YMoAAAAAASUVORK5CYII=";
        }
    }

    async editImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
        return this.editImageWithText(base64Data, prompt, mimeType);
    }
    
    async editImageWithText(base64Data: string, prompt: string, mimeType: string = 'image/png'): Promise<string> {
        try {
            const result = await this.callGenerate('gemini-2.5-flash-image', [{ 
                role: 'user', 
                parts: [
                    { inlineData: { data: this.sanitizeBase64(base64Data), mimeType: mimeType } },
                    { text: prompt },
                ],
            }], {
                responseModalities: ['image']
            });

            const imagePart = result.response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
            if (imagePart?.inlineData) {
                return imagePart.inlineData.data;
            }
            throw new Error('API did not return an edited image.');
        } catch(e) {
            console.error('[GeminiService] Error in editImageWithText:', e);
            throw e;
        }
    }

    async analyzeImage(base64Data: string, mimeType: string, prompt: string): Promise<string> {
        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ 
                role: 'user', 
                parts: [
                    { inlineData: { data: this.sanitizeBase64(base64Data), mimeType: mimeType } },
                    { text: prompt },
                ]
            }]);
            return result.response.candidates[0].content.parts[0].text;
        } catch (e) {
            console.error('[GeminiService] Error in analyzeImage:', e);
            throw e;
        }
    }

    async analyzeAndCategorizeUI(base64Data: string, mimeType: string): Promise<{ name: string; type: ProjectType; description: string; }> {
        const projectTypes = Object.values(ProjectType).filter(t => ![
            ProjectType.AI_CHAT_MESSAGE, ProjectType.OTHER_FILE, ProjectType.PROJECT_BOOST, ProjectType.MARKETING_GENERATION,
            ProjectType.DIGITAL_DRAWING, ProjectType.TTS, ProjectType.AUDIO_TRANSCRIPTION, ProjectType.UPLOAD_IMAGE_CONTEXT,
            ProjectType.UPLOAD_VIDEO_CONTEXT, ProjectType.UPLOAD_AUDIO_CONTEXT, ProjectType.UPLOAD_FILE_CONTEXT,
            ProjectType.AI_CONTENT_DETECTION, ProjectType.PROJECT_GENERATION, ProjectType.UI_ANALYSIS, ProjectType.SCREENSHOT_TO_CODE,
            ProjectType.DRAW_TO_DIGITAL, ProjectType.GENERATE_LOGO, ProjectType.GENERATE_ICON, ProjectType.GENERATE_IMAGE, ProjectType.GENERATE_VIDEO,
            ProjectType.CODE_CONVERSION
        ].includes(t));

        const systemInstruction = `You are an expert UI/UX analyst. Analyze the provided user interface screenshot. Your task is to identify what the application is, suggest a creative name for a new project inspired by it, identify a suitable project type, and provide a detailed description. This description will be used to generate a similar but legally distinct project. Your output MUST be a valid JSON object. Do not output any other text or markdown.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "A creative project name in Arabic inspired by the UI, but not a direct copy of any brand name." },
                type: { type: Type.STRING, description: "The most suitable project type.", enum: projectTypes as any[] },
                description: { type: Type.STRING, description: "A detailed description in Arabic of the UI's layout, components, and style. This will be used as a prompt for code generation." }
            },
            required: ["name", "type", "description"]
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ 
                role: 'user', 
                parts: [{ inlineData: { data: this.sanitizeBase64(base64Data), mimeType: mimeType } }] 
            }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error('[GeminiService] Error in analyzeAndCategorizeUI:', e);
            throw new Error('فشل الذكاء الاصطناعي في تحليل الواجهة.');
        }
    }

    async convertArt(imageBase64: string, style: string | { imageBase64: string }): Promise<string> {
        const prompt = typeof style === 'string' ?
            `Convert the following image into this style: "${style}".` :
            'Use the style of the second image to redraw the first image.';

        const parts: any[] = [
            { inlineData: { data: this.sanitizeBase64(imageBase64), mimeType: 'image/png' } },
            { text: prompt },
        ];
        
        if(typeof style !== 'string' && style.imageBase64) {
            parts.push({ inlineData: { data: this.sanitizeBase64(style.imageBase64), mimeType: 'image/png' } });
        }
        
        try {
            const result = await this.callGenerate('gemini-2.5-flash-image', [{ role: 'user', parts }], {
                responseModalities: ['image']
            });
            const imagePart = result.response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
            if (imagePart?.inlineData) {
                return imagePart.inlineData.data;
            }
            throw new Error('API did not return a converted image.');
        } catch(e) {
            console.error('[GeminiService] Error in convertArt:', e);
            throw e;
        }
    }

    async completeArt(imageBase64: string, instruction: string): Promise<string> {
        const prompt = `You are an expert artist. Complete and finish the following artistic drawing or sketch. ${instruction}. Maintain the original subject and composition but add details, professional finishing, shading, and a suitable background to make it a complete masterpiece.`;

        const parts: any[] = [
            { inlineData: { data: this.sanitizeBase64(imageBase64), mimeType: 'image/png' } },
            { text: prompt },
        ];
        
        try {
            const result = await this.callGenerate('gemini-2.5-flash-image', [{ role: 'user', parts }], {
                responseModalities: ['image']
            });
            const imagePart = result.response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData);
            if (imagePart?.inlineData) {
                return imagePart.inlineData.data;
            }
            throw new Error('API did not return a completed image.');
        } catch(e) {
            console.error('[GeminiService] Error in completeArt:', e);
            throw e;
        }
    }

    async generateVideo(prompt: string, image: { base64: string; mimeType: string } | null, resolution: '720p' | '1080p', aspectRatio: '16:9' | '9:16', onProgress: (log: string) => void, model?: string, durationSeconds?: number): Promise<string> {
        onProgress('Starting video generation request...');
        const startRes = await fetch('/api/gemini/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, image, model, config: { resolution, aspectRatio, durationSeconds: durationSeconds || 5 } })
        });
        const { operationName } = await startRes.json();

        onProgress('Video generation in progress... this may take several minutes.');
        let checks = 0;
        let permanentUrl: string | null = null;
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            const statusRes = await fetch('/api/gemini/video-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    operationName, 
                    userId: auth.currentUser?.uid || 'anonymous' 
                })
            });
            const status = await statusRes.json();
            if (status.done) {
                permanentUrl = status.response?.generatedVideos?.[0]?.video?.storageUri || null;
                break;
            }
            checks++;
            onProgress(`Checking status (${checks})... still processing.`);
        }

        onProgress('Video generation complete.');
        return permanentUrl || `/api/gemini/video-download?operationName=${encodeURIComponent(operationName)}`;
    }

    // Mock for video analysis as it's not directly supported in the same way
    async analyzeVideo(prompt: string): Promise<string> {
        await delay(2000);
        return `Based on your query "${prompt}", here's a simulated analysis of the video: The video appears to show [mock description]. Key moments include [mock key moments]. The overall sentiment is [mock sentiment]. This is a mock response as direct video analysis is a complex process.`;
    }

    // Mock
    async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
        const result = await this.callGenerate('gemini-flash-latest', [{
            role: 'user',
            parts: [
                { inlineData: { data: this.sanitizeBase64(base64Audio), mimeType: mimeType } },
                { text: 'Transcribe this audio. Return ONLY the transcribed text in Arabic.' }
            ]
        }]);
        return result.response.candidates[0].content.parts[0].text;
    }

    async generateSpeech(text: string): Promise<string> {
        try {
            const response = await fetch('/api/gemini/generate-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to generate speech');
            }
            const data = await response.json();
            if (data.base64) {
                return data.base64;
            }
            throw new Error("API did not return audio data.");
        } catch (e: any) {
            console.error('[GeminiService] Error in generateSpeech:', e);
            throw e;
        }
    }

    // --- Complex Application-Specific Methods (Mocks) ---

    async analyzeData(data: string, query: string): Promise<any> {
        await delay(2000);
        return {
            summary: `This is a summary for the query "${query}". The data seems to contain columns related to sales and dates.`,
            insights: [
                "Insight 1: Sales peaked in the last quarter.",
                "Insight 2: Product 'B' is the top seller.",
                "Insight 3: There is a correlation between marketing spend and sales volume."
            ],
            followUpQuestions: [
                "What is the average sale value?",
                "Which product is the least popular?",
                "Show me a monthly sales trend."
            ],
            visualization: {
                type: 'bar',
                data: [
                    { label: 'Q1', value: Math.floor(Math.random() * 1000) },
                    { label: 'Q2', value: Math.floor(Math.random() * 1000) },
                    { label: 'Q3', value: Math.floor(Math.random() * 1000) },
                    { label: 'Q4', value: Math.floor(Math.random() * 1000) },
                ]
            }
        };
    }
    
    async modifyHtmlWithAI(html: string, command: string): Promise<{ html: string, userMessage: string }> {
        await delay(1500);
        const modifiedHtml = `<!-- AI Modified based on: "${command}" -->\n${html}\n<p style="color: green;">Change applied: ${command}</p>`;
        return {
            html: modifiedHtml,
            userMessage: `تم تنفيذ طلبك: "${command}".`
        };
    }
    
    async modifyHtmlElement(project: Project, sectionId: string, selector: string, command: string): Promise<Project> {
        await delay(2000);
        
        const projectCopy = JSON.parse(JSON.stringify(project));
        const section = projectCopy.sections.find((s: ProjectSection) => s.id === sectionId);

        if (section && section.type === SectionType.HTML && section.config.htmlContent) {
            section.config.htmlContent += `\n<!-- AI MODIFICATION: Command '${command}' applied to selector '${selector}' -->`;
        } else {
            throw new Error("Could not find the specified HTML section or element.");
        }
        
        return projectCopy;
    }

    async generateProjectFromDescription(projectName: string, projectDesc: string, projectType: ProjectType, plan: 'free' | 'premium'): Promise<ProjectSection[]> {
        const availableSectionTypes = PLAN_SECTIONS[plan];
        const systemInstruction = `You are a software architect. Your task is to plan the sections for a new digital project based on user input.
        Based on the project name, description, and type, you must suggest an array of sections.
        You MUST ONLY choose section types from this list: ${availableSectionTypes.join(', ')}.
        Your output MUST be a valid JSON object with a single key "sections" which is an array of section objects.
        Each section object must have "type" and "title" properties.
        For sections of type "HTML", also include a "config" object with an "htmlContent" property containing simple, relevant placeholder HTML in Arabic.
        Example for an online store: { "sections": [ { "type": "HTML", "title": "الصفحة الرئيسية", "config": { "htmlContent": "<h1>أهلاً بك في متجرنا!</h1>" } }, { "type": "STORE", "title": "المتجر" }, { "type": "FORM", "title": "اتصل بنا" } ] }
        `;

        const prompt = `Project Name: ${projectName}\nProject Type: ${projectType}\nProject Description: ${projectDesc}`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                sections: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, enum: availableSectionTypes as any[] },
                            title: { type: Type.STRING },
                            config: {
                                type: Type.OBJECT,
                                properties: {
                                    htmlContent: { type: Type.STRING }
                                }
                            }
                        },
                        required: ['type', 'title']
                    }
                }
            },
            required: ['sections']
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: prompt }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });

            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsed = this.parseAIJson(jsonText);
            
            const designSection: ProjectSection = { 
                id: `sec-${Date.now()}-design`, 
                type: SectionType.DESIGN, 
                title: 'هوية المشروع', 
                config: { 
                    projectName, 
                    projectDescription: projectDesc, 
                    theme: { primary: '#6366f1', secondary: '#a855f7', background: '#0f172a', text: '#f8fafc' },
                    fontPair: { heading: 'Cairo', body: 'Tajawal' }
                } 
            };

            const generatedSections: ProjectSection[] = parsed.sections.map((s: any, i: number) => {
                const definition = SECTION_DEFINITIONS.find(d => d.type === s.type);
                return {
                    id: `sec-${Date.now()}-${i}`,
                    type: s.type,
                    title: s.title,
                    config: s.config || definition?.defaultConfig || {}
                };
            });

            const hasHtml = generatedSections.some(s => s.type === SectionType.HTML);
            const baseHtmlSection: ProjectSection = { id: `sec-${Date.now()}-html`, type: SectionType.HTML, title: 'الصفحة الرئيسية', config: { htmlContent: `<h1>أهلاً بك في ${projectName}!</h1><p>${projectDesc}</p>` } };
            
            return [designSection, ...(hasHtml ? [] : [baseHtmlSection]), ...generatedSections];

        } catch (e) {
            console.error("AI section generation failed, falling back to default.", e);
            return getInitialSectionsForProjectType(projectType, plan, projectName);
        }
    }
    
    async modifyProjectWithAI(project: Project, prompt: string, images?: { base64: string; mimeType: string }[]): Promise<{ updatedProject: Project, aiResponse: string }> {
        const systemInstruction = `You are an AI assistant and expert developer, the 'Intelligent Project Engineer', helping a user modify an existing web project.
        
        **CRITICAL DEVELOPMENT RULES (AI Ideas Core):**
        1. **Mandatory Structure**: The project MUST always maintain these three files: index.html, style.css, script.js. Do NOT delete or rename them.
        2. **Smart Modification**: Modify the code WITHIN these existing files directly based on the user's request. Do not restart from scratch unless explicitly asked to rebuild everything.
        3. **Secondary Modules**: Treat any external APIs, libraries, or backend as secondary layers. They should not affect the permanence of the core HTML/CSS/JS files.
        4. **Complete Output**: You MUST return the FULL and COMPLETED content for all three core files: index.html, style.css, and script.js, even if you only changed one of them.
        5. **No Placeholders**: Never use comments like "rest of code remains same".
        
        The project files are provided below. Your task is to analyze the user's request and apply the required changes.
        IMPORTANT: Your output MUST be a valid JSON object matching the provided schema. The JSON object must contain:
        1. 'aiResponse': A friendly, conversational string in Arabic explaining the changes you made.
        2. 'files': An array of objects, containing the full content for index.html, style.css, and script.js.

        Your response should be professional yet friendly, befitting an 'Intelligent Project Engineer'.`;

        const parts: any[] = [{ text: "Here are the current project files:" }];
        for (const file of ((project as any).files || [])) {
            parts.push({ text: `\n--- FILE: ${file.name} ---\n${file.content}` });
        }

        parts.push({ text: `\n\n--- USER REQUEST ---\n${prompt}` });

        if (images && images.length > 0) {
            images.forEach(image => {
                parts.push({ inlineData: { data: this.sanitizeBase64(image.base64), mimeType: image.mimeType } });
            });
        }

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                aiResponse: { type: Type.STRING, description: "A friendly response in Arabic explaining the changes." },
                files: {
                    type: Type.ARRAY,
                    description: "An array of all files that have been modified.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "The full name of the file, e.g., 'index.html'." },
                            content: { type: Type.STRING, description: "The complete and updated content of the file." }
                        },
                        required: ["name", "content"]
                    }
                }
            },
            required: ["aiResponse", "files"]
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema
            });

            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsed = this.parseAIJson(jsonText) as { aiResponse: string, files: { name: string, content: string }[] };
            
            const updatedProject = { ...project } as any;
            const updatedFiles = [...((project as any).files || [])];

            for (const updatedFile of parsed.files) {
                const fileIndex = updatedFiles.findIndex(f => f.name === updatedFile.name);
                if (fileIndex !== -1) {
                    updatedFiles[fileIndex] = { ...updatedFiles[fileIndex], content: updatedFile.content };
                } else {
                    // Properly handle new files returned by AI
                    updatedFiles.push({
                        name: updatedFile.name,
                        content: updatedFile.content,
                        language: updatedFile.name.endsWith('.html') ? 'html' : 
                                  updatedFile.name.endsWith('.css') ? 'css' : 
                                  updatedFile.name.endsWith('.js') ? 'javascript' : 'text'
                    } as any);
                }
            }
            
            updatedProject.files = updatedFiles;
            return { updatedProject, aiResponse: parsed.aiResponse };

        } catch(e) {
            console.error("Error in modifyProjectWithAI:", e);
            throw new Error("فشل الذكاء الاصطناعي في تعديل المشروع.");
        }
    }
    
    async buildProjectFromSpec(
        payload: { projectName: string, prompt: string; projectType: ProjectType; files: { base64: string; mimeType: string }[], iconUrl?: string | null },
        onLog: (log: string) => void,
        ipProtection: boolean = false
    ): Promise<any> {
        const { projectName, prompt, projectType, files, iconUrl } = payload;
        
        onLog("Starting project generation...");
        await delay(1000);
        onLog("Analyzing project specifications...");
        
        const ipProtectionInstruction = `
        IMPORTANT INTELLECTUAL PROPERTY NOTICE: The user is providing a reference screenshot. You MUST NOT create a direct copy. You are legally and ethically required to make significant modifications to the design, layout, color scheme, and branding to create a new, inspired work. This is to protect the intellectual property of the original source. You must also add a subtle, non-intrusive credit to "AI ideas" in the HTML footer or as a comment in the code (e.g., <!-- Generated by AI ideas -->). The goal is to create a new, functional project inspired by the reference, not a replica.
        `;
        
        const systemInstruction = `You are an advanced AI Web-to-Code Generator system. Your job is to convert any input into a complete, runnable web project.

⚠️ STRICT RULES (NON-NEGOTIABLE)
- Do NOT change anything outside what is explicitly requested.
- Do NOT add features, ideas, improvements, or redesigns on your own.
- Do NOT redesign the system or the output format.
- Only perform code generation based on the selected module.
- Do NOT include explanations unless explicitly requested.
- Do NOT deviate from user instructions.

📌 My MODULES
You operate only within the following modules:
1. ↔️ Steps to Code - Convert step-by-step instructions into a functional web app.
2. 🔗 URL to Code - Rebuild UI/UX from described website structure.
3. 💡 Idea to Code - Generate a full web application from a simple idea.
4. ✍️ Text to Code - Convert text descriptions into structured UI.
5. 📷 Screen to Code - Recreate interface from visual description.
6. 📐 Diagram to Code - Convert wireframes or diagrams into frontend layout.
7. 🧠 UI Analyzer - Analyze UI only if requested. Do not redesign unless asked.
8. 🎨 Professional Templates - Use only if explicitly selected (Dashboard, Landing Page, Login/Register, Ecommerce).
9. 📦 File Conversion Center - Parse code files, merge files, fix structure only if required, keep original intent unchanged.

🎯 CORE TASK
Every input must be converted into a runnable web project.

📤 OUTPUT FORMAT (STRICT)
You MUST return ONLY this JSON format:
{
  "project": {
    "html": "The complete index.html file with inline or linked elements",
    "css": "The complete style.css file with styling definitions",
    "js": "The complete script.js file containing full interaction"
  },
  "preview_format": "index.html ↕️ HTML + CSS + JavaScript",
  "notes": "Any essential notes"
}

👁️ DISPLAY RULE (FOR RENDERING ONLY)
The final project corresponds visually to:
index.html
↕️
HTML + CSS + JavaScript

⚙️ ENGINE RULES
- Always generate complete working code
- No pseudo-code
- No incomplete snippets
- HTML, CSS, JS must be properly connected (index.html must include <link rel="stylesheet" href="style.css"> and <script src="script.js" defer></script>, and tailwind via <script src="https://cdn.tailwindcss.com"></script>)
- Must be runnable in iframe environment

🚀 GOAL
Convert user input into a fully functional web project WITHOUT any modifications beyond the request.

${ipProtection ? ipProtectionInstruction : ''}
`;

        onLog("Connecting to Gemini AI...");
        await delay(1500);

        const contentParts: any[] = [{ text: prompt }];
        if (files && files.length > 0) {
            onLog(`Processing ${files.length} image(s)...`);
            files.forEach(file => {
                contentParts.push({ inlineData: { data: this.sanitizeBase64(file.base64), mimeType: file.mimeType } });
            });
        }
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                project: {
                    type: Type.OBJECT,
                    properties: {
                        html: { type: Type.STRING },
                        css: { type: Type.STRING },
                        js: { type: Type.STRING }
                    },
                    required: ["html", "css", "js"]
                },
                preview_format: { type: Type.STRING },
                notes: { type: Type.STRING }
            },
            required: ["project", "preview_format"]
        };
        
        try {
            onLog("Generating code with Gemini Pro...");
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: contentParts }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });

            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsedOutput = this.parseAIJson(jsonText) as any;

            let htmlContent = '';
            let cssContent = '';
            let jsContent = '';

            if (parsedOutput && parsedOutput.project) {
                htmlContent = parsedOutput.project.html || '';
                cssContent = parsedOutput.project.css || '';
                jsContent = parsedOutput.project.js || '';
            } else if (parsedOutput && parsedOutput.files) {
                const htmlFile = parsedOutput.files.find((f: any) => f.name === 'index.html');
                const cssFile = parsedOutput.files.find((f: any) => f.name === 'style.css');
                const jsFile = parsedOutput.files.find((f: any) => f.name === 'script.js');
                htmlContent = htmlFile?.content || '';
                cssContent = cssFile?.content || '';
                jsContent = jsFile?.content || '';
            }

            const parsed = {
                files: [
                    { name: 'index.html', language: 'html', content: htmlContent },
                    { name: 'style.css', language: 'css', content: cssContent },
                    { name: 'script.js', language: 'javascript', content: jsContent }
                ]
            };

            // Ensure Trinity of files exists
            const requiredFiles = [
                { name: 'index.html', language: 'html', content: '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>Project</title></head><body><h1>Welcome</h1></body></html>' },
                { name: 'style.css', language: 'css', content: 'body { font-family: Cairo, sans-serif; background: #f8fafc; }' },
                { name: 'script.js', language: 'javascript', content: 'console.log("Welcome to AI Ideas!");' }
            ];

            requiredFiles.forEach(req => {
                if (!parsed.files.some(f => f.name === req.name)) {
                    parsed.files.push(req as any);
                }
            });

            // Post-processing to inject logo if provided
            if (parsed.files) {
                parsed.files.forEach(file => {
                    if (file.language === 'html' || file.name.endsWith('.html')) {
                        if (iconUrl) {
                            // Replace placeholder if exists
                            if (file.content.includes('{{PROJECT_ICON_URL}}')) {
                                file.content = file.content.replace(/\{\{PROJECT_ICON_URL\}\}/g, iconUrl);
                            } else {
                                // Force inject if placeholder missing but iconUrl provided
                                const logoHtml = `<img src="${iconUrl}" alt="Logo" class="h-10 w-10 object-contain rounded-md mr-3">`;
                                if (file.content.match(/<header/i)) {
                                     if (file.content.match(/<h1/i)) {
                                         file.content = file.content.replace(/(<h1)/i, `${logoHtml}\n$1`);
                                     } else {
                                         file.content = file.content.replace(/(<header[^>]*>)/i, `$1\n${logoHtml}`);
                                     }
                                } else if (file.content.match(/<body/i)) {
                                    file.content = file.content.replace(/(<body[^>]*>)/i, `$1\n<div class="absolute top-4 left-4 z-50">${logoHtml}</div>`);
                                }
                            }
                        } else {
                            // Cleanup placeholder if no icon
                            file.content = file.content.replace(/\{\{PROJECT_ICON_URL\}\}/g, 'https://placehold.co/40x40?text=Logo');
                        }
                    }
                });
            }

            onLog("Code generation complete. Assembling project...");
            await delay(1000);
            
            const newProject: any = {
                id: `proj-${Date.now()}`,
                name: projectName || 'New Project',
                description: prompt,
                type: projectType,
                files: parsed.files,
                sections: getInitialSectionsForProjectType(projectType, 'free', projectName),
                timestamp: Date.now(),
                isPublished: false,
                isShared: false,
                iconUrl: iconUrl || undefined,
            };

            onLog("Project built successfully!");
            return newProject;
        } catch(e) {
            console.error("Error in buildProjectFromSpec:", e);
            onLog(`فشل: ${e instanceof Error ? e.message : "An unknown error occurred during generation."}`);
            throw new Error("فشل الذكاء الاصطناعي في بناء المشروع.");
        }
    }
    
    async convertProjectFiles(files: ProjectFile[], prompt: string, onLog: (log: string) => void): Promise<ProjectFile[]> {
        onLog("Initializing AI software engineer...");
    
        const systemInstruction = `You are a world-class senior software engineer specializing in code transformation, refactoring, and migration. Your task is to modify a given set of project files based on the user's instructions.
        
        **User's Request:** "${prompt}"
    
        **Instructions:**
        1.  Carefully analyze the user's request and the provided source code.
        2.  Execute the request. This could involve refactoring code, converting it to a new framework, adding a feature, or changing its structure.
        3.  You MUST return the complete, updated content for ALL resulting files. This may include original files that were unchanged, modified files, and entirely new files.
        4.  Your output MUST be a valid JSON object with a single key "files". This key must contain an array of file objects.
        5.  Each file object must have three properties: "name" (string), "language" (string, e.g., 'html', 'css', 'javascript', 'jsx', 'tsx'), and "content" (string).
    
        **Example Output:**
        {
          "files": [
            { "name": "index.html", "language": "html", "content": "<!DOCTYPE html>..." },
            { "name": "App.jsx", "language": "jsx", "content": "import React from 'react'; ..." }
          ]
        }`;
    
        onLog("Preparing project context for AI...");
        const parts: any[] = [{ text: "Source Files:" }];
        files.forEach(file => {
            parts.push({ text: `\n--- FILE: ${file.name} ---\n${file.content}` });
        });
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                files: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            language: { type: Type.STRING },
                            content: { type: Type.STRING }
                        },
                        required: ["name", "language", "content"]
                    }
                }
            },
            required: ["files"]
        };
    
        try {
            onLog("Connecting to Gemini Pro...");
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema
            });

            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsed = this.parseAIJson(jsonText) as { files: ProjectFile[] };
            onLog("Conversion complete!");
            return parsed.files;
        } catch(e) {
            console.error("Error in convertProjectFiles:", e);
            onLog(`فشل: ${e instanceof Error ? e.message : "An unknown error occurred during conversion."}`);
            throw new Error("فشل الذكاء الاصطناعي في تحويل الملفات.");
        }
    }
    
    async generateMarketingSuggestions(project: Project): Promise<MarketingSuggestion[]> {
        await delay(1500);
        return [
            { id: 's1', type: 'strategy', title: 'Instagram Ad Campaign', description: `Target users interested in ${project.type} with visually appealing ads.`, platform: 'Instagram' },
            { id: 's2', type: 'content', title: 'Write 3 Blog Posts', description: `Write 3 blog posts about the benefits of ${project.name} and how it solves user problems.` },
            { id: 's3', type: 'design', title: 'Design a Visual Identity', description: 'Design a logo and visual identity that reflects the project\'s simplicity and power.' }
        ];
    }

    async generateMarketingContent(topic: string): Promise<Partial<MarketingAsset>> {
        await delay(2000);
        return {
            title: `New Ad About: ${topic.substring(0, 30)}`,
            content: `Discover ${topic}! The ultimate solution for all your needs. Get it now and enjoy a unique experience. #SpecialOffer`,
            design: 'linear-gradient(45deg, #6366f1, #a855f7)',
            platform: 'Twitter',
        };
    }

    async analyzeUrlForMarketing(url: string): Promise<{ name: string; description: string; iconUrl: string | null }> {
        const systemInstruction = `You are a web page analyzer. Based on your knowledge of the web, analyze the content of the provided URL.
        1. Extract the project, company, or website name.
        2. Extract a concise, one-sentence description or tagline from the meta description, og:description, or main heading.
        3. Extract the URL of the site's favicon, og:image, or a prominent logo.
        Your output MUST be a valid JSON object with the keys "name", "description", and "iconUrl". If you cannot find a value, return an empty string for "name" and "description", and null for "iconUrl".`;
        
        const prompt = `Analyze this URL: ${url}`;
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                iconUrl: { type: Type.STRING, nullable: true }
            },
            required: ["name", "description", "iconUrl"]
        };
    
        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: prompt }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error('[GeminiService] Error in analyzeUrlForMarketing:', e);
            throw new Error('Failed to analyze URL with AI.');
        }
    }

    async convertProjectToMarketing(project: Project): Promise<MarketingAsset[]> {
        await delay(2500);
        return [
            {
                id: `asset-auto-${Date.now()}`,
                timestamp: Date.now(),
                title: `Announcing ${project.name}!`,
                content: `We're excited to launch ${project.name}, a ${project.type} designed for ${project.description}. Try it now!`,
                design: 'linear-gradient(to right, #0f172a, #1e293b)',
                platform: 'LinkedIn'
            }
        ];
    }
    
    async startBuildForPlatform(project: Project, platform: string, onLog: (log: string) => void): Promise<string> {
        onLog(`Starting build for ${project.name} on platform: ${platform}`);
        await delay(1000);
        onLog("Analyzing project structure...");
        await delay(1500);
        onLog("Compiling assets...");
        await delay(2000);
        onLog("Optimizing code...");
        await delay(1500);
        onLog("Deployment successful!");
        return `https://mock-deploy.ai-ideas.io/${project.id}/${platform}`;
    }

    async analyzeProjectQuality(project: Project): Promise<any> {
        await delay(3000);
        const randomScore = () => 50 + Math.floor(Math.random() * 50);
        const overallScore = randomScore();
        return {
            overallScore: overallScore,
            report: {
                codeOrganization: { score: randomScore(), feedback: 'Code structure is generally good.', suggestions: ['Consider creating a shared utility file.'] },
                performance: { score: randomScore(), feedback: 'Performance is acceptable for most use cases.', suggestions: ['Minify CSS and JS files for faster loading.'] },
                ux: { score: randomScore(), feedback: 'User experience is intuitive.', suggestions: ['Add aria-labels for better accessibility.'] },
                security: { score: randomScore(), feedback: 'Basic security practices are in place.', suggestions: ['Sanitize all user inputs to prevent XSS.'] },
                compatibility: { score: randomScore(), feedback: 'The project is compatible with modern browsers.', suggestions: ['Test on older browser versions.'] },
            }
        };
    }
    
    async generateComponentData(prompt: string): Promise<{ jsx: string; html: string }> {
        await delay(2000);
        const safePrompt = prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return {
            jsx: `// Generated based on: "${safePrompt}"\nconst MyComponent = () => {\n  return (\n    <div className="p-4 bg-blue-500 text-white rounded-lg shadow-md">\n      Hello, this is a generated component!\n    </div>\n  );\n};\n\nexport default MyComponent;`,
            html: `<html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-900 flex items-center justify-center h-screen"><div class="p-4 bg-blue-500 text-white rounded-lg shadow-md">Hello, this is a generated component based on: "${safePrompt}"</div></body></html>`
        };
    }
    
    async generateProfessionalTemplate(project: Project, theme: any, templateCategory: string, fontPair: { heading: string; body: string }): Promise<{ html: string; css: string; js: string }> {
        const googleFontLink = `https://fonts.googleapis.com/css2?family=${fontPair.heading.replace(' ', '+')}:wght@700&family=${fontPair.body.replace(' ', '+')}:wght@400;700&display=swap`;
    
        const systemInstruction = `You are an expert front-end developer and UI/UX designer. Your task is to generate a beautiful, modern, and responsive template for a project with interactive elements.
    
        **Project Details:**
        - Name: "${project.name}"
        - Description: "${project.description}"
        - Template Category: "${templateCategory}"
    
        **Design Tokens:**
        - Primary Color: ${theme.primary}
        - Secondary Color: ${theme.secondary}
        - Background Color: ${theme.background}
        - Text Color: ${theme.text}
        - Heading Font: "${fontPair.heading}"
        - Body Font: "${fontPair.body}"
    
        **Instructions:**
        1.  Generate three files: \`index.html\`, \`style.css\`, and \`script.js\`.
        2.  **HTML File:**
            -   Create a rich, complete HTML structure based on the "${templateCategory}" category. The content should be relevant to the project name and description.
            -   Include interactive elements like buttons, links, and forms. Give them appropriate IDs or classes for JavaScript to target.
            -   Use semantic HTML5 tags.
            -   **Crucially**, include these lines in the \`<head>\`:
                -   \`<script src="https://cdn.tailwindcss.com"></script>\`
                -   \`<link href="${googleFontLink}" rel="stylesheet">\`
            -   Link to \`style.css\` and \`script.js\`. The script tag should be at the end of the body, e.g., <script src="script.js" defer></script>.
            -   Use TailwindCSS utility classes for styling directly in the HTML.
        3.  **CSS File:**
            -   Define CSS variables for colors and fonts in the \`:root\` selector.
            -   Apply the body font and background/text colors. Apply the heading font to headings.
            -   Add hover and active states for buttons and links to make them feel interactive.
            -   Add any necessary custom CSS classes for complex styles not achievable with Tailwind alone.
        4.  **JavaScript File:**
            -   Add interactivity to the template. For example, make a mobile menu toggle, add smooth scrolling for navigation links, or show an alert when a form submission button is clicked.
            -   Ensure all buttons are functional and have a clear purpose.
            -   The code should be well-commented.
    
        Your output MUST be a valid JSON object with three keys: "html", "css", and "js", containing the full content of the respective files as strings. Do not include any other text or markdown.`;
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                html: { type: Type.STRING, description: "The full content of the index.html file." },
                css: { type: Type.STRING, description: "The full content of the style.css file." },
                js: { type: Type.STRING, description: "The full content of the script.js file." }
            },
            required: ["html", "css", "js"]
        };
    
        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: `Generate the template for "${project.name}".` }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error("Error in generateProfessionalTemplate:", e);
            throw new Error("Failed to generate template from AI.");
        }
    }

    async generateProfessionalTemplatePage(project: Project, theme: any, templateCategory: string, fontPair: { heading: string; body: string }, pageName: string, pageTitle: string): Promise<string> {
        const googleFontLink = `https://fonts.googleapis.com/css2?family=${fontPair.heading.replace(' ', '+')}:wght@700&family=${fontPair.body.replace(' ', '+')}:wght@400;700&display=swap`;
    
        const systemInstruction = `You are an expert front-end developer and UI/UX designer. Your task is to generate a beautiful, modern, and responsive sub-page for a professional template.
        
        **Project Details:**
        - Main Project Name: "${project.name}"
        - Sub-page Filename: "${pageName}"
        - Sub-page Title: "${pageTitle}"
        - Template Category: "${templateCategory}"
        
        **Design Tokens:**
        - Primary Color: ${theme.primary}
        - Secondary Color: ${theme.secondary}
        - Background Color: ${theme.background}
        - Text Color: ${theme.text}
        - Heading Font: "${fontPair.heading}"
        - Body Font: "${fontPair.body}"
        
        **Instructions:**
        1. Generate ONLY a clean, complete, and rich HTML string for the requested sub-page.
        2. Ensure the content matches the page title ("${pageTitle}") and is highly relevant to "${project.name}".
        3. Do NOT include <link rel="stylesheet"> or <script src="script.js"> tags as they are injected automatically.
        4. Style it beautifully using TailwindCSS utility classes directly.
        5. Use custom CSS variables or arbitrary tailwind classes if needed to align colors with the design tokens.
        6. Return ONLY the HTML block. Your output MUST be a valid JSON object with a single key "html" containing the raw HTML content string so it parses correctly.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                html: { type: Type.STRING, description: "The full content of the generated HTML page." }
            },
            required: ["html"]
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: `Generate the HTML page for "${pageTitle}" (${pageName}).` }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsed = this.parseAIJson(jsonText);
            return parsed.html;
        } catch (e) {
            console.error("Error in generateProfessionalTemplatePage:", e);
            throw new Error("Failed to generate custom subpage from AI.");
        }
    }

    async getTemplateThemeSuggestion(): Promise<{ primary: string; secondary: string; background: string; text: string; fontPair: { heading: string, body: string } }> {
        const systemInstruction = `You are a UI/UX design expert. Generate a harmonious and modern theme for a web template.
        Your output MUST be a valid JSON object containing:
        1. A color palette with keys: "primary", "secondary", "background", and "text". Use hex codes. Ensure good contrast.
        2. A "fontPair" object with "heading" and "body" keys. Choose two complementary fonts from Google Fonts.
        
        Example: { "primary": "#3b82f6", "secondary": "#8b5cf6", "background": "#111827", "text": "#e5e7eb", "fontPair": { "heading": "Poppins", "body": "Inter" } }`;
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                background: { type: Type.STRING },
                text: { type: Type.STRING },
                fontPair: {
                    type: Type.OBJECT,
                    properties: {
                        heading: { type: Type.STRING },
                        body: { type: Type.STRING }
                    },
                    required: ["heading", "body"]
                }
            },
            required: ["primary", "secondary", "background", "text", "fontPair"]
        };
        
        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: "Generate a new theme." }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch(e) {
            console.error("AI theme suggestion failed, falling back to default.", e);
            return { 
                primary: '#818cf8', 
                secondary: '#c084fc', 
                background: '#1e293b', 
                text: '#f1f5f9',
                fontPair: { heading: 'Cairo', body: 'Tajawal' }
            };
        }
    }
    
    async analyzeAiContent(text: string, media?: { data: string, mimeType: string }): Promise<any> {
        await delay(2000);
        const score = Math.floor(Math.random() * 100);
        let summary = `The analysis suggests a ${score}% probability that this content was generated by AI.`;
        if (media) {
            summary += ` The provided ${media.mimeType.split('/')[0]} seems to contain elements typical of generative models.`
        }

        return {
            aiScore: score,
            summary: summary,
            keyIndicators: [
                "Repetitive sentence structures were detected.",
                "The content lacks personal anecdotes or specific details.",
                "Image analysis shows patterns consistent with diffusion models."
            ]
        };
    }
    
    async generateProjectSpecPart(prompt: string, field: string, spec: any): Promise<any> {
        await delay(1500);
        if (field === 'name') return { name: 'Glowing Flora Shop' };
        if (field === 'description') return { description: 'An e-commerce store specializing in rare, bioluminescent plants.' };
        if (field === 'icon') return { icon: 'https://via.placeholder.com/128/a855f7/FFFFFF?text=G' };
        if (field === 'colors') return { colors: { primary: '#f472b6', secondary: '#a78bfa', background: '#1f2937', text: '#e5e7eb' }};
        return {};
    }

    async generateProjectIdeas(category: string): Promise<{ name: string; description: string; type: ProjectType; suggestedFeatures: string[] }[]> {
        const projectTypes = Object.values(ProjectType).filter(t => !t.includes(' '));
        const systemInstruction = `You are a creative startup incubator and project planner. Your task is to generate 5 innovative and practical project ideas based on a given category.
        - For each idea, provide a creative name, a concise one-sentence description in Arabic, a suitable project type, an array of 3-5 key features for the project.
        - You MUST ONLY choose a project type from this list: ${projectTypes.join(', ')}.
        - Your output MUST be a valid JSON object with a single key "ideas", which is an array of 5 idea objects. Do not output any other text or markdown.`;
        
        const prompt = `Category: ${category}`;

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "The creative name of the project idea in Arabic." },
                  description: { type: Type.STRING, description: "A one-sentence description of the project in Arabic." },
                  type: { type: Type.STRING, enum: projectTypes as any[] },
                  suggestedFeatures: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of 3 to 5 key features for the project idea."
                  }
                },
                required: ['name', 'description', 'type', 'suggestedFeatures']
              }
            }
          },
          required: ['ideas']
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: prompt }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsed = this.parseAIJson(jsonText) as { ideas: { name: string; description: string; type: ProjectType; suggestedFeatures: string[] }[] };
            return parsed.ideas;
        } catch (e) {
            console.error("AI idea generation failed.", e);
            throw new Error("Failed to generate project ideas.");
        }
    }

    async refineProjectIdea(idea: ProjectIdea, refinementRequest: string): Promise<Omit<ProjectIdea, 'type'>> {
        const systemInstruction = `You are a creative project planner. A user has an initial project idea and wants to refine it based on their request.
        Your task is to update the idea's name, description, and key features based on the user's input.
        - If the user suggests a new name, use it. Otherwise, keep the original or slightly tweak it if appropriate.
        - Modify the description to incorporate the user's request.
        - Add, remove, or modify the 'suggestedFeatures' list based on the user's feedback.
        - Maintain the response in Arabic.
        - Your output MUST be a valid JSON object with the keys "name", "description", and "suggestedFeatures".`;
    
        const prompt = `Initial Idea:\nName: ${idea.name}\nType: ${idea.type}\nDescription: ${idea.description}\nFeatures: ${idea.suggestedFeatures.join(', ')}\n\nUser's Refinement Request: "${refinementRequest}"`;
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                suggestedFeatures: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ['name', 'description', 'suggestedFeatures']
        };
    
        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: prompt }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error("AI idea refinement failed.", e);
            throw new Error("Failed to refine project idea.");
        }
    }

    async suggestMoreFeatures(idea: ProjectIdea): Promise<string[]> {
        const systemInstruction = `You are a creative product manager. Based on the provided project idea, suggest 3 to 5 new, relevant features that would enhance the project.
        - Your output MUST be a valid JSON object with a single key "features", which is an array of strings.
        - The features should be in Arabic.
        - Do not repeat existing features.`;
        
        const prompt = `Project Name: ${idea.name}
        Description: ${idea.description}
        Existing Features: ${idea.suggestedFeatures.join(', ')}`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                features: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            },
            required: ['features']
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: prompt }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            const parsed = this.parseAIJson(jsonText) as { features: string[] };
            return parsed.features;
        } catch (e) {
            console.error("AI feature suggestion failed.", e);
            throw new Error("Failed to suggest more features.");
        }
    }

    async analyzeApiEndpoints(files: ProjectFile[]): Promise<{ method: string; path: string; description: string; mockResponse: string; }[]> {
        const systemInstruction = `You are an API analyst. Analyze the provided project files (especially JavaScript files) and extract all API endpoints. For each endpoint, provide the HTTP method, path, a brief description in Arabic, and a realistic JSON mock response as a string. Your output MUST be a valid JSON array of objects, with no other text.`;

        const parts: any[] = [{ text: "Analyze these files to find API endpoints:" }];
        files.forEach(file => {
            parts.push({ text: `\n--- FILE: ${file.name} ---\n${file.content}` });
        });

        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    method: { type: Type.STRING, description: "HTTP method (e.g., GET, POST)." },
                    path: { type: Type.STRING, description: "The endpoint path (e.g., /api/users)." },
                    description: { type: Type.STRING, description: "A brief description in Arabic." },
                    mockResponse: { type: Type.STRING, description: "A stringified JSON mock response." }
                },
                required: ["method", "path", "description", "mockResponse"]
            }
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error("Error in analyzeApiEndpoints:", e);
            // Fallback or throw error
            return [];
        }
    }

    async generateComponentTree(files: ProjectFile[]): Promise<any> {
        const systemInstruction = `You are a UI architect. Analyze the provided front-end code (HTML/JS) and generate a hierarchical component tree representing the UI structure. The root node should represent the body or main app container. Your output must be a valid JSON object representing the root node, following the specified schema.`;
        
        const parts: any[] = [{ text: "Analyze this code to create a component tree:" }];
        files.forEach(file => {
            parts.push({ text: `\n--- FILE: ${file.name} ---\n${file.content}` });
        });

        const componentTreeNodeSchema = {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: "Component name (e.g., 'Header', 'ProductCard')." },
                type: { type: Type.STRING, description: "Component type (e.g., 'Container', 'Button', 'Image')." },
                children: {
                    type: Type.ARRAY,
                    items: { '$ref': '#/definitions/componentNode' }
                }
            },
            required: ["name", "type", "children"]
        };

        const responseSchema = {
            definitions: {
                'componentNode': componentTreeNodeSchema
            },
            ...componentTreeNodeSchema
        };

        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error("Error in generateComponentTree:", e);
            return { name: 'Error', type: 'Error', children: [] };
        }
    }

    async getMonetizationStrategy(project: Project): Promise<{ summary: string; recommendations: { method: string; reason: string; implementationSteps: string[] }[] }> {
        const systemInstruction = `You are a business strategy expert for digital products. Analyze the provided project details and recommend the top 3 monetization strategies.
        
        For each recommendation, provide:
        1. 'method': The name of the strategy in Arabic (e.g., 'الإعلانات', 'الاشتراكات').
        2. 'reason': A concise explanation in Arabic why this strategy fits the project.
        3. 'implementationSteps': An array of 3-5 simple, actionable steps in Arabic for the user to implement this strategy.
    
        Your output MUST be a valid JSON object with 'summary' and 'recommendations' keys.`;
    
        const prompt = `Project Name: ${project.name}\nProject Type: ${project.type}\nDescription: ${project.description}\nSections: ${project.sections.map(s => s.type).join(', ')}`;
    
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A brief summary of the monetization potential in Arabic." },
                recommendations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            method: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            implementationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["method", "reason", "implementationSteps"]
                    }
                }
            },
            required: ["summary", "recommendations"]
        };
    
        try {
            const result = await this.callGenerate('gemini-flash-latest', [{ role: 'user', parts: [{ text: prompt }] }], {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema,
            });
            const jsonText = result.response.candidates[0].content.parts[0].text;
            return this.parseAIJson(jsonText);
        } catch (e) {
            console.error("Error in getMonetizationStrategy:", e);
            throw new Error("فشل الذكاء الاصطناعي في اقتراح استراتيجيات الربح.");
        }
    }
}


export const geminiService = GeminiService.getInstance();
