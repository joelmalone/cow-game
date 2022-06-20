import { h, render } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import { spawnHorse, startNewGame } from "../cow-game-domain/cow-game-commands";
import { GameController } from "../cow-game-domain/cow-game-controller";
import { IModel } from "../cow-game-domain/cow-game-model";

import "./cow-game-ui.css";

export function CowGameUi({
  gameController,
}: {
  gameController: GameController;
}) {
  const [model, setModel] = useState<IModel | null>(null);

  useEffect(() => {
    const unsubscriber = gameController.subscribeEvents((ev) => {
      setModel(ev.model);
    });

    return unsubscriber;
  }, [gameController]);

  const gameTime = useGameTime(gameController);

  if (!model) {
    return null;
  }

  function onStartNewGame() {
    gameController.enqueueCommand(startNewGame(""));
  }

  function onClickSpawnHorse() {
    gameController.enqueueCommand(spawnHorse());
  }

  return (
    <>
      <div class="cow-game-ui">
        <p>Houses won: {model.housesWon.length}</p>
        <p>Houses lost: {model.housesLost.length}</p>
        <p>Houses remaining: {model.housesRemaining}</p>
        <p>Horses spawned: {model.horsesSpawned}</p>
        <button onClick={onStartNewGame}>Start new game</button>
      </div>
      <div class="npcs-panel">
        {model.npcs.map((npc) => (
          <button key={npc.id}>
            NPC {npc.id}{" "}
            {getNpcEmoji(
              npc.deathTime - npc.spawnTime,
              gameTime - npc.spawnTime
            )}{" "}
            ({Math.trunc((npc.deathTime - gameTime) * 10) / 10})
          </button>
        ))}
      </div>
      <div class="bottom-panel">
        <button onClick={onClickSpawnHorse}>HORSE ME</button>
      </div>
    </>
  );
}

function useGameTime(gameController: GameController) {
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    const unsubscribe = gameController.subscribeEvents((ev) => {
      switch (ev.event.type) {
        case "INewGameStarted": {
          setStartTime(Date.now());
        }
      }
    });
    return unsubscribe;
  }, [gameController]);

  const [time, setTime] = useState(0);

  useEffect(() => {
    const n = setInterval(() => {
      setTime(Date.now());
    }, 100);
    return () => clearInterval(n);
  }, []);

  return (time - startTime) / 1000;
}

const Emojis = Array.from("😀🙂🤨😡🤬");

function getNpcEmoji(npcLifespan: number, elapsed: number) {
  const t = elapsed / npcLifespan;
  if (t >= 1) {
    return "🏆";
  }
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  const e = Emojis[Math.trunc(c * Emojis.length)];
  return e;
}
