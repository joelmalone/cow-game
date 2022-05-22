import type { Disposable } from "../reusable/disposable";
import { AppError } from "../reusable/app-errors";

export interface IRendererFactory<T, R extends Disposable> {
  (item: T): R;
}

export function createRendererController<
  TItem,
  TKey,
  TRenderer extends Disposable
>(
  keyGetter: (item: TItem) => TKey,
  factory: IRendererFactory<TItem, TRenderer>
) {
  const renderers = new Map<TKey, TRenderer>();

  function add(item: TItem): TRenderer {
    const key = keyGetter(item);
    const existingRenderer = renderers.get(key);
    if (existingRenderer) {
      throw new AppError(
        "This key has already been added. You must call update() to update an existing item.",
        { key, item }
      );
    }
    const newRenderer = factory(item);
    renderers.set(key, newRenderer);
    return newRenderer;
  }

  function get(key: TKey): TRenderer {
    const existingRenderer = renderers.get(key);
    if (!existingRenderer) {
      throw new AppError("The key was not found in the array.", {
        key,
      });
    }
    return existingRenderer;
  }

  function remove(key: TKey) {
    if (!renderers.delete(key)) {
      throw new AppError("The key to remove was not found in the array.", {
        key,
      });
    }
  }

  function clear() {
    renderers.forEach((r) => r.dispose());
    renderers.clear();
  }

  return {
    add,
    get,
    remove,
    clear,
  };
}
