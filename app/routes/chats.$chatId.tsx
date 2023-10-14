import { json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from '@remix-run/cloudflare'
import { addMessage, getMessages } from '~/utils/db.server'
import type { Env } from '~/root'
import { generateAiResponse } from '~/utils/ai.server'
import { useFetcher, useLoaderData, useParams } from '@remix-run/react'
import { useEffect, useRef } from 'react'
import { Message } from '~/components/message'
import Markdown from 'react-markdown'
import TextareaAutosize from 'react-textarea-autosize'
import { Caret } from '~/components/caret'
import inputStyle from '~/styles/input.module.css'
import { handleKeyDown } from '~/utils/keydown'
import { LuSendHorizonal } from 'react-icons/lu'

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const chatId = params.chatId
  if (!chatId || isNaN(Number(chatId))) {
    throw new Response('invalid chat id', { status: 404 })
  }
  const env = context.env as Env
  const messages = await getMessages(env.DB, Number(chatId))
  if (messages.length === 0) {
    throw new Response(null, { status: 404, statusText: 'Chat not found' })
  }

  return json({ messages })
}

export default function Chat() {
  const { messages } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const prompt = fetcher.formData?.get('prompt')
  const params = useParams()

  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    formRef.current?.reset()
    textareaRef.current?.focus()
    window.scrollTo(0, document.body.scrollHeight)
  }, [fetcher.state])

  return (
    <div>
      <fetcher.Form method="post" action={`/reset?chatId=${params.chatId}`}>
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
        <fetcher.Form
          method="post"
          ref={formRef}
          className={inputStyle.form}
          onKeyDown={(e) => handleKeyDown(e, fetcher)}
        >
          <TextareaAutosize
            required
            rows={1}
            maxRows={7}
            name="prompt"
            disabled={fetcher.state !== 'idle'}
            className={inputStyle.input}
            ref={textareaRef}
            placeholder="Type something. [Shift]+[Enter] to submit."
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

export const action = async ({
  request,
  context,
  params,
}: ActionFunctionArgs) => {
  const chatId = params.chatId
  if (!chatId || isNaN(Number(chatId))) {
    throw new Response('invalid chat id', { status: 404 })
  }
  const env = context.env as Env
  const body = Object.fromEntries(await request.formData())

  if (typeof body.prompt !== 'string' || body.prompt.trim() === '') {
    throw new Response('Invalid prompt', { status: 400 })
  }

  const chatContext = (await getMessages(env.DB, Number(chatId)))
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
    chatId: Number(chatId),
  }
  const newAiResponse = {
    message: aiResponse,
    isUser: false,
    chatId: Number(chatId),
  }

  const { success } = await addMessage(env.DB, [newMessage, newAiResponse])

  return json({ success })
}
