/*

The Bonsole is a drop-in replacement for `window.console` that will attempt
to make logs more useful for debugging.

It does things such as:

  * Converts logged `[Object object]` to JSON strings where needed, i.e. iPhone Webkit.
  * Enumerates the non-enumerable properties of logged `Error` objects, i.e. `name`, `stack` and `message`.
  * Opaquely augments the existing `window.console` implementation but does not change it's API.

Usage:

  Just import it as an ES module.

*/

const originalConsole = window.console

// Make sure multiple imports don't re-apply the augmentation. Not
//  sure if this is required? I should read the ESM spec.
if (originalConsole.isBonsole === 'yeh') {
  throw new Error('Tried to override the console twice.')
}

// Determine which platforms we should manually stringify
//  objects. Note that platform detection is naive and we
//  should improve as necessary.
const looksLikeIphone = navigator.userAgent.indexOf('iPhone') !== -1

/**
 * Conditionally stringify an unknown.
 */
function maybeStringify (unknown) {
  if (looksLikeIphone && typeof unknown === 'object') {
    try {
      return JSON.stringify(unknown, jsonFriendlyErrorReplacer, 2)
    } catch {
    }
  }

  return unknown
}

// Naively override some logging methods; improve coverage as necessary
const overrides = {
  debug: (...p) => originalConsole.debug(...p.map(maybeStringify)),
  log: (...p) => originalConsole.log(...p.map(maybeStringify)),
  warn: (...p) => originalConsole.warn(...p.map(maybeStringify)),
  error: (...p) => originalConsole.error(...p.map(maybeStringify))
}

if (looksLikeIphone) {
  window.console = { ...originalConsole, ...overrides, isBonsole: 'yeh' }

  originalConsole.log('Bonsole has taken control of your console.')
} else {
  originalConsole.log('Bonsole was not loaded because !looksLikeIphone.')
}

/**
 * Replacer for use with `JSON.stringify()` that is aware of the
 * non-enumerable `Error` properties (`name`, `message` and `stack').
 */
function jsonFriendlyErrorReplacer (key, value) {
  if (value instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors
      ...value,
      // Explicitly pull Error's non-enumerable properties
      name: value.name,
      message: value.message,
      stack: value.stack
    }
  }

  return value
}
