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
  NavLink,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
  useNavigation,
} from '@remix-run/react'
import { addChat, getChats } from './utils/db.server'
import sidebarStyle from './styles/sidebar.module.css'
import { LuPlus, LuTrash } from 'react-icons/lu'

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
  {
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/modern-css-reset/dist/reset.min.css',
  },
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
  const fetcher = useFetcher()
  const navigation = useNavigation()

  return (
    <html
      lang="en"
      style={{
        height: '100%',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      }}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body style={{ margin: 0, height: '100%' }}>
        <div style={{ display: 'flex', height: '100%' }}>
          <section className={sidebarStyle.root}>
            {chats.map((chat) => (
              <div key={chat.id} style={{ display: 'flex' }}>
                <NavLink
                  to={`/chats/${chat.id}`}
                  prefetch="intent"
                  className={({ isActive, isPending }) => {
                    const colorStyle = isPending
                      ? sidebarStyle.linkPending
                      : isActive
                      ? sidebarStyle.linkActive
                      : ''
                    return `${sidebarStyle.link} ${colorStyle}`
                  }}
                >
                  {chat.name}
                </NavLink>
                <fetcher.Form
                  method="post"
                  action={`/delete?chatId=${chat.id}`}
                >
                  <button type="submit" className={sidebarStyle.altButton}>
                    <LuTrash />
                  </button>
                </fetcher.Form>
              </div>
            ))}
            <Form method="post" style={{ display: 'flex' }}>
              <input type="text" name="name" className={sidebarStyle.input} />
              <button type="submit" className={sidebarStyle.button}>
                <LuPlus />
              </button>
            </Form>
          </section>
          <div
            style={{
              flex: 1,
              position: 'relative',
              ...(navigation.state === 'loading'
                ? {
                    opacity: 0.25,
                    transition: 'opacity 200ms',
                    transitionDelay: '200ms',
                  }
                : {}),
            }}
          >
            <Outlet />
          </div>
        </div>
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
