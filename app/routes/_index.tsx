import { json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { Message } from '~/components/message'
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
  const prompt = fetcher.formData?.get('prompt')

  return (
    <div>
      <fetcher.Form method="post" action="/reset">
        <button type="submit">Reset chat</button>
      </fetcher.Form>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {fetcher.state !== 'idle' && typeof prompt === 'string' && (
        <>
          <Message message={{ id: 0, message: prompt, isUser: true }} />
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
