import { json } from '@remix-run/cloudflare'
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { generateAiResponse } from '~/utils/ai'

export const meta: MetaFunction = () => {
  return [
    { title: 'Workers AI chat' },
    { name: 'description', content: 'AI chat app' },
  ]
}

export interface Env {
  AI: any
  DB: D1Database
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context.env as Env
  const response = await generateAiResponse(
    env.AI,
    'How to make an AI chat app?'
  )

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
