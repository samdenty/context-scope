# context-scope

Context support for Javascript / Typescript. Side effects free. Create a `scope` and all functions called from within it will have access to it.

## Getting started

### Example

```ts
import Context from 'context-scope'

interface User {
  name: string
  surname: string
  email: string
}

const user = new Context<User>()

const fullName = () => `${user.value.name} ${user.value.surname}`
const link = () => `mailto:${user.value.email}`
const title = () => `${fullName()} [${user.value.email}]`

const getHTML = () => `<a href="${link()}" title="${title()}">${fullName()}</a>`

user.scope(scope => {
  scope.set({
    name: 'Rick',
    surname: 'Astley',
    email: 'hello@example.com'
  })

  const link = getHTML()

  console.log(link)
  // <a href="mailto:hello@example.com" title="Rick Astley [hello@example.com]">Rick Astley</a>
})
```

### How

By using a dynamically generated function and stack traces, it's possible to make the code context-aware. Each scope is given an identifier and bound to a function with it in the name.

From there, it's as simple as parsing the stack trace and extracting the identifiers inside a getter.

### Why

You often find the need to pass data from one place to another. This would normally mean passing down the data via parameters, but this quickly becomes unmaintainable. Context allows you to skip all the hops and pass it directly where you need it.

This comes with some added benefits, for example - Typescript. As you're only defining your data in one place, you only need to type it once. The rest is done for you.

## Options

### `initialValue`

Defines the initial value to be used for all newly created scopes. It's recommended to directly call `scope.set` from within a scope, as it provides safety in `strictMode` when destroying contexts.

### `customHandlers`

Handlers are methods defined on the scope, which take the current context + arguments and return a new version of the data.

```ts
const context = new Context<number>({
  customHandlers: {
    increment: value => (amount = 1) => +value + amount,
    decrement: value => (amount = 1) => +value - amount
  }
})

context.scope(scope => {
  scope.set(0)

  scope.increment()
  console.log(scope) // 1

  scope.decrement(2)
  console.log(scope) // -1
})
```

### `strictMode`

Strict mode is enabled by default as it provides extra runtime context safety.
When it's enabled, it throws errors if context is consumed but unable to be resolved in the stack trace.

On:

```ts
const context = new Context()
context.value // Throws error
```

Off:

```ts
const context = new Context()
context.value // undefined
```

## Context methods

### `destroy`

Destroys a specified scope ID from memory

```ts
context.scope(scope => {
  scope.set(1)
  const { id } = scope

  context.destroy(id)
})
```

### `getScopes`

Returns an array of all the parent scope IDs from which the function was called

```ts
context.scope(scope => {
  context.scopes() // [ 0 ]
})
```

### `value`

Returns the value of the current scope from the stack trace

```ts
context.scope(scope => {
  scope.set(1)

  context.value // 1
})
```

### `getScope`

Returns the value of a scope ID

```ts
context.scope(scope => {
  scope.set('hello')
})

context.getScope(0) // { value: 'hello', initialized: 'true' }
```

## Scope methods

### `set`

```ts
context.scope(scope => {
  // Set the value
  scope.set(1)

  // Increment the value based on previous
  scope.set(value => value + 1)
})
```

### `value`

Returns the direct value of the initialized scope, without parsing the stack trace.

```ts
context.scope(scope => {
  scope.set(1)
  scope.value // 1
})
```

### `destroy`

Destroy's the scope references from memory. If you attempt to read a destroyed scope when `strictMode` is enabled, an error will be thrown. If you disable `strictMode`, then it will fallback to undestroyed parent scopes.

```ts
context.scope(scope => {
  scope.set(1)
  scope.destroy()

  context.value // error
})
```

### `id`

Returns the internal ID to the current scope

```ts
context.scope(scope => {
  scope.set(1)
  const { id } = scope // 0

  context.destroy(id)
})
```
