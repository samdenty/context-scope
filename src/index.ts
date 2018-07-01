import memoizeOne from 'memoize-one'

import {
  NO_SCOPE,
  SCOPE,
  SCOPE_DESTROYED,
  SCOPE_DESTROYED_METHOD,
  UNINITIALIZED_SCOPE
} from './constants'
import defaultHandlers from './defaultHandlers'
import Scope from './scope'
import { escapeRegex, getTrace, parseTrace, SEPARATOR, wrap } from './util'

export type Handler<Value> = (prevValue: Value) => (...args) => Value
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

type HandlerMethods<Handler extends any> = {
  [key in keyof Handler]: ReturnType<Handler[key]>
}

type ID = number

interface ContextScope {
  value: any
  initialized: boolean
}

let instances = 0
class Context<
  Value extends any,
  CustomHandlers = { [key: string]: Handler<Value> }
> {
  private scopes: ContextScope[] = []
  public getScope = (id: ID) => this.scopes[id]

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
  ) {}

  public scope<
    Handlers extends HandlerMethods<
      CustomHandlers & Omit<typeof defaultHandlers, 'set'>
    >,
    CurrentScope extends {
      set: ((newValue: Value | (((prevValue: Value) => Value))) => Value)
      id: ID
      value: Value
      destroy: () => void
    } & Handlers,
    Callback extends (scope: CurrentScope) => any
  >(callback: Callback): ReturnType<Callback> {
    const id = this.scopes.push({ value: undefined, initialized: false }) - 1
    const controller = new Scope(this.getValue(false).value)

    controller.onChange = (value, method) => {
      const scope = this.getScope(id)
      if (!scope)
        return this.error(
          `${SCOPE_DESTROYED(id)}${
            method ? SCOPE_DESTROYED_METHOD(method) : ''
          }`
        )

      scope.initialized = true
      scope.value = value
    }

    const scope: CurrentScope = {
      id,
      get value() {
        return controller.value
      },
      destroy: () => this.destroy(id),
      ...controller.handleMethods({
        ...(this.options.customHandlers as any),
        ...defaultHandlers
      })
    }

    const wrapper = wrap(SCOPE, this.instance, id)
    const result = wrapper.call(callback, scope)

    return result
  }

  public get value() {
    return this.getValue().value
  }

  public destroy(id: ID) {
    delete this.scopes[id]
  }

  public getScopes() {
    const trace = getTrace()
    return this.getScopesFromTrace(trace)
  }

  public getValue(throwOnNoScope = true): { value: Value; scope: ID | false } {
    const initial = 'initialValue' in this.options
    const scopes = this.getScopes()

    let wasUninitialized = false
    for (const id of scopes) {
      const scope = this.getScope(id)
      if (scope) {
        if (!scope.initialized) {
          wasUninitialized = true
          break
        }
        return { scope: id, value: scope.value }
      }
    }

    if (
      throwOnNoScope &&
      (scopes.length === 0 || (wasUninitialized && !initial))
    )
      this.error(scopes.length === 0 ? NO_SCOPE : UNINITIALIZED_SCOPE)

    return { scope: false, value: this.options.initialValue }
  }

  private getScopesFromTrace: (trace: string) => ID[] = memoizeOne(trace => {
    const traces = parseTrace(trace)
    const scopes: ID[] = []

    for (const trace of traces) {
      const match = trace.match(this.regex)

      if (match) {
        const [, ...data] = match[1].split(SEPARATOR)
        const id = +data[0]

        scopes.push(id)
      }
    }

    return scopes
  })

  private error(message: string) {
    if (this.options.strictMode !== false) {
      throw new Error(message)
    }

    console.warn('[context-scope]', message)
  }
}

export default Context
