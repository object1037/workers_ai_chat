import { Ai } from '@cloudflare/ai'

export const generateAiResponse = async (AiBinding: any, prompt: string) => {
  const ai = new Ai(AiBinding)

  const systemPrompt = 'Answer within 100 words.'

  const { response } = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  })

  return response
}
