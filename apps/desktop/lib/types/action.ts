export type ActionPhase =
  | 'detecting'
  | 'parsing'
  | 'checking_connection'
  | 'needs_connection'
  | 'resolving_contacts'
  | 'confirming'
  | 'disambiguating'
  | 'executing'
  | 'success'
  | 'error'

export interface ParsedAction {
  id: string
  toolkitSlug: string
  actionSlug: string
  displayName: string
  description: string
  parameters: Record<string, any>
  confidence: number
  originalTranscript: string
  contactsResolved?: boolean
}

export interface DisambiguationOption {
  label: string
  value: string
}

export interface DisambiguationRequest {
  field: string
  question: string
  options: DisambiguationOption[]
}

export interface ActionState {
  phase: ActionPhase
  action: ParsedAction | null
  disambiguation: DisambiguationRequest | null
  error: string | null
  result: any | null
  toolkitSlug: string | null
}
