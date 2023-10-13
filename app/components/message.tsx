import styles from '~/styles/message.module.css'
import { LuBrainCircuit, LuUser } from 'react-icons/lu'

export const Message = ({
  isUser,
  children,
}: {
  isUser: boolean
  children: React.ReactNode
}) => {
  return (
    <div className={isUser ? styles.user : styles.ai}>
      <div className={styles.root}>
        <div className={styles.icon}>
          {isUser ? <LuUser /> : <LuBrainCircuit />}
        </div>
        <p className={styles.message}>{children}</p>
      </div>
    </div>
  )
}
