// @vitest-environment jsdom
/** Closed KROKKI Models section and its token card over a scripted wire face. */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Schema from '@deepseek-ai/schemastery'
import { bindSnapshotSelector, RemoteError } from '@deepseek-ai/dsh-client-test-runtime'
import type {
  CredentialInfo, RemoteResult, SettingsNamespaceView,
} from '@deepseek-ai/dsh-api-remotes/client'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { ModelsSection } from '../src/client/ModelsSection.tsx'
import type { ModelsSectionInjected, ModelsSectionProps } from '../src/client/ModelsSection.tsx'
import { ProviderEditor } from '../src/client/ProviderEditor.tsx'
import { apiKeyFailure } from '../src/client/apiKey.ts'
import { SettingsDescribeMirror } from '@deepseek-ai/dsh-client-ui-settings/src/client/settings-mirror.ts'
import { deriveKeyRef, ModelsSettingsStore } from '../src/client/store.ts'
import { createModelsOperations } from '../src/client/operations.ts'
import type { ModelsOperations } from '../src/client/operations.ts'
import { en } from '../src/client/locales.ts'
import { settingsSchema } from './settings-schema.client.ts'

afterEach(cleanup)

const t: ModelsSectionInjected['t'] = key => en[key]

/** The one route the closed product exposes, addressed inside the pi-ai namespace. */
const KROKKI_PATH = ['providers', 'krokki-official'] as const

const PiAiConfig = Schema.object({
  providers: Schema.dict(Schema.object({
    apiKeyEnv: Schema.string().role('credential-ref'),
    baseURL: Schema.string(),
  })),
})

/**
 * The single namespace the closed page reaches: the base layer declares the
 * KROKKI route's profile, whose `apiKeyEnv` names the token reference. There is
 * no user override — the product owns everything but the token.
 */
function wireNamespaces(): SettingsNamespaceView[] {
  const providers = { 'krokki-official': { apiKeyEnv: 'KROKKI_API_KEY', baseURL: 'https://api.krokki.com' } }
  return [
    {
      ns: 'llm-pi-ai',
      schema: JSON.parse(JSON.stringify(PiAiConfig.toJSON())) as JsonValue,
      value: { providers },
      base: { providers },
      applies: 'live',
      secrets: [],
      revision: 0,
    },
  ]
}

/** The KROKKI namespace view a token card is addressed against. */
function krokkiNamespace(): SettingsNamespaceView {
  return wireNamespaces()[0]!
}

/** Credentials answers over the Remote carrier, which has no envelope. */
function remoteOk<T>(value: T) {
  return { ok: true as const, value }
}
function remoteFail(message: string) {
  return { ok: false as const, error: new RemoteError('gateway/internal', message, {}) }
}

function scriptedFace(overrides: {
  set?: ReturnType<typeof vi.fn>
  describeCredentials?: (refs: string[]) => Promise<RemoteResult<Record<string, CredentialInfo>>>
  describeSettings?: ReturnType<typeof vi.fn>
} = {}) {
  const set = overrides.set ?? vi.fn(() => Promise.resolve(remoteOk(undefined)))
  const describeCredentials = overrides.describeCredentials
    ?? ((refs: string[]) => Promise.resolve(remoteOk(
      Object.fromEntries(refs.map(ref => [ref, {
        configured: ref === 'KROKKI_API_KEY',
        ...ref === 'KROKKI_API_KEY' ? { source: 'file' } : {},
        writable: true,
      }])),
    )))
  const face = {
    llm: {
      listProviders: vi.fn(() => Promise.resolve(remoteOk([
        { id: 'krokki-official', name: 'KROKKI' },
      ]))),
      listConfigurableProviders: vi.fn(() => Promise.resolve(remoteOk([
        { provider: 'krokki-official', displayName: 'KROKKI', settingsNs: 'llm-pi-ai', settingsPath: [...KROKKI_PATH] },
      ]))),
    },
    settings: {
      describe: overrides.describeSettings
        ?? vi.fn(() => Promise.resolve(remoteOk({ writable: true, hasDocument: false, namespaces: wireNamespaces() }))),
    },
    credentials: {
      describe: vi.fn((refs: string[]) => describeCredentials(refs)),
      set,
    },
  }
  return { face, set }
}

