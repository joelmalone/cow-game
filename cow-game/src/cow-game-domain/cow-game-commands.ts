import type { Events } from "./cow-game-events";
import type { IModel, IPosition } from "./cow-game-model";

export type Command = (
  modelContainer: { readonly model: IModel },
  emitEvent: (ev: Events) => void
) => void;

export function startNewGame(seed: string): Command {
  return ({ model }, emitEvent) => {
    emitEvent({
      type: "INewGameStarted",
    });
  };
}

export function tapOnMap(position: IPosition): Command {
  return ({ model }, emitEvent) => {
    emitEvent({ type: "IDestinationUpdated", position });
  };
}
