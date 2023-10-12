import type { SelectMessage } from '~/utils/db.server'
import styles from './message.module.css'
import type { SerializeFrom } from '@remix-run/cloudflare'
import { clsx } from 'clsx'

export const Message = (props: { message: SerializeFrom<SelectMessage> }) => {
  return (
    <div
      className={clsx(
        styles.root,
        props.message.isUser ? styles.user : styles.ai
      )}
    >
      <div className={styles.icon}>{props.message.isUser ? '🤓' : '🧠'}</div>
      <p className={styles.message}>{props.message.message}</p>
    </div>
  )
}
