import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-ever-green text-white hover:bg-[#154e4a] active:scale-[0.98] focus:ring-ever-green',
    secondary:
      'bg-pink-peony text-white hover:bg-[#e05a8a] active:scale-[0.98] focus:ring-pink-peony',
    outline:
      'border-2 border-ever-green text-ever-green bg-transparent hover:bg-ever-green hover:text-white active:scale-[0.98] focus:ring-ever-green',
  }

  const width = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${base} ${variants[variant]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
