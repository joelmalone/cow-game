export function createBus<TMessage>() {
  type Listener = (message: TMessage) => void;

  const listeners: Listener[] = [];

  function subscribe(listener: Listener): () => void {
    listeners.push(listener as any);

    return () => {
      const i = listeners.indexOf(listener as any);
      if (i >= 0) {
        listeners.splice(i, 1);
      }
    };
  }

  function publish(message: TMessage) {
    for (const l of listeners) {
      try {
        l(message);
      } catch (ex) {
        console.error(
          'A message listener encountered an error; the error will be ignored.',
          ex,
        );
      }
    }
  }

  return {
    subscribe,
    publish,
  };
}
