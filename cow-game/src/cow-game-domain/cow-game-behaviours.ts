import { Command, endGame, spawnNpc } from "./cow-game-commands";
import { GameController } from "./cow-game-controller";
import { IModel } from "./cow-game-model";

export function startNpcSpawnerBehaviour(gameController: GameController) {
  var clearTimeouts = () => {};

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        clearTimeouts && clearTimeouts();
        clearTimeouts = startSpawnTimers(
          ev.model.npcsToSpawn,
          gameController.enqueueCommand
        );
        console.log("NPC spawner timers have started.", ev.model.npcsToSpawn);
        break;
      }
    }
  });

  function dispose() {
    unsubscribeEvents();
    clearTimeouts && clearTimeouts();
  }

  return dispose;
}

/**
 * Starts background timers to spawn each of the NPCs provided using the spawnNpc() command.
 * @param npcsToSpawn The NPCs to spawn.
 * @param enqueueCommand The receiver for the spawnNpc() command.
 * @returns A method to invoke to cancel all timers.
 */
function startSpawnTimers(
  npcsToSpawn: IModel["npcsToSpawn"],
  enqueueCommand: GameController["enqueueCommand"]
): () => void {
  const spawnerTokens = npcsToSpawn.map((npc) => {
    const token = setTimeout(() => {
      enqueueCommand(spawnNpc());
    }, npc.spawnTime * 1000);
    return token;
  });

  return () => {
    for (const t of spawnerTokens) {
      clearTimeout(t);
    }
  };
}

export function startGameOverProcess(
  gameController: GameController
): () => void {
  const unsubscribe = gameController.subscribeEvents((ev) => {
    if (ev.model.gameState === "playing" && ev.model.housesRemaining === 0) {
      gameController.enqueueCommand(endGame());
    }
  });

  return unsubscribe;
}
