// const log = {
//   debug: (...p: unknown[]) => console.debug('[message-bus]', ...p),
//   error: (...p: unknown[]) => console.error('[message-bus]', ...p),
// };
const log = { debug: (...p: unknown[]) => {}, error: (...p: unknown[]) => {} };

export type Listener<TMessage> = (message: Readonly<TMessage>) => void;
export type Subscription = () => void;
export type Subscriber<TMessage> = (
  listener: Listener<TMessage>,
) => Subscription;

export type Enqueuer<TMessage> = (message: TMessage) => void;

export function createMessageBus<TMessage>() {
  var messageCounter = 0;
  const queue: [number, TMessage][] = [];
  var isDequeing = false;
  const listeners: Listener<TMessage>[] = [];

  const subscribe: Subscriber<TMessage> = function subscribe(
    listener: Listener<TMessage>,
  ) {
    listeners.push(listener);

    return () => {
      const i = listeners.indexOf(listener);
      i >= 0 && listeners.splice(i, 1);
    };
  };

  const enqueueMessage: Enqueuer<TMessage> = function enqueueMessage(
    message: TMessage,
  ) {
    queue.push([++messageCounter, message]);

    if (!isDequeing) {
      isDequeing = true;

      while (queue.length > 0) {
        const [poppedCounter, poppedMessage] = queue.splice(0, 1)[0];

        const messageType =
          (poppedMessage as any).type ||
          (poppedMessage as any).event.type ||
          '(unknown type)';
        log.debug(
          `Broadcasting message #${numToSSColumn(
            poppedCounter,
          )} of type ${messageType}.`,
          poppedMessage,
        );

        for (const listener of [...listeners]) {
          try {
            listener(poppedMessage);
          } catch (err) {
            log.error(
              'Error while publishing message to a listener.',
              {
                listener,
              },
              err,
            );
          }
        }
      }

      isDequeing = false;
    }
  };

  return {
    subscribe,
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
