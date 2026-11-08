/** Browser preferences are optional: storage may be blocked or full. */
export function readStorage(key) {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