type PageContext = ConstructorParameters<typeof ModelsSettingsStore>[0]

/**
 * The page plugin's context, scripted down to the namespaces the page reaches.
 * One context per face, as in production: an editor effect keyed by the context
 * would otherwise re-probe on every render.
 */
const contexts = new WeakMap<object, PageContext>()
function ctxWith(face: object): PageContext {
  const existing = contexts.get(face)
  if (existing !== undefined) return existing
  const ctx = { remote: face } as unknown as PageContext
  contexts.set(face, ctx)
  return ctx
}

/**
 * The cards' injected Host operations over the same script, bound once per face
 * as the plugin body binds them: an editor effect keyed by this face would
 * otherwise re-probe on every render.
 */
const operations = new WeakMap<object, ModelsOperations>()
function operationsWith(face: object): ModelsOperations {
  const existing = operations.get(face)
  if (existing !== undefined) return existing
  const bound = createModelsOperations(ctxWith(face))
  operations.set(face, bound)
  return bound
}

/** One recorded child-slot dispatch: seat name, owner share, kind options. */
type RenderSlotCall = [name: string, owner: Record<string, unknown>, opts?: { entryKey?: string }]

/** Child-slot dispatch stub: records every seat occurrence, renders nothing. */
function stubRenderSlot() {
  return vi.fn((..._call: RenderSlotCall) => null)
}

/** The provider-card seat dispatches, as (route id, configured, keyConfigured, entryKey). */
function cardSeatCalls(
  renderSlot: ReturnType<typeof stubRenderSlot>,
): Array<[string, boolean, boolean, string | undefined]> {
  return renderSlot.mock.calls
    .filter(call => call[0] === 'settings.models.provider-card')
    .map(call => [
      (call[1] as { provider: { provider: string } }).provider.provider,
      (call[1] as { configured: boolean }).configured,
      (call[1] as { keyConfigured: boolean }).keyConfigured,
      call[2]?.entryKey,
    ])
}

async function mountFace(scripted: ReturnType<typeof scriptedFace>) {
  const { face, set } = scripted
  const ctx = ctxWith(face)
  const mirror = new SettingsDescribeMirror(ctx)
  const controller = new ModelsSettingsStore(ctx, settingsSchema, mirror)
  await controller.load()
  const renderSlot = stubRenderSlot()
  const injected: ModelsSectionProps = {
    controller,
    useSnapshot: bindSnapshotSelector(controller.store),
    operations: operationsWith(face),
    schema: settingsSchema,
    t,
    renderSlot: renderSlot as unknown as ModelsSectionProps['renderSlot'],
  }
  const view = render(<ModelsSection {...injected} />)
  return { view, ctx, face, set, controller, mirror, renderSlot }
}

async function mountSection(overrides: Parameters<typeof scriptedFace>[0] = {}) {
  return mountFace(scriptedFace(overrides))
}

/** Mount for a user whose token is not yet stored anywhere. */
async function mountFirstRun(overrides: Parameters<typeof scriptedFace>[0] = {}) {
  const scripted = scriptedFace({
    describeCredentials: refs => Promise.resolve(remoteOk(
      Object.fromEntries(refs.map(ref => [ref, { configured: false, writable: true }])),
    )),
    ...overrides,
  })
  return mountFace(scripted)
}

