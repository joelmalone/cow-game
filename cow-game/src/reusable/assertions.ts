import { AppError } from './app-errors';

// export function notNullAndNotUndefined<T>(
//   arg: T,
// ): arg is Exclude<T, null | undefined> {
//   if (arg === null || arg === undefined) {
//     throw new AssertionError();
//   }
//   return true;
// }

export function assert<T>(
  value: T,
): asserts value is Exclude<T, null | undefined> {
  if (!value) {
    throw new AssertionError();
  }
}

export function assertEvery<T>(
  values: T[],
): asserts values is Exclude<T, null | undefined>[] {
  if (!values) {
    throw new AssertionError();
  }
  if (!values.every((i) => i)) {
    throw new AssertionError();
  }
}

export function assertIn<T, I extends T>(
  value: T,
  ...values: I[]
): asserts value is T {
  if (values.length > 0) {
    if (!values.some((v) => v === value)) {
      throw new AssertionError('Value is not one of the given values.');
    }
  } else {
    throw new AssertionError(
      'Can not assert values because the values array is empty.',
    );
  }
}

export function assertContainsEvery(values: unknown[], ...items: unknown[]) {
  for (const item of items) {
    if (!values.includes(item)) {
      throw new AssertionError('Expected values array to contain all items.');
    }
  }
}

export class AssertionError extends AppError {
  constructor(message?: string, context?: unknown, inner?: Error) {
    super(message || 'Assertion failed.', context, inner);

    Object.setPrototypeOf(this, AssertionError.prototype);
  }
}
