# Choose what you store

Keep the whole option, return an ID, or map your own value. The display stays yours.

## Whole objects by default

Omit `value-key` to keep the selected object in v-model. Supply a stable `option-key` for object options.

<ClientOnly><GuideDemo kind="object" /></ClientOnly>

## Return a field

Use `value-key` to return a specific field from the selected option. The visible label still comes from `label-key`.

<ClientOnly><GuideDemo kind="id" /></ClientOnly>

## Customize the selected display

Slots control presentation without changing your stored value.

<ClientOnly><GuideDemo kind="display" /></ClientOnly>

## Map a custom value

`get-option-value` accepts a typed callback and takes precedence over `value-key`. Use it to store another scalar or a projected object. For newly constructed objects, provide `is-value-equal`, for example `(a, b) => a.userId === b.userId`.

Define projection callbacks as named functions in `<script setup>` (or explicitly type an inline callback parameter) so TypeScript can infer the return type before checking v-model.

Keys and projected values must uniquely identify options. The component preserves immutable model arrays and uses stable keys to match whole objects across API refreshes.

## Remote selections

Seed `options` with preselected records so ID values have labels before a remote request. Previously seen selected options stay cached when the result list changes. Unresolved scalar values remain selected and display their value until a matching option becomes available.

<div class="related-props"><a href="../api/props#value-key">value-key</a><a href="../api/props#get-option-value">get-option-value</a><a href="../api/props#option-key">option-key</a></div>
<div class="article-nav"><a href="./basic-usage">← Basic usage</a><a href="./async-options">Async options →</a></div>