describe('ModelsSection', () => {
  it('renders nothing before the slot injects its dependencies', () => {
    const uninjected = {} as ModelsSectionProps
    render(<ModelsSection {...uninjected} />)
    expect(document.body.textContent).toBe('')
  })

  it('renders the KROKKI token card', async () => {
    await mountSection()
    expect(screen.getByText(en.title)).toBeTruthy()
    expect(screen.getByText(en.intro)).toBeTruthy()
    expect(screen.getByText('KROKKI')).toBeTruthy()
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    expect(key.type).toBe('password')
    // The stored token shows as the configured placeholder, never a value.
    await waitFor(() => { expect(key.placeholder).toBe(en.keyStored) })
    expect(key.value).toBe('')
  })

  it('dispatches the provider-card and footer seats around the KROKKI row', async () => {
    const { renderSlot } = await mountSection()
    await waitFor(() => {
      expect(cardSeatCalls(renderSlot)).toContainEqual(['krokki-official', true, true, 'llm-pi-ai'])
    })
    expect(renderSlot.mock.calls.filter(call => call[0] === 'settings.models.footer')).toContainEqual(
      ['settings.models.footer', {}],
    )
  })

  it('reports the token as not yet configured on first run', async () => {
    const { renderSlot } = await mountFirstRun()
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    await waitFor(() => { expect(key.placeholder).toBe(en.keyPlaceholder) })
    expect(cardSeatCalls(renderSlot)).toContainEqual(['krokki-official', true, false, 'llm-pi-ai'])
  })

  it('stores a typed token write-only under the profile reference', async () => {
    const { set, face } = await mountFirstRun()
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    fireEvent.change(key, { target: { value: '  sk-live  ' } })
    fireEvent.click(screen.getByText(en.apply))
    await waitFor(() => { expect(set).toHaveBeenCalledWith('KROKKI_API_KEY', 'sk-live') })
    // Storing the token re-loads the join through the shared directory read.
    await waitFor(() => { expect(face.llm.listProviders.mock.calls.length).toBeGreaterThan(1) })
  })

  it('surfaces a refused credential write and keeps the card usable', async () => {
    const { set } = await mountFirstRun({
      set: vi.fn(() => Promise.resolve(remoteFail('credentials: KROKKI_API_KEY is shadowed by the read-only environment'))),
    })
    fireEvent.change(screen.getByLabelText(en.keyInput), { target: { value: 'sk-live' } })
    fireEvent.click(screen.getByText(en.apply))
    await screen.findByText(/shadowed by the read-only environment/)
    expect(set).toHaveBeenCalledOnce()
    // The finally cleared busy, so Apply is live again.
    expect(screen.getByText<HTMLButtonElement>(en.apply).disabled).toBe(false)
  })

  it('shows the read-only notice and disables the token input for a read-only document', async () => {
    const { face } = await mountSection({
      describeSettings: vi.fn(() => Promise.resolve(remoteOk({
        writable: false, hasDocument: false, namespaces: wireNamespaces(),
      }))),
    })
    expect(screen.getByText(en.readOnly)).toBeTruthy()
    expect(screen.getByLabelText<HTMLInputElement>(en.keyInput).disabled).toBe(true)
    expect(screen.getByText<HTMLButtonElement>(en.apply).disabled).toBe(true)
    // The read-only notice is the writability projection, not a credential fact.
    expect(face.settings.describe).toHaveBeenCalled()
  })

  it('renders the load failure with a retry control', async () => {
    const scripted = scriptedFace()
    scripted.face.llm.listProviders = vi.fn(() => Promise.resolve(remoteFail('directory down'))) as never
    const controller = new ModelsSettingsStore(
      ctxWith(scripted.face), settingsSchema, new SettingsDescribeMirror(ctxWith(scripted.face)))
    await controller.load()
    render(<ModelsSection
      controller={controller}
      useSnapshot={bindSnapshotSelector(controller.store)}
      operations={operationsWith(scripted.face)}
      schema={settingsSchema}
      t={t}
      renderSlot={() => null}
    />)
    expect(screen.getByText(/directory down/)).toBeTruthy()
    scripted.face.llm.listProviders = vi.fn(() => Promise.resolve(remoteOk([
      { id: 'krokki-official', name: 'KROKKI' },
    ])))
    fireEvent.click(screen.getByText(en.retry))
    await waitFor(() => { expect(screen.queryByText(/directory down/)).toBeNull() })
  })

  it('loads on first render of an idle controller', async () => {
    const { face } = scriptedFace()
    const controller = new ModelsSettingsStore(ctxWith(face), settingsSchema, new SettingsDescribeMirror(ctxWith(face)))
    render(<ModelsSection
      controller={controller}
      useSnapshot={bindSnapshotSelector(controller.store)}
      operations={operationsWith(face)}
      schema={settingsSchema}
      t={t}
      renderSlot={() => null}
    />)
    await screen.findByText('KROKKI')
  })

  it('derives conventional credential references from route ids', () => {
    expect(deriveKeyRef('anthropic')).toBe('ANTHROPIC_API_KEY')
    expect(deriveKeyRef('minimax-cn')).toBe('MINIMAX_CN_API_KEY')
  })
})

