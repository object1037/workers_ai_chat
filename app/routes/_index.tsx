import { json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { generateAiResponse } from '~/utils/ai.server'
import { addMessage, getMessages } from '~/utils/db.server'

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
  const messages = await getMessages(env.DB)

  return json({ messages })
}

export default function Index() {
  const { messages } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()

  return (
    <div>
      <fetcher.Form method="post" action="/reset">
        <button type="submit">Reset chat</button>
      </fetcher.Form>
      {messages.map((message) => (
        <p
          key={message.id}
          style={{ backgroundColor: message.isUser ? '#fff' : '#ebebeb' }}
        >
          {message.message}
        </p>
      ))}
      {fetcher.state !== 'idle' && (
        <>
          <p>{String(fetcher.formData?.get('prompt'))}</p>
          <p>loading...</p>
        </>
      )}
      <fetcher.Form method="post">
        <input type="text" name="prompt" />
      </fetcher.Form>
    </div>
  )
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const env = context.env as Env
  const body = Object.fromEntries(await request.formData())

  if (typeof body.prompt !== 'string') {
    throw new Response('Invalid prompt', { status: 400 })
  }

  const chatContext = (await getMessages(env.DB))
    .map((message) => `${message.isUser ? 'user' : 'ai'}: ${message.message}`)
    .join('\n')
  const aiResponse = await generateAiResponse(env.AI, chatContext, body.prompt)

  if (typeof aiResponse !== 'string') {
    throw new Response('Invalid AI response', { status: 500 })
  }

  const newMessage = {
    message: body.prompt,
    isUser: true,
  }
  const newAiResponse = {
    message: aiResponse,
    isUser: false,
  }

  const { success } = await addMessage(env.DB, [newMessage, newAiResponse])

  return json({ success })
}
