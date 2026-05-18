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
    const { model, contents, config: genConfig } = await req.json()
    const response = await ai.models.generateContent({
      model: model || 'gemini-2.5-flash',
      contents,
      config: genConfig,
    })
    return Response.json({ response })
  } catch (error: any) {
    console.error('Gemini Generate Error:', error.message)
    return Response.json({ error: error.message }, { status: error.status || 500 })
  }
}

export const config: Config = {
  path: '/api/gemini/generate',
}
