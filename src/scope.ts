import { Handler } from '.'

class Scope<Value extends any> {
  private $value: Value
  public onChange: (value, method?: string) => void

  constructor(value: Value) {
    if (typeof value !== 'undefined') this.value = value
  }

  get value() {
    return this.$value
  }

  set value(value: Value) {
    if (this.onChange) this.onChange(value)

    this.$value = value
  }

  private methodResult(value: Value, ...args: any[]) {
    if (this.onChange) this.onChange(value, ...args)

    this.$value = value
  }

  /**
   * Wraps methods & captures their return values
   */
  public handleMethods<Methods extends { [key: string]: Handler<Value> }>(
    methods: Methods
  ): Methods {
    const wrappedMethods = {}

    Object.keys(methods).forEach(key => {
      const method = methods[key]

      wrappedMethods[key] = (...args) => {
        const result = method(this.value)(...args)
        this.methodResult(result, key)

        return result
      }
    })

    return wrappedMethods as Methods
  }
}

export default Scope
