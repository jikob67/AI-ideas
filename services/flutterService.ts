
import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";
import JSZip from 'jszip';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateFlutterCode = async (project: any): Promise<string> => {
  const prompt = `
    You are an expert Flutter developer. 
    Convert the following web project into a single-file Flutter app (main.dart).
    The web project has the following files:
    ${(project.files || []).map((f: any) => `File: ${f.name}\nContent:\n${f.content}`).join('\n\n')}
    
    Requirements:
    - Use Material Design 3.
    - Ensure the UI looks as close as possible to the web version.
    - Handle navigation if there are multiple "pages" simulated in the web code.
    - Include all necessary imports.
    - The output should be ONLY the Dart code for main.dart.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    
    let code = response.text || '';
    // Remove markdown code blocks if present
    code = code.replace(/```dart/g, '').replace(/```/g, '').trim();
    return code;
  } catch (error) {
    console.error("Error generating Flutter code:", error);
    throw error;
  }
};

export const simulateBuild = async (platform: 'apk' | 'ipa'): Promise<Blob> => {
  // Simulate a build process with a delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const zip = new JSZip();
  if (platform === 'apk') {
    zip.file("AndroidManifest.xml", `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.example.simulated">\n</manifest>`);
    zip.file("resources.arsc", "Simulated binary data");
    zip.file("classes.dex", "Simulated binary data");
  } else {
    zip.file("Info.plist", `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n<key>CFBundleName</key>\n<string>SimulatedApp</string>\n</dict>\n</plist>`);
    zip.file("PkgInfo", "APPL????");
  }
  
  return await zip.generateAsync({ type: 'blob' });
};

export const simulateFullBuild = async (): Promise<{ apkBlob: Blob; ipaBlob: Blob }> => {
    // Run builds in parallel to save time
    const [apkBlob, ipaBlob] = await Promise.all([
        simulateBuild('apk'),
        simulateBuild('ipa')
    ]);
    return { apkBlob, ipaBlob };
};
