import type { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import "@babylonjs/core/helpers/sceneHelpers";

import type { GameController } from "../cow-game-domain/cow-game-controller";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { createHorseRenderer } from "./horse-renderer";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

import CountryEnv from "./assets/country.env?url";
import { createCameraRenderer } from "./camera-renderer";

// TODO:
// https://playground.babylonjs.com/#CSPJ7A#3

export async function createBabylonScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
  gameController: GameController
) {
  const scene = new Scene(engine);

  scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(
    CountryEnv,
    scene
  );
  scene.createDefaultSkybox(scene.environmentTexture, false, 1000, 0, false);

  engine.runRenderLoop(function () {
    scene.render();
  });

  // const light = new HemisphericLight('light', new Vector3(1, 1, -1), scene);
  var light = new HemisphericLight("hemiLight", new Vector3(-1, 1, -1), scene);
  light.diffuse = new Color3(1, 1, 1);
  light.specular = new Color3(0, 1, 0);
  light.groundColor = new Color3(0, 1, 0);

  const arenaSize = 10;
  const cameraRenderer = createCameraRenderer(
    canvas,
    scene,
    gameController,
    arenaSize
  );

  const horseRenderer = createHorseRenderer(scene, gameController);
  setInterval(() => {
    horseRenderer.walkToRandomPoint();
  }, 5000);

  // appBus.publish({ type: 'BabylonMapSceneReady', scene });

  function dispose() {
    // appBus.publish({ type: 'BabylonMapSceneDisposing', scene });

    horseRenderer.dispose();
    cameraRenderer.dispose();
    scene.dispose();
  }

  return { scene, dispose };
}
