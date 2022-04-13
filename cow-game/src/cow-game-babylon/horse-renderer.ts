import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import HorseGltf from "./assets/Horse.gltf?url";
import { setMetadata } from "./babylon-helpers";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";

const Speed = 1;

export function createHorseRenderer(
  scene: Scene,
  gameController: GameController
) {
  const disposers: Disposer[] = [];

  var walkTarget: Vector3 | null = null;
  const localVelocity = new Vector3(0, 0, 0);

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
      // The horse mesh is 5.5 units horizontally from nose to butt, so scale it down to 1
      meshes[0].scaling.setAll(1 / 5.5);

      // Get the horse mesh's bounds (including descendant meshes)
      const bounds = meshes[0].getHierarchyBoundingVectors();
      const length = bounds.max.z - bounds.min.z;
      const width = bounds.max.x - bounds.min.x;
      const height = bounds.max.y - bounds.min.y;

      // Create a tappable mesh; we'l use this as the root
      const horseRoot = MeshBuilder.CreateBox(
        "Player horse",
        { size: length * 0.8, width: width * 0.8, height: height * 0.8 },
        scene
      );
      horseRoot.position.set(0, height * 0.5, 0);
      horseRoot.isVisible = false;
      // Tag the horse to be picked up by the "tap" subsystem
      setMetadata(horseRoot, { tappable: "player" });

      horseRoot.physicsImpostor = new PhysicsImpostor(
        horseRoot,
        PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.1 },
        scene
      );

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
      const animationObserver = scene.onBeforeAnimationsObservable.add(() => {
        // Observe the current movement vector and reflect it in the target weights
        // Note: walk never goes to a weight of zero. If we set it to 0, then it
        //  stops animating, which means left and right can no longer sync to it.
        //  So we use a tiny non-zero value instead.
        targetWeights.walkingAnimation =
          localVelocity.lengthSquared() > 0.000001 ? 1 : 0.000001;
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
      disposers.push(() =>
        scene.onBeforeRenderObservable.remove(animationObserver)
      );

      // Move the horse
      const renderObservable = scene.onBeforeRenderObservable.add(() => {
        const deltaTime = scene.getEngine().getDeltaTime();

        var diff = walkTarget && walkTarget.subtract(horseRoot.position);
        if (diff) {
          diff.y = 0;
        }
        if (diff && diff.lengthSquared() > 0.001) {
          localVelocity.copyFrom(
            diff.normalize().scale((deltaTime * Speed) / 1000)
          );

          horseRoot.position.addInPlace(localVelocity);
          // TODO: when we're parented, we need to use -ve direction; find out why
          horseRoot.setDirection(localVelocity.scale(-1));
          // TODO: gradually turn towards direction
        } else {
          localVelocity.set(0, 0, 0);
        }
      });
      disposers.push(() =>
        scene.onBeforeRenderObservable.remove(renderObservable)
      );

      meshes[0].setParent(horseRoot);
      meshes[0].position.set(0, -height * 0.5, 0);
    }
  );

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "IDestinationUpdated": {
        const { position } = ev.event;
        walkTarget = new Vector3(position.x, 0, position.y);
        break;
      }
    }
  });

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
    disposers.forEach((d) => d());
    unsubscribeEvents();
  }

  return {
    dispose,
  };
}
