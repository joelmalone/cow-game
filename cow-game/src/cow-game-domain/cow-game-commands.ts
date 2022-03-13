import type { Events } from './cow-game-events';
import type { IModel, IPole } from './cow-game-model';

export type Command = (
  modelContainer: { readonly model: IModel },
  emitEvent: (ev: Events) => void,
) => void;

export function startNewGame(seed: string): Command {
  return ({ model }, emitEvent) => {
    const poles = [0, 1, 2, 3, 4,5,6,7,8,9]
      .flatMap((x) => [0, 1, 2, 3, 4,5,6,7,8,9].map((y) => ({ x, y })))
      .map<IPole>((position, index) => ({
        id: index,
        position: { x: position.x * 5, y: position.y * 5 },
        state: 'closed',
        edges: [],
      }));

    emitEvent({
      type: 'INewGameStarted',
      seed,
      poles,
    });
  };
}

export function breakARandomPole(): Command {
  return ({ model }, emitEvent) => {
    const poleIndex = model.hash % model.poles.length;
    if (model.poles[poleIndex].state !== 'broken') {
      emitEvent({ type: 'PoleBroke', poleIndex });
    }
  };
}

export function endTurn(): Command {
  return ({ model }, emitEvent) => {
    emitEvent({
      type: 'TurnEnded',
      oldTurn: model.turn,
      newTurn: model.turn + 1,
    });
  };
}
