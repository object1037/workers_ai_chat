import styles from '~/styles/message.module.css'
import { clsx } from 'clsx'

export const Message = ({
  isUser,
  children,
}: {
  isUser: boolean
  children: React.ReactNode
}) => {
  return (
    <div className={clsx(styles.root, isUser ? styles.user : styles.ai)}>
      <div className={styles.icon}>{isUser ? '🤓' : '🧠'}</div>
      <p className={styles.message}>{children}</p>
    </div>
  )
}
