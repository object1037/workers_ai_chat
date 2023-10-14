import {
  type ActionFunctionArgs,
  json,
  redirect,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@remix-run/cloudflare'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
  Form,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { addChat, getChats } from './utils/db.server'

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
]

export interface Env {
  AI: any
  DB: D1Database
  CF_ENV?: string
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context.env as Env
  const chats = await getChats(env.DB)
  return json({ chats })
}

export default function App() {
  const { chats } = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body style={{ margin: 0 }}>
        <section>
          {chats.map((chat) => (
            <div key={chat.id}>
              <a href={`/chats/${chat.id}`}>{chat.name}</a>
            </div>
          ))}
          <Form method="post">
            <input type="text" name="name" />
            <button type="submit">Create chat</button>
          </Form>
        </section>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export const action = async ({ context, request }: ActionFunctionArgs) => {
  const env = context.env as Env
  const body = Object.fromEntries(await request.formData())
  if (typeof body.name !== 'string' || body.name.trim() === '') {
    return new Response('invalid name', { status: 400 })
  }

  const insertedIds = await addChat(env.DB, body.name)
  if (!insertedIds) {
    return new Response('failed to add chat', { status: 500 })
  }

  return redirect(`/chats/${insertedIds[0].insertedId}`)
}
