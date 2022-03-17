import { AppError } from "./app-errors";

const log = {
  debug: (...p: unknown[]) =>
    console.debug("[command-event-model-controller]", ...p),
  error: (...p: unknown[]) =>
    console.error("[command-event-model-controller]", ...p),
};

export interface ChangeEvent<TModel, TEvent> {
  event: TEvent;
  version: number;
  model: TModel;
}

export type ModelChangedEventListener<TModel, TEvent> = (
  ev: ChangeEvent<TModel, TEvent>
) => void;

export interface IModelContainer<TModel> {
  readonly model: TModel;
}

export type Executor<TModel, TEvent, TCommand> = (
  model: IModelContainer<TModel>,
  command: TCommand,
  emitEvent: (ev: TEvent) => void
) => void;

export type Reducer<TModel, TEvent> = (model: TModel, ev: TEvent) => TModel;

export function createCommandEventModelController<TModel, TEvent, TCommand>(
  initialModel: TModel,
  execute: Executor<TModel, TEvent, TCommand>,
  reduce: Reducer<TModel, TEvent>,
  publishEvent: ModelChangedEventListener<TModel, TEvent>
) {
  var currentModel = initialModel;
  var version = 0;

  var commandCounter = 0;
  const commandQueue: [number, TCommand][] = [];

  function enqueueCommand(command: TCommand) {
    if (commandQueue.length > 100) {
      throw new AppError(
        "There are too many commands in the command queue; are we doomed?"
      );
    }

    commandQueue.push([++commandCounter, command]);

    if (commandQueue.length === 1) {
      while (commandQueue.length > 0) {
        const [poppedCounter, poppedCommand] = commandQueue[0];

        const poppedCommandType =
          (poppedCommand as any).name || "(unknown type)";
        log.debug(
          `Executing command #${poppedCounter} of type ${poppedCommandType}.`
        );

        try {
          var tentativeModel = currentModel;
          const modelContainer = {
            get model() {
              return tentativeModel;
            },
          };
          var tentativeVersion = version;
          var capturedChanges: ChangeEvent<TModel, TEvent>[] = [];

          function onEventEmitted(event: TEvent) {
            const newModel = reduce(tentativeModel, event);
            if(!Object.is(newModel, tentativeModel)){
              tentativeModel = newModel;
              tentativeVersion++;
            }

            capturedChanges.push({
              event,
              version: tentativeVersion,
              model: tentativeModel,
            });
          }

          execute(modelContainer, poppedCommand, onEventEmitted);

          if (capturedChanges.length > 0) {
            currentModel = tentativeModel;
            version = tentativeVersion;

            for (const capturedChange of capturedChanges) {
              const eventType =
                (capturedChange.event as any).type || "(unknown type)";
              log.debug(
                `Emitting an event with model version #${capturedChange.version} and event type ${eventType}.`,
                capturedChange
              );

              try {
                publishEvent(capturedChange);
              } catch (err) {
                log.error(
                  "Exception during publishEvent() callback will be ignored.",
                  err
                );
              }
            }
          } else {
            log.debug("The command did not emit any events.");
          }
        } catch (err) {
          log.error(
            "Error executing command.",
            {
              poppedCounter,
              poppedCommand,
              currentModel,
            },
            err
          );
        }

        commandQueue.splice(0, 1);
      }
    }
  }

  return {
    enqueueCommand,
  };
}
