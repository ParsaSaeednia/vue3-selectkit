import type { SelectProps } from 'vue3-selectkit'
export interface PropInfo {
  type: string
  default: string
  description: string
  control?: string
  group?: string
}
export const propDocs = {
  modelValue: {
    type: 'Value | null | Value[]',
    default: 'null / []',
    description: 'Controlled selection via v-model. Shape follows multiple and value mapping.',
  },
  options: {
    type: 'readonly Option[]',
    default: '[]',
    description: 'Available options; also seeds labels for preselected remote values.',
  },
  multiple: {
    type: 'boolean',
    default: 'false',
    description: 'Allow multiple values.',
    control: 'Multiple',
    group: 'Selection',
  },
  optionKey: {
    type: 'keyof Option | (option) => string | number',
    default: 'Primitive identity',
    description: 'Unique stable identity. Supply this for object options.',
  },
  labelKey: { type: 'keyof Option', default: 'label', description: 'Field to display and search.' },
  valueKey: {
    type: 'keyof Option',
    default: 'Whole option',
    description: 'Store this field in v-model instead of the option.',
  },
  getOptionLabel: {
    type: '(option: Option) => string',
    default: '—',
    description: 'Label callback; takes precedence over labelKey.',
  },
  getOptionValue: {
    type: '(option: Option) => Value',
    default: '—',
    description: 'Custom typed value projection; takes precedence over valueKey.',
  },
  isValueEqual: {
    type: '(a: Value, b: Value) => boolean',
    default: 'Object.is / option key',
    description: 'Comparison for custom projected objects. Projected values must be unique.',
  },
  getOptionDisabled: {
    type: '(option: Option) => boolean',
    default: 'option.disabled',
    description: 'Identify unavailable options.',
  },
  groupBy: {
    type: 'keyof Option | (option) => string',
    default: '—',
    description: 'Group options without changing their values.',
    control: 'Group options',
    group: 'Behavior',
  },
  searchable: {
    type: 'boolean',
    default: 'false',
    description: 'Show a search input.',
    control: 'Searchable',
    group: 'Behavior',
  },
  filterable: {
    type: 'boolean',
    default: 'true; false with loader',
    description: 'Enable local label filtering. Disable for externally filtered results.',
  },
  filterOption: {
    type: '(option, query) => boolean',
    default: 'Normalized label search',
    description: 'Custom local filtering when filterable is enabled.',
  },
  showSelectAll: {
    type: 'boolean',
    default: 'false',
    description: 'Show a bulk checkbox in multiple mode. Acts on matching enabled loaded options.',
    control: 'Select all row',
    group: 'Selection',
  },
  maxSelected: {
    type: 'number',
    default: 'Infinity',
    description: 'Maximum selection count. Bulk selection is disabled if it would exceed this.',
  },
  clearable: {
    type: 'boolean',
    default: 'true',
    description: 'Display the clear button.',
    control: 'Clearable',
    group: 'Selection',
  },
  disabled: {
    type: 'boolean',
    default: 'false',
    description: 'Prevent interaction and native form submission.',
    control: 'Disabled',
    group: 'Behavior',
  },
  loading: {
    type: 'boolean',
    default: 'false',
    description: 'Externally managed loading indicator.',
    control: 'Loading',
    group: 'Behavior',
  },
  placeholder: {
    type: 'string',
    default: 'Select an option',
    description: 'Text displayed for an empty selection.',
  },
  label: { type: 'string', default: '—', description: 'Visible accessible label.' },
  id: {
    type: 'string',
    default: 'SSR-safe generated ID',
    description: 'ID of the visible control.',
  },
  ariaLabel: {
    type: 'string',
    default: 'placeholder',
    description: 'Accessible label when there is no visible label.',
  },
  ariaLabelledby: {
    type: 'string',
    default: 'Visible label ID',
    description: 'IDs of external elements labeling the control.',
  },
  ariaDescribedby: {
    type: 'string',
    default: '—',
    description: 'IDs of help or error text describing the control.',
  },
  openOnFocus: {
    type: 'boolean',
    default: 'false',
    description: 'Open on keyboard or programmatic focus.',
    control: 'Open on focus',
    group: 'Behavior',
  },
  closeOnSelect: {
    type: 'boolean',
    default: 'true single / false multiple',
    description: 'Close after committing an individual selection.',
    control: 'Close on select',
    group: 'Behavior',
  },
  placement: {
    type: "'auto' | 'top' | 'bottom'",
    default: 'auto',
    description: 'Dropdown position. Auto flips to fit available space.',
  },
  teleport: {
    type: 'boolean | string',
    default: 'false',
    description: 'Move the dropdown to body or a CSS selector; direction is preserved.',
    control: 'Teleport dropdown',
    group: 'Appearance',
  },
  maxHeight: {
    type: 'number',
    default: '256',
    description: 'Maximum list viewport height in pixels.',
  },
  dir: {
    type: "'ltr' | 'rtl' | 'auto'",
    default: 'Inherited',
    description: 'Text direction; supports Persian and Arabic.',
  },
  unstyled: {
    type: 'boolean',
    default: 'false',
    description: 'Keep behavior and structural layout, omit default visual styling.',
    control: 'Unstyled',
    group: 'Appearance',
  },
  classes: {
    type: 'Partial<Record<SelectPart, string>>',
    default: '{}',
    description: 'Additional classes for named component parts.',
  },
  messages: {
    type: 'Partial<SelectMessages>',
    default: 'English',
    description: 'Translate all built-in action, status and error strings.',
  },
  loadOptions: {
    type: '(query, { signal }) => Promise<readonly Option[]>',
    default: '—',
    description: 'Optional remote loader; debounced, abortable, stale-safe.',
    control: 'Remote loading',
    group: 'Behavior',
  },
  debounce: {
    type: 'number',
    default: '250',
    description: 'Remote search delay in milliseconds. First opening loads immediately.',
  },
  minSearchLength: {
    type: 'number',
    default: '0',
    description: 'Minimum query length for remote requests.',
  },
  createOption: {
    type: '(query, { signal }) => Option | Promise<Option>',
    default: '—',
    description:
      'Enable creation; return a unique option. Persistence belongs to your application.',
    control: 'Create options',
    group: 'Behavior',
  },
  virtual: {
    type: 'boolean',
    default: 'false',
    description: 'Render only visible rows, overscan and the keyboard-active option.',
    control: 'Virtual scrolling',
    group: 'Behavior',
  },
  estimateOptionHeight: {
    type: 'number',
    default: '36',
    description: 'Estimated row height; custom rows are measured automatically.',
  },
  name: {
    type: 'string',
    default: '—',
    description: 'Native form field name. Multiple values produce repeated FormData entries.',
  },
  form: {
    type: 'string',
    default: 'Closest form',
    description: 'ID of an external form to associate with.',
  },
  required: {
    type: 'boolean',
    default: 'false',
    description: 'Participate in native constraint validation.',
  },
  serializeValue: {
    type: '(value, option) => string',
    default: 'Primitive value / object key',
    description: 'Customize native form serialization independently of v-model.',
  },
} satisfies Record<keyof SelectProps<Record<string, unknown>, string, undefined, boolean>, PropInfo>
export const eventDocs = {
  'update:modelValue':
    'The complete typed model. Emitted for a committed selection action; use v-model.',
  change:
    '(value, { reason, options }) — reasons: select, deselect, clear, select-all, deselect-all, create, reset. One event per action; never echoed for external model changes.',
  search:
    '(query: string) — emitted immediately as search changes; debounce applies only to loading.',
  open: 'Dropdown opened.',
  close: 'Dropdown closed.',
  focus: '(event: FocusEvent) — focus entered the widget.',
  blur: '(event: FocusEvent) — focus left the widget.',
  create: '(option: Option) — creation succeeded and the option was selected.',
  'load-error': '(error: unknown) — loader failed; aborted and stale requests are ignored.',
  'create-error': '(error: unknown) — creation failed or returned a duplicate key/value.',
}
export const slotDocs = {
  option:
    '{ option, value, label, selected, highlighted, disabled } — option contents; keep nested controls noninteractive.',
  'single-value':
    '{ option, value, label, disabled, remove } — single selected option; only called for a resolved option.',
  tag: '{ option, value, label, disabled, remove } — each selected tag; built-in remove button remains available.',
  selection:
    '{ options, values, disabled, remove, clear } — replace the complete selected display; unresolved values remain in values.',
  'group-label': '{ label } — visual group heading.',
  'select-all': '{ checked, mixed, disabled, label } — contents of the accessible bulk action.',
  'create-option': '{ query, loading } — contents of the create action.',
  loading: '{ query } — loading status.',
  empty: '{ query } — no available options.',
  'no-results': '{ query } — no search matches.',
  error: "{ error, retry, source: 'load' | 'create' } — recoverable error UI.",
  header: '{ query, close } — dropdown header.',
  footer: '{ query, close } — dropdown footer.',
}
export const defaultConfig = () => ({
  multiple: true,
  storedValue: 'id',
  showSelectAll: true,
  display: 'chips',
  searchable: true,
  disabled: false,
  loading: false,
  virtual: false,
  closeOnSelect: false,
  openOnFocus: false,
  clearable: true,
  groupBy: false,
  loadOptions: false,
  createOption: false,
  teleport: false,
  rtl: false,
  unstyled: false,
  placement: 'auto',
  placeholder: 'Select frameworks...',
  maxHeight: 256,
  optionSlot: 'default',
  valueSlot: 'default',
  events: ['change', 'search'] as string[],
})
export type PlaygroundConfig = ReturnType<typeof defaultConfig>
export interface Framework {
  id: number
  name: string
  category: string
  disabled?: boolean
}
export const frameworks: Framework[] = [
  { id: 1, name: 'Vue', category: 'Progressive' },
  { id: 2, name: 'React', category: 'Component' },
  { id: 3, name: 'Svelte', category: 'Compiler' },
  { id: 4, name: 'Solid', category: 'Component' },
  { id: 5, name: 'Angular', category: 'Full stack' },
  { id: 6, name: 'Preact', category: 'Component', disabled: true },
]
