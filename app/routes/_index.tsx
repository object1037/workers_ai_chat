import { json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useRef } from 'react'
import { LuSendHorizonal } from 'react-icons/lu'
import Markdown from 'react-markdown'
import { Caret } from '~/components/caret'
import { Message } from '~/components/message'
import { generateAiResponse } from '~/utils/ai.server'
import { addMessage, getMessages } from '~/utils/db.server'
import inputStyle from '~/styles/input.module.css'

export const meta: MetaFunction = () => {
  return [
    { title: 'Workers AI chat' },
    { name: 'description', content: 'AI chat app' },
  ]
}

export interface Env {
  AI: any
  DB: D1Database
  CF_ENV?: string
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

  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    formRef.current?.reset()
  }, [fetcher.state])

  return (
    <div>
      <fetcher.Form method="post" action="/reset">
        <button type="submit">Reset chat</button>
      </fetcher.Form>
      <div style={{ marginBottom: '12rem' }}>
        {messages.map((message) => (
          <Message key={message.id} isUser={message.isUser}>
            <Markdown>{message.message}</Markdown>
          </Message>
        ))}
        {fetcher.state !== 'idle' && typeof prompt === 'string' && (
          <>
            <Message isUser={true}>{prompt}</Message>
            <Message isUser={false}>
              <Caret />
            </Message>
          </>
        )}
      </div>
      <div className={inputStyle.wrapper}>
        <fetcher.Form method="post" ref={formRef} className={inputStyle.form}>
          <textarea
            required
            rows={1}
            name="prompt"
            disabled={fetcher.state !== 'idle'}
            className={inputStyle.input}
          />
          <button
            type="submit"
            disabled={fetcher.state !== 'idle'}
            className={inputStyle.button}
          >
            <LuSendHorizonal />
          </button>
        </fetcher.Form>
      </div>
    </div>
  )
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const env = context.env as Env
  const body = Object.fromEntries(await request.formData())

  if (typeof body.prompt !== 'string' || body.prompt.trim() === '') {
    throw new Response('Invalid prompt', { status: 400 })
  }

  const chatContext = (await getMessages(env.DB))
    .map((message) => `${message.isUser ? 'user' : 'ai'}: ${message.message}`)
    .join('\n')
  const aiResponse = await generateAiResponse(
    env.AI,
    chatContext,
    body.prompt,
    env.CF_ENV === 'dev'
  )

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
