/**
 * Button (Preact/TSX) — interactive component for client-side hydrated forms.
 *
 * Astro pages için `Button.astro` kullan.
 * Bu Preact içinde event handler gerektiren yerler için.
 */
import type { JSX } from 'preact'
import type { ComponentChildren } from 'preact'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
  iconOnly?: boolean
  loading?: boolean
  class?: string
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void
  href?: string
  target?: string
  ariaLabel?: string
  children?: ComponentChildren
}

export default function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    fullWidth = false,
    iconOnly = false,
    loading = false,
    class: className = '',
    onClick,
    href,
    target,
    ariaLabel,
    children,
  } = props

  const sizeClass = iconOnly
    ? size === 'sm' ? 'btn-icon-sm' : 'btn-icon-md'
    : `btn-${size}`

  const variantClass = `btn-${variant}`
  const widthClass = fullWidth ? 'w-full' : ''
  const finalClass = ['btn', sizeClass, variantClass, widthClass, className].filter(Boolean).join(' ')

  const content = loading ? (
    <>
      <span class="inline-block size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span class="opacity-80">{children}</span>
    </>
  ) : children

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : undefined}
        class={finalClass}
        aria-label={ariaLabel}
        aria-disabled={disabled ? 'true' : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      class={finalClass}
      aria-label={ariaLabel}
      aria-busy={loading ? 'true' : undefined}
      onClick={onClick}
    >
      {content}
    </button>
  )
}
