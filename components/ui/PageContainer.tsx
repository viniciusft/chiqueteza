import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export default function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div
      className={`min-h-screen mx-auto ${className}`}
      style={{ backgroundColor: 'var(--background)', maxWidth: 430 }}
    >
      {children}
    </div>
  )
}
