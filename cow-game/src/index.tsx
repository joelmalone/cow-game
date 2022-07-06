import { h, render } from "preact";
import "preact/devtools";
import { Engine } from "@babylonjs/core/Engines/engine";
// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import BabylonEngine, {
  DisposableEngine,
} from "./reusable/babylon/preact-babylon-engine/BabylonEngine";
import "./index.css";
import { createBabylonScene } from "./cow-game-babylon/babylon-scene";
import { createGameController } from "./cow-game-domain/cow-game-controller";
import { startNpcSpawnerBehaviour } from "./cow-game-domain/cow-game-behaviours";
import { startNewGame } from "./cow-game-domain/cow-game-commands";
import { CowGameUi } from "./cow-game-ui/cow-game-ui";
import { CowGameSimulation } from "./cow-game-domain/cow-game-simulation";
import { INpc } from "./cow-game-domain/cow-game-model";
import { useMemo, useState } from "preact/hooks";

const controller = createGameController();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found.");
}

function App() {
  const [simulation, setSimulation] = useState<CowGameSimulation | null>(null);

  const createBabylonEngine = useMemo(
    () => async (canvas: HTMLCanvasElement) => {
      const engine = new Engine(canvas, true);

      const disposableScene = await createBabylonScene(
        engine,
        canvas,
        controller
      );

      const wany = window as any;
      wany.hax = {
        ...wany.hax,
        debug: () => (disposableScene.scene as any).debugLayer.show(),
      };

      // Can press ` to open the Babylon inspector
      canvas.addEventListener("keyup", (ev) => {
        if (ev.key === "`") {
          disposableScene.scene.debugLayer.show({
            globalRoot: document.body,
          });
        }
      });

      const disposeSpawnNpcBehaviour = startNpcSpawnerBehaviour(controller);

      function dispose() {
        disposeSpawnNpcBehaviour();
        disposableScene.dispose();
        engine.dispose();
      }

      controller.enqueueCommand(startNewGame(""));

      setSimulation(disposableScene.simulation);

      return { engine, dispose };
    },
    []
  );

  return (
    <>
      <BabylonEngine engineFactory={createBabylonEngine} />
      <CowGameUi gameController={controller} simulation={simulation} />
    </>
  );
}

render(<App />, root);
