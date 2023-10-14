import { type ActionFunctionArgs, redirect } from '@remix-run/cloudflare'
import type { Env } from '~/root'
import { deleteChat } from '~/utils/db.server'

export const action = async ({
  context,
  request,
  params,
}: ActionFunctionArgs) => {
  const env = context.env as Env
  const chatId = new URL(request.url).searchParams.get('chatId')
  if (!chatId || isNaN(Number(chatId))) {
    return new Response('invalid chat id', { status: 400 })
  }

  const { success } = await deleteChat(env.DB, Number(chatId))

  if (!success) {
    return new Response('failed to delete chat', { status: 500 })
  }

  return redirect('/')
}
