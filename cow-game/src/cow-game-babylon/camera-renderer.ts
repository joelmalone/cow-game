import type { Scene } from "@babylonjs/core/scene";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";

import { TopDownCameraInput } from "../reusable/babylon/top-down-camera-input";
import { PanCameraInput } from "../reusable/babylon/pan-camera-input";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { tapOnMap } from "../cow-game-domain/cow-game-commands";
import { GroundPlane } from "./babylon-helpers";

export function createCameraRenderer(
  canvas: HTMLCanvasElement,
  scene: Scene,
  gameController: GameController,
  arenaSize: number
) {
  const cameraAngle = new Vector3(1, -1, 1);
  const focus = new Vector3(0.5, 0, 0.5).scale(arenaSize);
  const cameraDistance = 100;

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

  scene.onPointerDown = function castRay() {
    const ray = scene.createPickingRay(
      scene.pointerX,
      scene.pointerY,
      Matrix.Identity(),
      camera
    );

    const t = ray.intersectsPlane(GroundPlane);
    const hit = t && ray.origin.add(ray.direction.scale(t));
    if (hit) {
      gameController.enqueueCommand(tapOnMap({ x: hit.x, y: hit.z }));
    }
  };

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
