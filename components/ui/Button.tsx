'use client'

import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  fullWidth?: boolean
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  className = '',
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (navigator.vibrate) navigator.vibrate(10)
    onClick?.(e)
  }
  const base =
    'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variants = {
    primary:
      'bg-[#1B5E5A] text-white hover:bg-[#154e4a] focus:ring-[#1B5E5A]',
    secondary:
      'bg-[#F472A0] text-white hover:bg-[#e05a8a] focus:ring-[#F472A0]',
    outline:
      'bg-transparent text-[#1B5E5A] hover:bg-[#1B5E5A] hover:text-white focus:ring-[#1B5E5A]',
  }

  const outlineBorder = variant === 'outline' ? 'border-[1.5px] border-[#1B5E5A]' : ''
  const width = fullWidth ? 'w-full' : ''

  return (
    <button
      className={`${base} ${variants[variant]} ${outlineBorder} ${width} ${className}`}
      style={{ borderRadius: 14, padding: '14px 20px' }}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
