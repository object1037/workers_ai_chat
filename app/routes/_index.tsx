import type { MetaFunction } from '@remix-run/cloudflare'

export const meta: MetaFunction = () => {
  return [
    { title: 'Workers AI chat' },
    { name: 'description', content: 'AI chat app' },
  ]
}

export default function Index() {
  return <p>hello</p>
}
