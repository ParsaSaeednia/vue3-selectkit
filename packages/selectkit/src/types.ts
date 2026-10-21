export type OptionKey = string | number
export type OptionField<T> = T extends object ? Extract<keyof T, string> : never
export type SelectValue<T, K = undefined, F = never> = [F] extends [never]
  ? K extends keyof T
    ? T[K]
    : T
  : F
export type ModelValue<T, K = undefined, F = never, M extends boolean = false> = M extends true
  ? SelectValue<T, K, F>[]
  : SelectValue<T, K, F> | null
export type ChangeReason =
  'select' | 'deselect' | 'clear' | 'select-all' | 'deselect-all' | 'create' | 'reset'
export interface ChangeDetail<T> {
  reason: ChangeReason
  options: readonly T[]
}
export interface AsyncContext {
  signal: AbortSignal
}
export type SelectPart =
  | 'root'
  | 'control'
  | 'selection'
  | 'trigger'
  | 'tag'
  | 'clear'
  | 'dropdown'
  | 'search'
  | 'listbox'
  | 'option'
  | 'group'
  | 'selectAll'
  | 'create'
  | 'state'
  | 'footer'
export interface SelectMessages {
  search: string
  empty: string
  noResults: string
  loading: string
  selectAll: string
  selectAllLoaded: string
  clear: string
  remove: string
  create: string
  retry: string
  loadError: string
  createError: string
  limit: string
  required: string
}
export interface SelectProps<
  T,
  K extends OptionField<T> | undefined = undefined,
  F = never,
  M extends boolean = false,
> {
  modelValue?: NoInfer<ModelValue<T, K, F, M>>
  options?: readonly T[]
  multiple?: M
  optionKey?: OptionField<T> | ((option: T) => OptionKey)
  labelKey?: OptionField<T>
  valueKey?: K
  getOptionLabel?: (option: T) => string
  getOptionValue?: (option: T) => F
  isValueEqual?: (a: NoInfer<SelectValue<T, K, F>>, b: NoInfer<SelectValue<T, K, F>>) => boolean
  getOptionDisabled?: (option: T) => boolean
  groupBy?: OptionField<T> | ((option: T) => string)
  searchable?: boolean
  filterable?: boolean
  filterOption?: (option: T, query: string) => boolean
  showSelectAll?: boolean
  maxSelected?: number
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  label?: string
  id?: string
  ariaLabel?: string
  ariaLabelledby?: string
  ariaDescribedby?: string
  openOnFocus?: boolean
  closeOnSelect?: boolean
  placement?: 'auto' | 'top' | 'bottom'
  teleport?: boolean | string
  maxHeight?: number
  dir?: 'ltr' | 'rtl' | 'auto'
  unstyled?: boolean
  classes?: Partial<Record<SelectPart, string>>
  messages?: Partial<SelectMessages>
  loadOptions?: (query: string, context: AsyncContext) => Promise<readonly T[]>
  debounce?: number
  minSearchLength?: number
  createOption?: (query: string, context: AsyncContext) => T | Promise<T>
  virtual?: boolean
  estimateOptionHeight?: number
  name?: string
  form?: string
  required?: boolean
  serializeValue?: (value: SelectValue<T, K, F>, option: T | undefined) => string
}
export interface OptionSlot<T, V = T> {
  option: T
  value: V
  label: string
  selected: boolean
  highlighted: boolean
  disabled: boolean
}
export interface ValueSlot<T, V = T> {
  option: T
  value: V
  label: string
  disabled: boolean
  remove: () => void
}
export interface SelectionSlot<T, V = T> {
  options: readonly T[]
  values: readonly V[]
  remove: (value: V) => void
  clear: () => void
  disabled: boolean
}
export interface SelectExposed {
  focus: () => void
  blur: () => void
  open: () => void
  close: () => void
  clear: () => void
}