describe('ProviderEditor token card', () => {
  function renderEditor(
    props: Partial<Parameters<typeof ProviderEditor>[0]> = {},
    faceOverrides: Parameters<typeof scriptedFace>[0] = {},
  ) {
    const scripted = scriptedFace(faceOverrides)
    const onClose = props.onClose ?? vi.fn()
    render(<ProviderEditor
      provider="krokki-official"
      displayName="KROKKI"
      namespace={krokkiNamespace()}
      schema={settingsSchema}
      settingsPath={[...KROKKI_PATH]}
      operations={operationsWith(scripted.face)}
      t={t}
      readOnly={false}
      {...props}
      onClose={onClose}
    />)
    return { ...scripted, onClose }
  }

  it('renders exactly one token password input labelled Token', () => {
    renderEditor()
    const inputs = screen.getAllByLabelText<HTMLInputElement>(en.keyInput)
    expect(inputs).toHaveLength(1)
    expect(inputs[0]!.type).toBe('password')
    expect(en.keyInput).toBe('Token')
  })

  it('stores the typed token under the profile reference and closes changed', async () => {
    const { set, onClose } = renderEditor()
    fireEvent.change(screen.getByLabelText(en.keyInput), { target: { value: '  sk-token  ' } })
    fireEvent.click(screen.getByText(en.apply))
    await waitFor(() => { expect(set).toHaveBeenCalledWith('KROKKI_API_KEY', 'sk-token') })
    await waitFor(() => { expect(onClose).toHaveBeenCalledWith(true) })
  })

  it('closes unchanged when dismissed and stores nothing', () => {
    const { set, onClose } = renderEditor()
    fireEvent.click(screen.getByText(en.cancel))
    expect(onClose).toHaveBeenCalledWith(false)
    expect(set).not.toHaveBeenCalled()
  })

  it('closes changed on an empty field without storing, keeping the stored token', async () => {
    const { set, onClose } = renderEditor()
    fireEvent.click(screen.getByText(en.apply))
    await waitFor(() => { expect(onClose).toHaveBeenCalledWith(true) })
    expect(set).not.toHaveBeenCalled()
  })

  it('marks a whitespace-only field blank and refuses the write', () => {
    const { set } = renderEditor()
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    fireEvent.change(key, { target: { value: '   ' } })
    expect(screen.getByText(en.keyBlank)).toBeTruthy()
    expect(key.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText<HTMLButtonElement>(en.apply).disabled).toBe(true)
    fireEvent.click(screen.getByText(en.apply))
    expect(set).not.toHaveBeenCalled()
  })

  it('marks an illegal token and refuses the write', () => {
    renderEditor()
    fireEvent.change(screen.getByLabelText(en.keyInput), { target: { value: 'KROKKI_API_KEY=sk-abc' } })
    expect(screen.getByText(en.keyIllegalCharacters)).toBeTruthy()
    expect(screen.getByText<HTMLButtonElement>(en.apply).disabled).toBe(true)
  })

  it('gates a required credential behind a non-blank token', async () => {
    const { set, onClose } = renderEditor({
      credentialRequired: true,
      autoFocusCredential: true,
      cancelLabelKey: 'onboardingLater',
      submitLabelKey: 'onboardingSave',
      submitBusyLabelKey: 'onboardingSaving',
    })
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    expect(key.required).toBe(true)
    expect(document.activeElement).toBe(key)
    const save = screen.getByText<HTMLButtonElement>(en.onboardingSave)
    // Empty is not yet allowed to submit; a required credential must be entered.
    expect(save.disabled).toBe(true)
    fireEvent.change(key, { target: { value: '   ' } })
    expect(screen.getByText(en.keyRequired)).toBeTruthy()
    expect(save.disabled).toBe(true)
    fireEvent.change(key, { target: { value: 'sk-onboarding' } })
    expect(screen.queryByText(en.keyRequired)).toBeNull()
    expect(save.disabled).toBe(false)
    fireEvent.click(save)
    await waitFor(() => { expect(set).toHaveBeenCalledWith('KROKKI_API_KEY', 'sk-onboarding') })
    await waitFor(() => { expect(onClose).toHaveBeenCalledWith(true) })
  })

  it('locks the token input when the launch environment provides the credential', async () => {
    renderEditor({}, {
      describeCredentials: refs => Promise.resolve(remoteOk(
        Object.fromEntries(refs.map(ref => [ref, { configured: true, source: 'env', writable: false }])),
      )),
    })
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    await waitFor(() => { expect(key.placeholder).toBe(en.keyEnvLocked) })
    expect(key.disabled).toBe(true)
  })

  it('keeps the card usable with the default placeholder when the credential probe is refused', async () => {
    const { set } = renderEditor({}, {
      describeCredentials: () => Promise.resolve(remoteFail('no credential provider')),
    })
    const key = screen.getByLabelText<HTMLInputElement>(en.keyInput)
    expect(key.placeholder).toBe(en.keyPlaceholder)
    fireEvent.change(key, { target: { value: 'sk-live' } })
    fireEvent.click(screen.getByText(en.apply))
    await waitFor(() => { expect(set).toHaveBeenCalledWith('KROKKI_API_KEY', 'sk-live') })
  })
})

