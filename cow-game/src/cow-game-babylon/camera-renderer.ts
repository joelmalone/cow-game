import type { Scene } from "@babylonjs/core/scene";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";

import { TopDownCameraInput } from "../reusable/babylon/top-down-camera-input";
import { PanCameraInput } from "../reusable/babylon/pan-camera-input";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { tap } from "../cow-game-domain/cow-game-commands";
import {
  getMetadata,
  GridMidpoint,
  GroundPlane,
  positionToVector3,
  vector3ToPosition,
} from "./babylon-helpers";
import { IPosition, Tappable } from "../cow-game-domain/cow-game-model";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import {
  HasPosition,
  startFollowBehaviour,
} from "../reusable/babylon/follow-behaviour";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

export function createCameraRenderer(
  canvas: HTMLCanvasElement,
  scene: Scene,
  gameController: GameController,
  playerTransformNode: TransformNode
) {
  const cameraDirection = new Vector3(1, -1, 2);
  const cameraDistance = 100;
  const cameraOffset = cameraDirection.scale(-cameraDistance);

  const camera = new FreeCamera("Main camera", cameraOffset, scene);
  camera.target = Vector3.Zero();
  camera.fov = 0.025;

  // https://doc.babylonjs.com/divingDeeper/cameras/customizingCameraInputs
  camera.inputs.clear();
  const panCameraInput = new PanCameraInput();
  camera.inputs.add(panCameraInput);

  // Attach the camera to the canvas, so dragging works
  camera.attachControl(canvas);

  var focusUntil = 0;
  var focus: HasPosition | null = null;

  // Make the camera follow the player (but maintain relative position)
  var lastDragTime = 0;
  const followCamera = startFollowBehaviour(
    scene,
    camera,
    () => {
      if (panCameraInput.isDragging) {
        lastDragTime = Date.now();
      }
      if (Date.now() - lastDragTime < 1000) {
        return null;
      }

      if (focus && Date.now() < focusUntil) {
        return focus;
      }

      return playerTransformNode;
    },
    {
      useOffset: true,
      aggressiveness: 3,
    }
  );

  // Only tap on things with a metadata.tappable value
  scene.pointerUpPredicate = (abstractMesh) =>
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

  const unsubscribe = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "IHouseFocused": {
        focusUntil = Date.now() + 2000;
        focus = {
          position: positionToVector3(ev.event.housePosition).add(GridMidpoint),
        };
      }
    }
  });

  function dispose() {
    unsubscribe();
    followCamera.dispose();
    camera.dispose();
  }

  return {
    dispose,
  };
}
