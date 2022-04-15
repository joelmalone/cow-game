import { Command, spawnNpc } from "./cow-game-commands";
import { GameController } from "./cow-game-controller";
import { Events } from "./cow-game-events";

export type Executor = (command: Command) => void;

export function startNpcSpawnerBehaviour(
  gameController: GameController
) {
  const token = setInterval(() => {
    gameController.enqueueCommand(spawnNpc());
  }, 2500);

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    // switch (ev.event.type) {
    //   case "INpcSpawned": {
    //     const { spawnPosition } = ev.event;
    //     spawnHorse(spawnPosition);
    //     break;
    //   }
    // }
  });

  function dispose() {
    unsubscribeEvents();
    clearInterval(token);
  }

  return dispose;
}
