import type { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import {
  GridMidpoint,
  positionToVector3,
  setMetadata,
} from "./babylon-helpers";
import { CowGameAssetsManager, HORSE_SCALE } from "./assets-manager";
import { AppError } from "../reusable/app-errors";
import { IPosition } from "../cow-game-domain/cow-game-model";

const Speed = 1;

export function createHorseRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const horseRenderer = createPlayerHorseRenderer(scene, assetsManager);

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        horseRenderer?.resetForNewGame();

        const { playerSpawn } = ev.event;
        horseRenderer.teleportToPosition(playerSpawn);
        break;
      }

      case "IDestinationUpdated": {
        const { position } = ev.event;
        horseRenderer.setWalkTarget(position);
        break;
      }
    }
  });

  function dispose() {
    unsubscribeEvents();
    horseRenderer.dispose();
  }

  return {
    dispose,
  };
}

function createPlayerHorseRenderer(
  scene: Scene,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];
  const localVelocity = new Vector3(0, 0, 0);
  var teleportTo: IPosition | null = null;
  var walkTarget: IPosition | null = null;

  assetsManager.loadMesh("horse").then(({ loadedContainer }) => {
    const instantiated = loadedContainer.instantiateModelsToScene(
      // Keep the original animationGroup names
      (n) => n
    );
    const horseMesh = instantiated.rootNodes[0];
    horseMesh.name = "Player horse";
    if (!horseMesh) {
      throw new AppError("Failed to clone a horse.");
    }
    // The horse mesh is 5.5 units horizontally from nose to butt, so scale it down to 1
    horseMesh.scaling.setAll(HORSE_SCALE);

    // Get the horse mesh's bounds (including descendant meshes)
    const bounds = horseMesh.getHierarchyBoundingVectors();
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

    // Get the animations and begin playing them, but with 0 weight
    const idleAnimation = instantiated.animationGroups.find(
      (a) => a.name === "Idle"
    )!;
    const walkingAnimation = instantiated.animationGroups.find(
      (a) => a.name === "Walk"
    )!;
    if (!idleAnimation) {
      throw new AppError("Unable to find at least one animation group.", {
        idleAnimation,
        walkingAnimation,
      });
    }
    [idleAnimation, walkingAnimation].forEach((a) => {
      a.setWeightForAllAnimatables(0);
      a.start(true);
    });

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
      idleAnimation.setWeightForAllAnimatables(currentWeights["idleAnimation"]);
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

      var diff =
        walkTarget &&
        positionToVector3(walkTarget).subtract(horseRoot.position);
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

    // Move the horse
    const teleportObservable = scene.onBeforeRenderObservable.add(() => {
      if (teleportTo) {
        horseRoot.position = positionToVector3(teleportTo, height * 0.5).add(
          GridMidpoint
        );
        teleportTo = null;
      }
    });
    disposers.push(() =>
      scene.onBeforeRenderObservable.remove(teleportObservable)
    );

    horseMesh.setParent(horseRoot);
    horseMesh.position.set(0, -height * 0.5, 0);
  });

  function teleportToPosition(position: IPosition) {
    teleportTo = position;
  }

  function setWalkTarget(position: IPosition) {
    walkTarget = position;
  }

  function resetForNewGame() {
    localVelocity.setAll(0);
    teleportTo = null;
    walkTarget = null;
  }

  function dispose() {
    disposers.forEach((d) => d());
  }

  return {
    teleportToPosition,
    setWalkTarget,
    resetForNewGame,
    dispose,
  };
}
