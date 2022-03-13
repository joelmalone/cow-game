import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
// Side-effects required as per https://doc.babylonjs.com/divingDeeper/developWithBjs/treeShaking
import "@babylonjs/core/Materials/standardMaterial";

import type { GameController } from "../cow-game-domain/cow-game-controller";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import HorseGltf from "./assets/Horse.gltf?url";

const Speed = 3;

export async function createHorseRenderer(
  scene: Scene,
  gameController: GameController
) {
  // Observe character movement and transform it into a movement
  //  vector to be applied later (during rendering)
  const localVelocity = new Vector3();
  // inputs.all.add((states) => {
  //   localVelocity.set(0, 0, 0);
  //   if (states.forward) {
  //     localVelocity.addInPlaceFromFloats(0, 0, 1);
  //   }
  //   if (states.left) {
  //     localVelocity.addInPlaceFromFloats(-1, 0, 0);
  //   }
  //   if (states.right) {
  //     localVelocity.addInPlaceFromFloats(1, 0, 0);
  //   }
  // });

  SceneLoader.ImportMesh(
    "",
    HorseGltf,
    "",
    scene,
    (
      meshes,
      particleSystems,
      skeletons,
      animationGroups,
      transformNodes,
      geometries,
      lights
    ) => {
      // shadowGenerator.addShadowCaster(meshes[0], true);

      // Get the animations and begin playing them, but with 0 weight
      const idleAnimation = animationGroups.find((a) => a.name === "Idle")!;
      const walkingAnimation = animationGroups.find((a) => a.name === "Walk")!;
      [idleAnimation, walkingAnimation].forEach((a) => {
        a.setWeightForAllAnimatables(0);
        a.start(true);
      });
      // [leftAnimation, rightAnimation].forEach((a) => {
      //   a.syncAllAnimationsWith(walkingAnimation.animatables[0]);
      // });

      // We want to transition smoothly between animations, so keep track of that
      // TODO: I think animationtarget has this built-in, look it up
      const targetWeights = {
        idleAnimation: 1,
        walkingAnimation: 0,
      };
      const currentWeights = {
        idleAnimation: 1,
        walkingAnimation: 0,
      };

      const weightsKeys: (keyof typeof currentWeights)[] = [
        "idleAnimation",
        "walkingAnimation",
      ];
      scene.onBeforeAnimationsObservable.add(() => {
        // Observe the current movement vector and reflect it in the target weights
        // Note: walk never goes to a weight of zero. If we set it to 0, then it
        //  stops animating, which means left and right can no longer sync to it.
        //  So we use a tiny non-zero value instead.
        targetWeights.walkingAnimation = localVelocity.z > 0.1 ? 1 : 0.000001;
        targetWeights.idleAnimation =
          targetWeights.walkingAnimation == 0.000001 ? 1 : 0;

        // Transition to the target weights
        for (const k of weightsKeys) {
          if (currentWeights[k] < targetWeights[k]) {
            currentWeights[k] += 0.1;
            if (currentWeights[k] > targetWeights[k]) {
              currentWeights[k] = targetWeights[k];
            }
          } else if (currentWeights[k] > targetWeights[k]) {
            currentWeights[k] -= 0.1;
            if (currentWeights[k] < targetWeights[k]) {
              currentWeights[k] = targetWeights[k];
            }
          }
        }
        // Apply target weights
        idleAnimation.setWeightForAllAnimatables(
          currentWeights["idleAnimation"]
        );
        walkingAnimation.setWeightForAllAnimatables(
          currentWeights["walkingAnimation"]
        );
      });

      // Move the player
      const renderObservable = scene.onBeforeRenderObservable.add(() => {
        const deltaTime = scene.getEngine().getDeltaTime();
        const delta = localVelocity
          .normalize()
          .scale((deltaTime * Speed) / 1000);
        meshes[0].position.addInPlace(delta);
        // TODO: turn towards direction
        meshes[0].setDirection(localVelocity, Math.PI); // Not sure why we need yaw; scene RH vs mesh LH?
      });

      // // Add a dummy mesh at the mesh's midpoint, then use that as the camera target
      // const dummy = new BABYLON.Mesh("dummy", scene, meshes[0]);
      // dummy.position.addInPlaceFromFloats(0, 1, 0);
      // followCamera.lockedTarget = dummy;
    },
    function () {}
  );

  // var walkTarget = new Vector3();
  function walkToRandomPoint() {
    if (Math.random() < 0.5) {
      localVelocity.set(Math.random() * 50, 0, Math.random() * 50);
    } else {
      localVelocity.setAll(0);
    }
  }

  // const unsubscribeEvents = gameController.subscribeEvents((ev) => {
  //   switch (ev.event.type) {
  //     case 'INewGameStarted': {
  //       mesh.position.setAll(0);
  //       break;
  //     }
  //   }
  // });

  // function onRender(engine: Engine) {
  //   const delta = engine.getDeltaTime() / 1000;
  //   const diff = walkTarget
  //     .subtract(mesh.position)
  //     .normalize()
  //     .scale(Speed * delta);
  //   mesh.position.addInPlace(diff);
  // }
  // scene.getEngine().onBeginFrameObservable.add(onRender);

  function dispose() {
    // scene.getEngine().onBeginFrameObservable.removeCallback(onRender);
    // unsubscribeEvents();
  }

  return {
    walkToRandomPoint,
    dispose,
  };
}
