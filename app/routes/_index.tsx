import type { MetaFunction } from '@remix-run/cloudflare'

export const meta: MetaFunction = () => {
  return [
    { title: 'Workers AI chat' },
    { name: 'description', content: 'AI chat app' },
  ]
}

export default function Index() {
  return (
    <div style={{ padding: '4rem 4rem' }}>
      <h1 style={{ marginBottom: '1rem' }}>Workers AI chat</h1>
      <p>
        Simple AI chat app build with{' '}
        <a href="https://developers.cloudflare.com/workers-ai/">Workers AI</a>.{' '}
        <a href="https://github.com/object1037/workers_ai_chat">GitHub</a>
      </p>
    </div>
  )
}
