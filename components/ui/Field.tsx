import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type FieldShellProps = {
  id: string
  label: string
  /** Rendered as an inline message and wired to the control with aria-describedby. */
  error?: string | null
  /** Quiet helper line under the label. */
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

/*
  No `focus:outline-none` here.

  It used to be, and it killed the global `:focus-visible` ring in globals.css for every
  control in this file, leaving a border tint as the only keyboard focus cue. Nothing caught
  it for three phases because no form existed to tab through: `/contact` is the first route
  to render these, and its harness failed on six controls with no ring the first time it ran.
  The border colour stays as a second cue, and the ring does the work.
*/
const control =
  'w-full rounded-input border bg-bg-raised px-4 py-3 text-body text-fg ' +
  'placeholder:text-fg-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] ' +
  'hover:border-fg-muted focus:border-accent'

/**
 * One shell, three controls. The label, the error wiring, and the 4px radius are
 * identical across input, textarea, and select, so they live in one place and the
 * three exports below only differ by the element they render.
 *
 * Error text is plain and inline. No red panic, no icon, and the entered value is
 * never cleared, which is a requirement of the form spec in brief section 6.5.
 */
export function FieldShell({
  id,
  label,
  error,
  hint,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label className="label text-fg-muted" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-accent-strong ml-1">
            *
          </span>
        )}
      </label>
      {hint && <p className="text-body text-fg-muted">{hint}</p>}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-body text-accent-strong" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

type FieldProps = Omit<FieldShellProps, 'children'> &
  Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'className' | 'required'>

export function Field({ id, label, error, hint, required, className, ...rest }: FieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <input
        id={id}
        name={rest.name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, error ? 'border-accent-strong' : 'border-border')}
        {...rest}
      />
    </FieldShell>
  )
}

type TextAreaProps = Omit<FieldShellProps, 'children'> &
  Omit<ComponentPropsWithoutRef<'textarea'>, 'id' | 'className' | 'required'>

export function TextAreaField({
  id,
  label,
  error,
  hint,
  required,
  className,
  ...rest
}: TextAreaProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        name={rest.name ?? id}
        required={required}
        rows={rest.rows ?? 5}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, 'resize-y', error ? 'border-accent-strong' : 'border-border')}
        {...rest}
      />
    </FieldShell>
  )
}

type SelectProps = Omit<FieldShellProps, 'children'> & {
  options: ReadonlyArray<{ value: string; label: string }>
} & Omit<ComponentPropsWithoutRef<'select'>, 'id' | 'className' | 'required' | 'children'>

export function SelectField({
  id,
  label,
  error,
  hint,
  required,
  options,
  className,
  ...rest
}: SelectProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <select
        id={id}
        name={rest.name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, 'appearance-none', error ? 'border-accent-strong' : 'border-border')}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-bg-raised text-fg">
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
