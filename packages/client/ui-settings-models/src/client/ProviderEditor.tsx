/**
 * One provider's credential card: a single write-only token input stored
 * through `credentials/set` under the profile's `apiKeyEnv` reference. The
 * closed KROKKI product exposes no other provider configuration — endpoint,
 * wire protocol, and model list are owned by the shipped composition and the
 * backend, so this card only takes the backend token. The card names the field
 * it can see and nothing else; every value beyond the token stays owned by the
 * composition and `settings.yaml`.
 */

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CredentialInfo, SettingsNamespaceView } from '@deepseek-ai/dsh-api-remotes/client'
import { apiKeyFailure } from './apiKey.ts'
import { EditorFooter } from './EditorFooter.tsx'
import { deriveKeyRef } from './store.ts'
import type { ModelsOperations } from './operations.ts'
import type { SettingsSchemaOperations } from './schema-operations.ts'
import type { en } from './locales.ts'
import styles from './ModelsSection.module.css'

/** Props of {@link ProviderEditor}. */
export interface ProviderEditorProps {
  /** Provider route id. */
  provider: string
  /** Display name for the card title. */
  displayName: string
  /** Hide the title row (the onboarding modal renders its own heading). */
  hideTitle?: boolean
  /** The owning namespace view (its stored profile names the credential ref). */
  namespace: SettingsNamespaceView
  /** Settings-owned synchronous schema and immutable path operations. */
  schema: SettingsSchemaOperations
  /** Path from the section root to this provider's profile. */
  settingsPath: readonly string[]
  /** The Host operations this card writes and interrogates through. */
  operations: ModelsOperations
  /** Section copy. */
  t: (key: keyof typeof en) => string
  /** Disable writes (read-only settings provider). */
  readOnly: boolean
  /** Require a newly entered credential before this editor can submit. */
  credentialRequired?: boolean
  /** Give the credential field initial focus when this editor mounts. */
  autoFocusCredential?: boolean
  /** Override the dismiss action copy. */
  cancelLabelKey?: keyof typeof en
  /** Override the idle commit action copy. */
  submitLabelKey?: keyof typeof en
  /** Override the in-flight commit action copy. */
  submitBusyLabelKey?: keyof typeof en
  /** Close the editor; `changed` reports whether a token was stored. */
  onClose: (changed: boolean) => void
}

/**
 * The credential reference this profile resolves keys through: the profile's
 * own `apiKeyEnv` when it names one (the KROKKI route names `KROKKI_API_KEY`),
 * otherwise the page's derived `<ROUTE>_API_KEY`.
 */
function refFor(
  schema: SettingsSchemaOperations,
  namespace: SettingsNamespaceView,
  path: readonly string[],
  provider: string,
): string {
  const profile = schema.getPath(namespace.value, path)
  const named = typeof profile === 'object' && profile !== null
    ? (profile as { apiKeyEnv?: unknown }).apiKeyEnv
    : undefined
  return typeof named === 'string' && named.length > 0 ? named : deriveKeyRef(provider)
}

/**
 * Render one provider's token card.
 * @param props - the addressed profile plus wire faces and copy.
 * @returns the token card.
 */
export function ProviderEditor(props: ProviderEditorProps): ReactNode {
  const { namespace, schema, settingsPath, operations, t } = props
  const [keyDraft, setKeyDraft] = useState('')
  const [keyState, setKeyState] = useState<CredentialInfo | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | undefined>(undefined)
  const disabled = props.readOnly || busy
  const keyRef = refFor(schema, namespace, settingsPath, props.provider)

  useEffect(() => {
    let stale = false
    setKeyState(undefined)
    // The key state is a placeholder hint, not a precondition: a refused
    // describe leaves the card without the "already configured" hint.
    void operations.describeCredential(keyRef).then((described) => {
      if (stale) return
      setKeyState(described)
    })
    return () => { stale = true }
  }, [operations, keyRef])

  // The typed key with paste whitespace removed. A blank field yields an empty
  // string, read as "no token supplied" rather than as a token — how a card
  // whose provider already has a stored token is dismissed without re-entering.
  const keyValue = keyDraft.trim()
  const keyFailure = apiKeyFailure(keyDraft)
  const credentialRequiredFailure = props.credentialRequired === true
    && keyDraft.length > 0 && keyValue.length === 0
    ? 'keyRequired' as const
    : undefined
  const shownKeyFailure = credentialRequiredFailure ?? keyFailure
  const keyLocked = keyState?.writable === false
  const keyPlaceholder = keyLocked
    ? t('keyEnvLocked')
    : keyState?.configured === true && props.credentialRequired !== true
      ? t('keyStored')
      : t('keyPlaceholder')

  const apply = async (): Promise<void> => {
    setBusy(true)
    setFailure(undefined)
    try {
      if (keyValue.length > 0) {
        const stored = await operations.storeCredential(keyRef, keyValue)
        if (stored !== undefined) {
          setFailure(stored)
          return
        }
      }
      setKeyDraft('')
      props.onClose(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles['addBlock']}>
      {props.hideTitle === true
        ? null
        : (
          <div className={styles['editorHeader']}>
            <span className={styles['editorTitle']}>{props.displayName}</span>
            {props.provider !== props.displayName
              ? <span className={styles['editorRoute']}>{props.provider}</span>
              : null}
          </div>
        )}
      <div className={styles['field']}>
        <span className={styles['fieldLabel']}>{t('keyInput')}</span>
        <input
          className={styles['input']}
          type="password"
          autoComplete="off"
          value={keyDraft}
          placeholder={keyPlaceholder}
          aria-label={t('keyInput')}
          aria-invalid={shownKeyFailure !== undefined}
          required={props.credentialRequired === true}
          autoFocus={props.autoFocusCredential === true}
          disabled={disabled || keyLocked}
          onChange={(event) => { setKeyDraft(event.target.value) }}
        />
        {shownKeyFailure === undefined ? null : <p className={styles['error']}>{t(shownKeyFailure)}</p>}
      </div>
      {failure !== undefined ? <p className={styles['error']}>{failure}</p> : null}
      <EditorFooter
        t={t}
        busy={busy}
        submitDisabled={disabled
          || shownKeyFailure !== undefined
          || (props.credentialRequired === true && keyValue.length === 0)}
        submitLabelKey={props.submitLabelKey ?? 'apply'}
        submitBusyLabelKey={props.submitBusyLabelKey ?? 'applying'}
        {...props.cancelLabelKey === undefined ? {} : { cancelLabelKey: props.cancelLabelKey }}
        onCancel={() => { props.onClose(false) }}
        onSubmit={() => { void apply() }}
      />
    </div>
  )
}
