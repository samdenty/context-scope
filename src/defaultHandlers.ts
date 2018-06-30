const defaultHandlers = {
  set: oldValue => newValue =>
    typeof newValue === 'function' ? newValue(oldValue) : newValue,

  increment: current => (amount = 1) => +current + amount
}

export default defaultHandlers
