import { Ai } from '@cloudflare/ai'
import { json } from '@remix-run/cloudflare'
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'

export const meta: MetaFunction = () => {
  return [
    { title: 'Workers AI chat' },
    { name: 'description', content: 'AI chat app' },
  ]
}

export interface Env {
  AI: any
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context.env as Env
  const ai = new Ai(env.AI)

  const systemPrompt = 'Answer within 100 words.'
  const question = 'How to make a chat app?'

  const { response } = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
  })

  return json({ response })
}

export default function Index() {
  const { response } = useLoaderData<typeof loader>()

  return (
    <div>
      <p>{response}</p>
    </div>
  )
}
