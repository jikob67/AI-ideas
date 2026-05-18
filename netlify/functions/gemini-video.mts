import type { Config, Context } from '@netlify/functions'
import { GoogleGenAI } from '@google/genai'

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = Netlify.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  const ai = new GoogleGenAI({ apiKey })

  try {
    const { model, prompt, image, config: genConfig } = await req.json()
    const operation = await ai.models.generateVideos({
      model: model || 'veo-3.0-generate-preview',
      prompt,
      ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
      config: genConfig,
    })
    return Response.json({ operationName: operation.name })
  } catch (error: any) {
    console.error('Gemini Video Start Error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export const config: Config = {
  path: '/api/gemini/generate-video',
}
