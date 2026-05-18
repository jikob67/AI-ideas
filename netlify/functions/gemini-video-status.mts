import type { Config, Context } from '@netlify/functions'
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai'

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
    const { operationName } = await req.json()
    const op = new GenerateVideosOperation()
    op.name = operationName
    const updated = await ai.operations.getVideosOperation({ operation: op })
    return Response.json(updated)
  } catch (error: any) {
    console.error('Gemini Video Status Error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export const config: Config = {
  path: '/api/gemini/video-status',
}
