import { h, render } from "preact";
import { useEffect, useState } from "preact/hooks";
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

  if(!model){
    return null;
  }

  return (
    <div class="cow-game-ui">
      <p>Houses won: {model.housesWon.length}</p>
      <p>Houses lost: {model.housesLost.length}</p>
      <p>Houses remaining: {model.housesRemaining}</p>
      <p>Horses spawned: {model.horsesSpawned}</p>
    </div>
  );
}
