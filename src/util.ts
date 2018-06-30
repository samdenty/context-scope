export const SEPARATOR = `$`

export const wrap = (...args) =>
  new Function(
    `return function ${args.join(
      SEPARATOR
    )}() { return this.apply(null, arguments) }`
  )()

export const escapeRegex = (...regex: any[]) =>
  regex.join(SEPARATOR).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')

export const getStackTraces = () => {
  const Trace = Error as any

  const original = Trace.stackTraceLimit
  Trace.stackTraceLimit = Infinity

  const { stack } = new Trace()
  Trace.stackTraceLimit = original

  const [, ...traces] = stack.split('\n')
  return traces
}
