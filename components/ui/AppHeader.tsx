import { ReactNode } from 'react'
import Logo from './Logo'

interface AppHeaderProps {
  actions?: ReactNode
}

export default function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between"
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 14,
        paddingBottom: 14,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--color-silver)',
      }}
    >
      <Logo />
      {actions && <div>{actions}</div>}
    </header>
  )
}
