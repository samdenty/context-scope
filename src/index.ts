import {
  NO_SCOPE,
  SCOPE,
  SCOPE_DESTROYED,
  SCOPE_DESTROYED_METHOD,
  UNINITIALISED_SCOPE,
} from './constants'
import defaultHandlers from './defaultHandlers'
import Scope from './scope'
import { escapeRegex, getStackTraces, SEPARATOR, wrap } from './util'

let instances = 0

export type Handler<Value> = (prevValue: Value) => (...args) => Value
type HandlerMethods<Handler extends any> = {
  [key in keyof Handler]: ReturnType<Handler[key]>
}
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

interface ContextScope {
  value: any
  initialized: boolean
}

class Context<
  Value extends any,
  CustomHandlers = { [key: string]: Handler<Value> }
> {
  private contextScopes: ContextScope[] = []

  private instance = ++instances
  private regex = new RegExp(
    ` +at Function\\.${escapeRegex(SCOPE, this.instance)}([0-8${escapeRegex(
      SEPARATOR
    )}]+)`
  )

  constructor(
    private readonly options: {
      initialValue?: Value
      customHandlers?: CustomHandlers
      strictMode?: boolean
    } = {} as any
  ) {
    // this.register(defaultHandlers)
  }

  scope<
    Handlers extends HandlerMethods<
      CustomHandlers & Omit<typeof defaultHandlers, 'set'>
    >,
    CurrentScope extends {
      set: ((newValue: Value | (((prevValue: Value) => Value))) => Value)
      id: number
      value: Value
      destroy: () => void
    } & Handlers,
    Callback extends (scope: CurrentScope) => any
  >(callback: Callback): ReturnType<Callback> {
    const id =
      this.contextScopes.push({
        value: undefined,
        initialized: false
      }) - 1

    const controller = new Scope(id, this.getValue(false).value)

    controller.onChange = (value, method) => {
      const scope = this.contextScopes[id]
      if (scope) {
        scope.initialized = true
        scope.value = value
        return
      }

      this.error(
        `${SCOPE_DESTROYED(id)}${method ? SCOPE_DESTROYED_METHOD(method) : ''}`
      )
    }

    const scope: CurrentScope = {
      get value() {
        return controller.value
      },
      id: controller.id,
      destroy: () => this.destroy(scope.id),
      ...controller.handleMethods({
        ...(this.options.customHandlers as any),
        ...defaultHandlers
      })
    }

    const wrapper = wrap(SCOPE, this.instance, controller.id)
    const result = wrapper.call(callback, scope)

    return result
  }

  private error(message: string) {
    if (this.options.strictMode !== false) {
      throw new Error(message)
    }

    console.warn('[context-scope]', message)
  }

  getValue(throwOnNoScope = true): { value: Value; scope: number | false } {
    const initial = 'initialValue' in this.options
    const scopes = this.getScopes()

    let wasUnitialized = false
    for (const id of scopes) {
      const scope = this.contextScopes[id]
      if (scope) {
        if (!scope.initialized) {
          wasUnitialized = true
          break
        }
        return { scope: id, value: scope.value }
      }
    }

    if (throwOnNoScope && (scopes.length === 0 || wasUnitialized))
      this.error(wasUnitialized ? UNINITIALISED_SCOPE : NO_SCOPE)

    return { scope: false, value: this.options.initialValue }
  }

  getScope = (id: number) => this.contextScopes[id]

  get value() {
    return this.getValue().value
  }

  getScopes() {
    const traces = getStackTraces()
    const scopes: number[] = []

    for (const trace of traces) {
      const match = trace.match(this.regex)

      if (match) {
        const [, ...data] = match[1].split(SEPARATOR)
        const id = +data[0]

        scopes.push(id)
      }
    }

    return scopes
  }

  destroy(id: number) {
    delete this.contextScopes[id]
  }
}

export default Context
