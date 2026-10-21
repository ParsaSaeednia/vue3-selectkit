# Work with HTML forms

Use native field names and validation while retaining typed Vue values.

## Submit values

Set `name` to include the selection in FormData. Primitive model values serialize as strings. Whole-object models serialize their stable option keys. Multiple mode submits repeated entries under the same name; use `formData.getAll('frameworks')`.

```vue
<form>
  <VueMultiselect v-model="selected" :options="users" option-key="id" label-key="name" name="users" multiple required label="Users" />
  <button type="submit">Save</button>
  <button type="reset">Reset</button>
</form>
```

## Custom serialization

`serialize-value(value, option)` returns a string for native submission and does not change v-model. For example `:serialize-value="value => JSON.stringify(value)"` submits a projected object as JSON.

## Required, disabled, reset

Required controls participate in native constraint validation and focus the visible select when invalid. Disabled controls do not submit values. Form reset restores the model captured when the component mounted and emits a change with reason `reset`. Preventing the reset event prevents the component reset too.

The optional `form` prop associates the component with an external form ID. For object IDs loaded remotely, seed the option records before mounting so both labels and serialization are available.
