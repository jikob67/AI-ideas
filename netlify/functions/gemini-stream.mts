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

    const stream = await ai.models.generateContentStream({
      model: model || 'gemini-2.5-flash',
      contents,
      config: genConfig,
    })

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const line = `data: ${JSON.stringify({ response: chunk })}\n\n`
            controller.enqueue(new TextEncoder().encode(line))
          }
        } catch (err: any) {
          const line = `data: ${JSON.stringify({ error: err.message })}\n\n`
          controller.enqueue(new TextEncoder().encode(line))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('Gemini Stream Error:', error.message)
    return Response.json({ error: error.message }, { status: error.status || 500 })
  }
}

export const config: Config = {
  path: '/api/gemini/stream',
}
