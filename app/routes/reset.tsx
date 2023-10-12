import { type ActionFunctionArgs, json } from '@remix-run/cloudflare'
import type { Env } from './_index'
import { resetChat } from '~/utils/db.server'

export const action = async ({ context }: ActionFunctionArgs) => {
  const env = context.env as Env
  const { success } = await resetChat(env.DB)
  return json({ success })
}
