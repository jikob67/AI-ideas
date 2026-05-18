import type { Config, Context } from '@netlify/functions'
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai'

export default async (req: Request, context: Context) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = Netlify.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const operationName = new URL(req.url).searchParams.get('operationName')
  if (!operationName) {
    return Response.json({ error: 'operationName is required' }, { status: 400 })
  }

  try {
    const op = new GenerateVideosOperation()
    op.name = operationName
    const updated = await ai.operations.getVideosOperation({ operation: op })
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri

    if (!uri) {
      return Response.json({ error: 'Video not found or not ready' }, { status: 404 })
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    })

    return new Response(videoRes.body, {
      headers: { 'Content-Type': 'video/mp4' },
    })
  } catch (error: any) {
    console.error('Gemini Video Download Error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export const config: Config = {
  path: '/api/gemini/video-download',
}
