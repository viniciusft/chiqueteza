import { ReactNode } from 'react'
import Logo from './Logo'

interface AppHeaderProps {
  actions?: ReactNode
}

export default function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header
      className="flex items-center justify-between bg-white"
      style={{
        paddingLeft: 20,
        paddingRight: 20,
        paddingTop: 14,
        paddingBottom: 14,
        borderBottom: '1px solid #E8E8E8',
      }}
    >
      <Logo />
      {actions && <div>{actions}</div>}
    </header>
  )
}