describe('apiKeyFailure', () => {
  it('treats a blank field as no failure — it means keep the stored key', () => {
    expect(apiKeyFailure('')).toBeUndefined()
  })

  it.each([
    ['a printable-ASCII key', 'sk-0123456789'],
    ['a padded key, which the caller trims', '  sk-abc  '],
    ['the printable-ASCII boundary characters', '!~'],
    ['a hyphenated key carrying an equals sign', 'sk-ABC=xyz'],
    ['an all-upper-case key ending in base64 padding', 'ABCD=='],
    ['an all-upper-case key ending in one padding character', 'MNOPQRST='],
  ])('accepts %s', (_label, draft) => {
    expect(apiKeyFailure(draft)).toBeUndefined()
  })

  it.each([
    ['spaces', '   '],
    ['a tab', '\t'],
  ])('fails a field holding only %s instead of silently dropping it', (_label, draft) => {
    expect(apiKeyFailure(draft)).toBe('keyBlank')
  })

  it.each([
    ['an emoji', 'sk-\u{1F600}'],
    ['CJK text', 'sk-你好'],
    ['full-width punctuation', 'sk-abc，'],
    ['an interior space', 'sk-abc def'],
    ['a C0 control character', 'sk-abc\x01'],
    ['a latin-1 character', 'sk-café'],
  ])('fails %s as illegal characters', (_label, draft) => {
    expect(apiKeyFailure(draft)).toBe('keyIllegalCharacters')
  })

  it.each([
    ['a pasted environment line', 'KROKKI_API_KEY=sk-abc'],
    ['double quotes', '"sk-abc"'],
    ['single quotes', '\'sk-abc\''],
    ['backticks', '`sk-abc`'],
  ])('fails %s as a format failure', (_label, draft) => {
    expect(apiKeyFailure(draft)).toBe('keyIllegalCharacters')
  })

  it('needs a matching closing quote before it calls a value wrapped', () => {
    // A lone quote and an unbalanced one are legal printable ASCII, so the
    // heuristic leaves them alone rather than guessing at a paste error.
    expect(apiKeyFailure('"')).toBeUndefined()
    expect(apiKeyFailure('"a')).toBeUndefined()
  })
})
