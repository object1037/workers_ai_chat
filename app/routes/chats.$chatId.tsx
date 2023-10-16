import { defer, json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { addMessage, checkChatExists, getMessages } from '~/utils/db.server'
import type { Env, loader as chatsLoader } from '~/root'
import { generateAiResponse } from '~/utils/ai.server'
import {
  Await,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import { Suspense, useEffect, useRef } from 'react'
import { Message } from '~/components/message'
import Markdown from 'react-markdown'
import TextareaAutosize from 'react-textarea-autosize'
import { Caret } from '~/components/caret'
import inputStyle from '~/styles/input.module.css'
import { handleKeyDown } from '~/utils/keydown'
import { LuSendHorizonal } from 'react-icons/lu'

export const meta: MetaFunction<
  typeof loader,
  { root: typeof chatsLoader }
> = ({ matches }) => {
  const rootMatch = matches.find((match) => match.id === 'root')
  if (!rootMatch) {
    throw new Response('root route not found', { status: 500 })
  }
  const chatId = rootMatch.params.chatId
  if (!chatId || isNaN(Number(chatId))) {
    throw new Response('invalid chat id', { status: 404 })
  }
  const chatName = rootMatch.data.chats.find(
    (chat) => chat.id === Number(chatId)
  )?.name
  return [
    { title: `${chatName} - Workers AI chat` },
    { name: 'description', content: 'AI chat app' },
  ]
}

export const loader = async ({ context, params }: LoaderFunctionArgs) => {
  const chatId = params.chatId
  if (!chatId || isNaN(Number(chatId))) {
    throw new Response('invalid chat id', { status: 404 })
  }
  const env = context.env as Env
  const messages = getMessages(env.DB, Number(chatId))
  const chatExists = await checkChatExists(env.DB, Number(chatId))
  if (!chatExists) {
    throw new Response(null, { status: 404, statusText: 'Chat not found' })
  }

  return defer({ messages })
}

export default function Chat() {
  const { messages } = useLoaderData<typeof loader>()
  const fetcher = useFetcher()
  const prompt = fetcher.formData?.get('prompt')

  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    formRef.current?.reset()
    textareaRef.current?.focus()
    window.scrollTo(0, document.body.scrollHeight)
  }, [fetcher.state])

  return (
    <>
      <div style={{ marginBottom: '12rem', height: '100%', overflow: 'auto' }}>
        <Suspense fallback={<p>loading...</p>}>
          <Await resolve={messages}>
            {(messages) =>
              messages.map((message) => (
                <Message key={message.id} isUser={message.isUser}>
                  <Markdown>{message.message}</Markdown>
                </Message>
              ))
            }
          </Await>
        </Suspense>

        {fetcher.state !== 'idle' && typeof prompt === 'string' && (
          <>
            <Message isUser={true}>
              <Markdown>{prompt}</Markdown>
            </Message>
            <Message isUser={false}>
              <Caret />
            </Message>
          </>
        )}
        <div style={{ height: '12rem' }} />
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
    </>
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

  const messages = await getMessages(env.DB, Number(chatId))
  if ('error' in messages) {
    throw new Response(null, { status: 404, statusText: 'Chat not found' })
  }

  const chatContext = messages
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

export const ErrorBoundary = () => {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    )
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    )
  } else {
    return <h1>Unknown Error</h1>
  }
}
