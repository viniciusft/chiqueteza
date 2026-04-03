import { ReactNode } from 'react'
import Logo from './Logo'

interface AppHeaderProps {
  actions?: ReactNode
}

export default function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--color-silver)',
      }}
    >
      <Logo />
      {actions && <div>{actions}</div>}
    </header>
  )
}
