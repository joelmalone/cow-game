export class AppError extends Error {
  public readonly context?: unknown;
  public readonly inner?: Error;

  constructor(message?: string, context?: unknown, inner?: Error) {
    super(buildMessage(message, context, inner));
    this.context = context;
    this.inner = inner;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function buildMessage(message?: string, context?: unknown, inner?: Error) {
  return (
    (message || AppError.name) +
    (context
      ? '\n\ncontext:\n\n' + JSON.stringify(context, jsonFriendlyErrorReplacer)
      : '') +
    (inner
      ? '\n\ninner:\n\n' + JSON.stringify(inner, jsonFriendlyErrorReplacer)
      : '')
  );
}

/**
 * Replacer for use with `JSON.stringify()` that is aware of the
 * non-enumerable `Error` properties (`name`, `message` and `stack').
 */
function jsonFriendlyErrorReplacer(key: string, value: unknown) {
  if (value instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors
      ...value,
      // Explicitly pull Error's non-enumerable properties
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  return value;
}
