import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import type { Scene } from "@babylonjs/core/scene";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";

import HorseGltf from "./assets/Horse.gltf?url";
import { PhysicsImpostor } from "@babylonjs/core/Physics/physicsImpostor";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AppError } from "../reusable/app-errors";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scalar } from "@babylonjs/core/Maths/math.scalar";
import { Node } from "@babylonjs/core/node";
import { IPosition } from "../cow-game-domain/cow-game-model";
import {
  GridMidpoint,
  positionToVector3,
  vector3ToPosition,
} from "./babylon-helpers";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { delay } from "../reusable/promise-helpers";
import { createRendererController } from "./render-controllers";
import { INpcSpawned } from "../cow-game-domain/cow-game-events";
import {
  notifyNpcArrivedAtHome,
  notifyNpcExploded,
} from "../cow-game-domain/cow-game-commands";

const CUBE_SIZE = 0.25;
const CUBE_MASS = 40;
const CUBE_IMPULSE_LENGTH = 50;

export function createNpcRenderer(
  scene: Scene,
  gameController: GameController,
  groundMesh: AbstractMesh
) {
  const npcParent = new TransformNode("NPCs", scene);
  const debugLineParent = new TransformNode("Debug lines", scene);

  /**
   * Spawn a new NPC.
   */
  function spawnNewNpc(npcSpawnedEvent: INpcSpawned) {
    /**
     * Called when the NPC just moved (they move in bursts).
     */
    function onNpcMoved(position: Vector3) {
      spawnDebugLine(
        scene,
        position,
        ...npcSpawnedEvent.npc.route
          .slice(routeCounter)
          .map((p) => positionToVector3(p).add(GridMidpoint))
      );
    }

    var routeCounter = 0;

    /**
     * Called when the NPC has arrived at it's current waypoint.
     */
    function onArrivedAtTarget() {
      ++routeCounter;
      if (routeCounter >= npcSpawnedEvent.npc.route.length) {
        // Arrived at home!
        console.debug(`An npc has arrived at home!`, npcSpawnedEvent);
        gameController.enqueueCommand(
          notifyNpcArrivedAtHome(
            npcSpawnedEvent.npc.id
          )
        );
      } else {
        cube.setMoveTarget(
          positionToVector3(npcSpawnedEvent.npc.route[routeCounter]).add(
            GridMidpoint
          )
        );
      }
    }

    const cube = createWanderingCube(
      scene,
      positionToVector3(npcSpawnedEvent.npc.route[0], 2).add(GridMidpoint),
      onNpcMoved,
      onArrivedAtTarget
    );
    cube.mesh.parent = npcParent;

    const timeout = setTimeout(() => {
      gameController.enqueueCommand(
        notifyNpcExploded(
          npcSpawnedEvent.npc.id
        )
      );
    }, (npcSpawnedEvent.npc.deathTime-npcSpawnedEvent.npc.spawnTime) * 1000);

    return {
      ...cube,
      dispose: () => {
        clearTimeout(timeout);
        cube.dispose();
      },
    };
  }

  const renderController = createRendererController(
    (npcSpawnedEvent: INpcSpawned) => npcSpawnedEvent.npc.id,
    spawnNewNpc
  );

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        renderController.removeAndDisposeAll();
        break;
      }

      case "INpcSpawned": {
        renderController.add(ev.event);
        break;
      }

      case "INpcArrivedAtHome": {
        const rendered = renderController.get(ev.event.npc.id);
        rendered.dispose();
        break;
      }

      case "INpcExploded": {
        const rendered = renderController.get(ev.event.npc.id);
        rendered.dispose();
        break;
      }
    }
  });

  function dispose() {
    // TODO: clean up render controller
    // renderController.dispose();

    unsubscribeEvents();
  }

  return {
    dispose,
  };
}

function createWanderingCube(
  scene: Scene,
  position: Vector3,
  onMoved: (position: Vector3, impulse: Vector3) => void,
  onArrivedAtTarget: () => void
) {
  var disposed = false;
  var moveTarget: Vector3 | null = position;

  function setMoveTarget(target: Vector3 | null) {
    moveTarget = target;
  }

  // TODO: this looks ok, but i guessed the numbers, so read this:
  // https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  const color = new Color3();
  Color3.HSVtoRGBToRef(Math.random() * 360, 0.5, 1, color);

  const mesh = MeshBuilder.CreateBox(
    "cube",
    {
      size: CUBE_SIZE,
      faceColors: [
        color.toColor4(),
        color.toColor4(),
        color.toColor4(),
        color.toColor4(),
        color.toColor4(),
        color.toColor4(),
      ],
    },
    scene
  );
  mesh.receiveShadows = true;

  mesh.position = position;

  mesh.physicsImpostor = new PhysicsImpostor(
    mesh,
    PhysicsImpostor.BoxImpostor,
    { mass: CUBE_MASS, restitution: 0.5 },
    scene
  );

  function move(direction: Vector3) {
    direction.y = 0;
    const impulse = direction.normalize().scale(CUBE_IMPULSE_LENGTH);
    mesh.applyImpulse(
      impulse,
      mesh.getAbsolutePosition().addInPlaceFromFloats(0, 0.25, 0)
    );
    onMoved(mesh.getAbsolutePosition(), impulse);
  }

  async function brain() {
    do {
      await delay(Math.random() * 2000 + 1000);

      if (moveTarget) {
        const diff = moveTarget.subtract(mesh.position);
        diff.y = 0;
        if (diff.length() < 0.5) {
          moveTarget = null;
          onArrivedAtTarget();
        }
      }

      if (moveTarget) {
        const d = moveTarget.subtract(mesh.position);
        move(d);
      }
    } while (!disposed);
  }

  brain();

  function dispose() {
    disposed = true;
    mesh.dispose();
  }

  return {
    mesh,
    setMoveTarget,
    dispose,
  };
}

function spawnDebugLine(scene: Scene, ...points: Vector3[]) {
  var parent: TransformNode | null = scene.getMeshByName("Debug lines");
  if (!parent) {
    parent = new TransformNode("Debug lines", scene);
  }

  const debugLine = MeshBuilder.CreateLines(
    "Debug line " + Date.now(),
    {
      points,
    },
    scene
  );
  debugLine.parent = parent;
  setTimeout(() => {
    debugLine.dispose();
  }, 2500);
}
