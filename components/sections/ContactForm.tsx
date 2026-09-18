'use client'

import { useActionState, useCallback, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitContact } from '@/app/contact/actions'
import { Chip } from '@/components/ui/Chip'
import { Field, FieldShell, SelectField, TextAreaField } from '@/components/ui/Field'
import { budgetOptions, contactPage, needOptions, timelineOptions } from '@/content/contact'
import { EMPTY_VALUES, FIELD, IDLE_STATE, type ContactState } from '@/lib/contact-fields'

/**
 * The contact form. Brief section 6.5.
 *
 * Four states, and the two that matter are the ones a happy path never reaches.
 *
 * On error the entered values come back from the action and seed `defaultValue`. That is not
 * belt and braces: React 19 resets an uncontrolled form when its action completes, so without
 * the echo every failed submit emptied all four fields and the visitor retyped everything.
 * Three harness criteria failed on it before the echo existed.
 *
 * On success the form is replaced in place by a confirmation, not an alert.
 *
 * Submitting is `useFormStatus`, read by a child of the form, which is the only place that
 * hook reports on. It disables the button, which is also what makes a double submit
 * impossible from the UI: the second click lands on a disabled control.
 */
export function ContactForm() {
  /*
    The action is wrapped rather than passed straight in, so a transport failure is a state
    rather than a crash. Aborting the POST mid submit used to take the whole form out of the
    tree: React propagates a rejected action to the nearest error boundary, and there is none
    here, so the visitor lost the form and their typing along with it. Now the same failure
    reads as one sentence and the values stay put.
  */
  const [state, action] = useActionState(async (previous: ContactState, formData: FormData) => {
    try {
      return await submitContact(previous, formData)
    } catch {
      return {
        status: 'error' as const,
        fieldErrors: {},
        formError: contactPage.errors.generic,
        values: {
          name: String(formData.get(FIELD.name) ?? ''),
          company: String(formData.get(FIELD.company) ?? ''),
          email: String(formData.get(FIELD.email) ?? ''),
          message: String(formData.get(FIELD.message) ?? ''),
        },
      }
    }
  }, IDLE_STATE)

  /** What the fields render with. Empty on first paint, the visitor's typing after a failure. */
  const values = state.values ?? EMPTY_VALUES
  const [needs, setNeeds] = useState<string[]>([])
  const startedAt = useRef<HTMLInputElement | null>(null)
  const errorRef = useRef<HTMLParagraphElement | null>(null)

  /*
    The clock lives in a ref, not only in the hidden input, and this is the whole fix.

    React 19 resets the form when a form action completes, which puts every uncontrolled
    field back to its `defaultValue`. The stamp used to be written once on mount by an
    effect with no dependencies, so the first failed submit sent the hidden input back to
    "0" and nothing ever wrote it again. From that point the action measured every
    submission as instant and rejected it as too fast, for the life of the page. One typo
    in an email address killed the form until a reload. See ADR 0036.

    A ref survives the reset. The effect below writes it back into the input after every
    action, which is what makes the second submission work.
  */
  const started = useRef(0)

  /** Copies the clock into the hidden field. Safe to call as often as you like. */
  const syncStamp = useCallback(() => {
    if (startedAt.current) startedAt.current.value = String(started.current)
  }, [])

  /*
    Started on first interaction, not on mount. Mount time measures how long the tab has
    been open, which on a cached or restored page is not a measurement of this person at
    all. Focus covers every field a person can reach; input covers an autofill that lands
    without one.
  */
  const beginClock = useCallback(() => {
    if (started.current !== 0) return
    started.current = Date.now()
    syncStamp()
  }, [syncStamp])

  /* React reset the form when the action finished, so put the stamp back into it. */
  useEffect(() => {
    syncStamp()
  }, [state, syncStamp])

  /*
    A restored page carries whatever the clock held when it was put away, which measures the
    wrong thing in both directions. Clear it and let the next interaction start it again.
    `pageshow` fires on a bfcache restore where no effect and no mount will.
  */
  useEffect(() => {
    const restart = () => {
      started.current = 0
      syncStamp()
    }
    window.addEventListener('pageshow', restart)
    return () => window.removeEventListener('pageshow', restart)
  }, [syncStamp])

  /* Move the reader to the failure rather than leaving them at a button that did nothing. */
  useEffect(() => {
    if (state.status === 'error' && state.formError) errorRef.current?.focus()
  }, [state])

  if (state.status === 'success') {
    return (
      <div className="hairline-t pt-8" data-contact-state="success">
        <h2 className="text-display text-fg font-bold">{contactPage.success.heading}</h2>
        <p className="measure text-body text-fg-muted mt-4">{contactPage.success.body}</p>
      </div>
    )
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-8"
      data-contact-state={state.status}
      noValidate
      /*
        Capture, on the form, so one pair of handlers covers every field including ones
        added later. A person has to focus something to fill it in; the input handler is
        for an autofill that arrives without focus.
      */
      onFocusCapture={beginClock}
      onInputCapture={beginClock}
    >
      <fieldset className="contents">
        <legend className="sr-only">{contactPage.form.legend}</legend>

        <Field
          id={FIELD.name}
          label={contactPage.form.name.label}
          placeholder={contactPage.form.name.placeholder}
          defaultValue={values.name}
          autoComplete="name"
          required
          error={state.fieldErrors.name ?? null}
        />

        <Field
          id={FIELD.company}
          label={contactPage.form.company.label}
          placeholder={contactPage.form.company.placeholder}
          defaultValue={values.company}
          autoComplete="organization"
        />

        <Field
          id={FIELD.email}
          label={contactPage.form.email.label}
          placeholder={contactPage.form.email.placeholder}
          defaultValue={values.email}
          type="email"
          autoComplete="email"
          required
          error={state.fieldErrors.email ?? null}
        />

        {/*
          The multi select. Real buttons with aria-pressed, and the chosen values ride along
          as hidden inputs so the action reads them from FormData like every other field.
        */}
        <fieldset className="flex flex-col gap-2">
          <legend className="label text-fg-muted">{contactPage.form.needs.label}</legend>
          <p className="text-body text-fg-muted">{contactPage.form.needs.hint}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {needOptions.map((option) => (
              <Chip
                key={option.value}
                selected={needs.includes(option.value)}
                onClick={() =>
                  setNeeds((current) =>
                    current.includes(option.value)
                      ? current.filter((value) => value !== option.value)
                      : [...current, option.value],
                  )
                }
              >
                {option.label}
              </Chip>
            ))}
          </div>
          {needs.map((value) => (
            <input key={value} type="hidden" name={FIELD.needs} value={value} />
          ))}
        </fieldset>

        <SelectField
          id={FIELD.timeline}
          label={contactPage.form.timeline.label}
          options={timelineOptions}
        />

        {/*
          Rupees only, and no currency toggle. The USD brackets it switched to were round
          numbers with no source, so the toggle offered a choice between a sourced range and
          an invented one. ADR 0028.
        */}
        <FieldShell id={FIELD.budget} label={contactPage.form.budget.label} hint={contactPage.form.budget.hint}>
          <select
            id={FIELD.budget}
            name={FIELD.budget}
            className="rounded-input border-border bg-bg-raised text-body text-fg hover:border-fg-muted focus:border-accent w-full appearance-none border px-4 py-3 transition-colors duration-[var(--dur-fast)]"
          >
            {budgetOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-bg-raised text-fg">
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <TextAreaField
          id={FIELD.message}
          label={contactPage.form.message.label}
          placeholder={contactPage.form.message.placeholder}
          defaultValue={values.message}
          required
          error={state.fieldErrors.message ?? null}
        />

        {/*
          The honeypot, and the timing stamp. Hidden from people three ways: off screen, not a
          tab stop, and hidden from assistive technology. A bot filling every field it finds
          fills this one.
        */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor={FIELD.trap}>{contactPage.form.trap.label}</label>
          <input id={FIELD.trap} name={FIELD.trap} type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <input ref={startedAt} type="hidden" name={FIELD.startedAt} defaultValue="0" />

        {state.formError && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            data-contact-error
            className="text-body text-accent-strong measure"
          >
            {state.formError}
          </p>
        )}

        <SubmitButton />
      </fieldset>
    </form>
  )
}

/**
 * Its own component because `useFormStatus` reports on the form above the component that
 * calls it. Reading it in `ContactForm` would return a permanent false.
 */
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      data-contact-submit
      className="accent-fill rounded-pill label inline-flex min-h-11 items-center justify-center self-start px-8 py-3 transition-opacity duration-[var(--dur-fast)] disabled:opacity-60"
    >
      {pending ? contactPage.form.submitting : contactPage.form.submit}
    </button>
  )
}
