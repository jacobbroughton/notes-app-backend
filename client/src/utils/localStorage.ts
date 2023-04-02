// Saves the state to localStorage
export const saveState = (state: object, stateName: string) => {
  const serializedState = JSON.stringify(state)
  localStorage.setItem(stateName, serializedState)
}

// Loads state from localStorage
export const loadState = (stateName: string) => {
  try {
    const serializedState = localStorage.getItem(stateName)
    if (serializedState === null) {
      return undefined
    }
    const state = JSON.parse(serializedState)
    return state
  } catch (error) {
    return undefined
  }
}
