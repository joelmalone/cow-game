import type { Scene } from "@babylonjs/core/scene";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";

import { TopDownCameraInput } from "../reusable/babylon/top-down-camera-input";
import { PanCameraInput } from "../reusable/babylon/pan-camera-input";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { tap } from "../cow-game-domain/cow-game-commands";
import {
  getMetadata,
  GroundPlane,
  positionToVector3,
  vector3ToPosition,
} from "./babylon-helpers";
import { Tappable } from "../cow-game-domain/cow-game-model";

export function createCameraRenderer(
  canvas: HTMLCanvasElement,
  scene: Scene,
  gameController: GameController
) {
  const cameraAngle = new Vector3(1, -1, 2);
  const focus = new Vector3(0, 0, 0);
  const cameraDistance = 100;

  // Parameters : name, position, scene
  var camera = new UniversalCamera(
    "UniversalCamera",
    focus.subtract(cameraAngle.scale(cameraDistance)),
    scene
  );
  camera.setTarget(focus);
  camera.fov = 0.05;

  // https://doc.babylonjs.com/divingDeeper/cameras/customizingCameraInputs
  camera.inputs.clear();
  // camera.inputs.add(new TopDownCameraInput());
  const panCameraInput = new PanCameraInput();
  camera.inputs.add(panCameraInput);

  // Attach the camera to the canvas, so dragging works
  camera.attachControl(canvas);

  // Only tap on things with a metadata.tappable value
  scene.pointerDownPredicate = (abstractMesh) =>
    !!getMetadata(abstractMesh)?.tappable;
  // Handle tap events to parse the tappable, or fallback to a ground tap
  panCameraInput.clickObservable.add(function onClick(pickInfo) {
    const { pickedPoint, pickedMesh } = pickInfo;
    const tappable = pickedPoint && getMetadata(pickedMesh)?.tappable;
    if (tappable) {
      gameController.enqueueCommand(
        tap(tappable, vector3ToPosition(pickedPoint))
      );
      return;
    }

    const ray = scene.createPickingRay(
      scene.pointerX,
      scene.pointerY,
      Matrix.Identity(),
      camera
    );

    const t = ray.intersectsPlane(GroundPlane);
    const hit = t && ray.origin.add(ray.direction.scale(t));
    if (hit) {
      const position = vector3ToPosition(hit);
      gameController.enqueueCommand(tap("terrain", position));
    }
  });

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        const { playerSpawn } = ev.event;
        camera.setTarget(positionToVector3(playerSpawn));
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
