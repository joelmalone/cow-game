// const log = {
//   debug: (...p: unknown[]) => console.debug('[message-bus]', ...p),
//   error: (...p: unknown[]) => console.error('[message-bus]', ...p),
// };
const log = { debug: (...p: unknown[]) => {}, error: (...p: unknown[]) => {} };

export type Listener<TMessage> = (
  message: Readonly<TMessage>,
) => Promise<void> | void;

export type Subscription = () => void;

export type Subscriber<TMessage> = (
  listener: Listener<TMessage>,
) => Subscription;

export function createAsyncMessageBus<TMessage>() {
  var messageCounter = 0;
  const queue: [number, TMessage][] = [];
  var isDequeing = false;
  const listeners: Listener<TMessage>[] = [];

  function subscribeAsyncListener(listener: Listener<TMessage>) {
    listeners.push(listener);

    return () => {
      const i = listeners.indexOf(listener);
      i >= 0 && listeners.splice(i, 1);
    };
  }

  async function enqueueMessage(message: TMessage) {
    queue.push([++messageCounter, message]);

    if (!isDequeing) {
      isDequeing = true;

      while (queue.length > 0) {
        const [messageCounter, poppedMessage] = queue.splice(0, 1)[0];

        const messageType =
          (poppedMessage as any).type ||
          (poppedMessage as any).event.type ||
          '(unknown type)';
        log.debug(
          `Broadcasting message #${numToSSColumn(
            messageCounter,
          )} of type ${messageType}.`,
          poppedMessage,
        );

        const waitables = [];
        for (const listener of [...listeners]) {
          try {
            const waitable = listener(poppedMessage);
            if (waitable) {
              waitables.push(waitable);
            }
          } catch (err) {
            log.error(
              'Error while publishing message to an async listener.',
              {
                listener,
              },
              err,
            );
          }
        }

        if (waitables.length > 0) {
          await Promise.all(waitables);
        }
      }

      isDequeing = false;
    }
  }

  return {
    subscribeAsyncListener,
    enqueueMessage,
  };
}

// https://stackoverflow.com/a/45789255/246901
function numToSSColumn(n: number) {
  var s = '',
    t;

  while (n > 0) {
    t = (n - 1) % 26;
    s = String.fromCharCode(65 + t) + s;
    n = ((n - t) / 26) | 0;
  }
  return s || undefined;
}
