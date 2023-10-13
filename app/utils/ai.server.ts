import { Ai } from '@cloudflare/ai'

export const generateAiResponse = async (
  AiBinding: any,
  context: string,
  prompt: string,
  isDev: boolean
) => {
  if (isDev) {
    return `
This is a test response
- hello
- world

\`\`\`javascript
console.log("hi")
\`\`\`
`
  }

  const ai = new Ai(AiBinding)

  const systemPrompt =
    'Answer within 100 words. When answering the question or responding, use the context provided, if it is provided and relevant.'
  const contextMessage = `Context:\n${context}`

  const { response } = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      { role: 'system', content: contextMessage },
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })

  return response
}
