export const SCOPE = `$_SCOPE_`

export const SCOPE_DESTROYED = id =>
  `Parent context scope #${id} has been destroyed! `

export const SCOPE_DESTROYED_METHOD = method =>
  `\n\n(whilst evaluating a call to \`scope.${method}\`)`

export const NO_SCOPE =
  `Failed to locate a parent context scope!\n\n` +
  `(whilst evaluating a getter on \`context.value\`)`

export const UNINITIALISED_SCOPE =
  `The parent context scope was unitialized!\n` +
  `As \`initialValue\` was not specified, you need to\n` +
  `manually call \`scope.set\` before attempting to reference it's value\n\n` +
  `(whilst evaluating a getter on \`context.value\`)`
