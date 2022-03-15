import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import "@babylonjs/core/Materials/standardMaterial";

import { TopDownCameraInput } from "../reusable/babylon/top-down-camera-input";
import { PanCameraInput } from "../reusable/babylon/pan-camera-input";
import type { GameController } from "../cow-game-domain/cow-game-controller";

export function createCameraRenderer(
  canvas: HTMLCanvasElement,
  scene: Scene,
  gameController: GameController,
  arenaSize: number
) {
  const cameraAngle = new Vector3(1, -1, 1);
  const focus = new Vector3(0.5, 0, 0.5).scale(arenaSize);
  const cameraDistance = 20;

  // Parameters : name, position, scene
  var camera = new UniversalCamera(
    "UniversalCamera",
    focus.subtract(cameraAngle.scale(cameraDistance)),
    scene
  );
  camera.setTarget(focus);
  camera.fov = 0.2;

  // https://doc.babylonjs.com/divingDeeper/cameras/customizingCameraInputs
  camera.inputs.clear();
  camera.inputs.add(new TopDownCameraInput());
  camera.inputs.add(new PanCameraInput());
  camera.inputs.addMouseWheel();

  // Doesn't work, needs fix fix
  camera.attachControl(canvas, true);

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        break;
      }
    }
  });

  function dispose() {
    unsubscribeEvents();
    camera.dispose();
  }

  return {
    dispose,
  };
}
