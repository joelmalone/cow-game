/*

TODO: look into some optimisations for the environment meshes, e.g.:

General discussion here:

https://www.html5gamedevs.com/topic/37664-load-mesh-without-rendering-it-then-adding-it-to-the-world-many-times/

Mesh merging:

https://doc.babylonjs.com/divingDeeper/mesh/mergeMeshes

Instancing:

https://doc.babylonjs.com/divingDeeper/mesh/copies/instances

Thin instancing:

  https://doc.babylonjs.com/divingDeeper/mesh/copies/thinInstances

*/

import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Disposable, Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import {
  FacingsToRotation,
  GridMidpoint,
  positionToVector3,
  WorldScale,
} from "./babylon-helpers";
import {
  CowGameAssetsManager,
  HOUSE_SCALE,
  LoadMeshResult,
} from "./assets-manager";
import {
  Facings,
  HouseTypesCount,
  ICell,
  TerrainTypes,
} from "../cow-game-domain/cow-game-model";
import { AssetsManager, Color3, MeshBuilder } from "@babylonjs/core";

export function createGridRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  const houseFactory = createHouseFactory(scene, assetsManager);
  const terrainFactory = createTerrainFactory(scene, assetsManager);

  const houses = new Map<string, ReturnType<typeof houseFactory>>();

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        const { grid } = ev.event;

        for (var x = 0; x < grid.width; x++) {
          for (var y = 0; y < grid.height; y++) {
            // Need to copy x and y because they're not scoped and won't be included in the closure
            const xyCopy = { x, y };

            const { house, terrainType, terrainFacing } =
              grid.cells[x + y * grid.width];
            if (house !== null) {
              const houseClone = houseFactory(
                house.houseType,
                xyCopy.x,
                xyCopy.y,
                house.houseFacing
              );
              const key = `${xyCopy.x},${xyCopy.y}`;
              houses.set(key, houseClone);
              disposers.push(() => {
                houses.delete(key);
                houseClone.dispose();
              });
            }

            const terrainClone = terrainFactory(
              terrainType,
              xyCopy.x,
              xyCopy.y,
              terrainFacing
            );
            disposers.push(() => terrainClone.dispose());
          }
        }
        break;
      }

      case "INpcArrivedAtHome": {
        const renderedHouse = houses.get(
          `${ev.event.homeAddress.x},${ev.event.homeAddress.y}`
        );
        if (renderedHouse) {
          renderedHouse.explode();
        }
        break;
      }

      case "INpcExploded": {
        const renderedHouse = houses.get(
          `${ev.event.homeAddress.x},${ev.event.homeAddress.y}`
        );
        if (renderedHouse) {
          // TODO: remove it from play, but don't explode it... do something uhhh else
          renderedHouse.explode();
        }
        break;
      }
    }
  });

  function dispose() {
    unsubscribeEvents();
    disposers.forEach((d) => d());
  }

  return {
    dispose,
  };
}

/**
 * Creates a factory for instantiating houses into the scene.
 * @param scene The scene to instantiate into.
 * @param assetsManager The assets manager to load assets from.
 * @returns A method to call to dispose the instantiated house.
 */
function createHouseFactory(scene: Scene, assetsManager: CowGameAssetsManager) {
  if (HouseTypesCount !== 20) {
    console.error("The renderer code expects exactly 20 house types so uhhhh.");
  }

  const assetsPromise = Promise.all(
    assetsManager.loadMeshes("house1", "house2", "house3", "house4", "house5")
  ).then(async (houseMeshes) => {
    console.debug(
      `Loaded ${houseMeshes.length} house mesh assets.`,
      houseMeshes
    );

    // Set the scale of the house assets so each house is ~3x3
    for (const houseMesh of houseMeshes) {
      houseMesh.loadedMeshes[0].scaling.setAll(HOUSE_SCALE);
    }

    // Load all house textures and turn them into materials
    var houseMaterials = await Promise.all(
      assetsManager.loadTextures("house1", "house2", "house3", "house4")
    ).then((assets) =>
      assets.map((texture) => {
        const material = new StandardMaterial(texture.name, scene);
        material.diffuseTexture = texture;
        return material;
      })
    );

    console.log("Loaded house materials.", houseMaterials);

    return { houseMeshes, houseMaterials };
  });

  const houseClonesParent = new TransformNode("Houses", scene);

  // Return a method that is asynchronous under the hood, but presents as
  // a standard method that returns a mini API to dispose the mesh

  return function instantiateHouse(
    houseType: number,
    x: number,
    y: number,
    facing: Facings
  ) {
    var disposed = false;
    var cloneRoot: TransformNode | null = null;

    assetsPromise.then(({ houseMeshes, houseMaterials }) => {
      if (disposed) {
        return;
      }

      const houseMesh = houseMeshes[houseType % 5];
      const houseMaterial = houseMaterials[Math.trunc(houseType / 5)];

      cloneRoot =
        houseMesh.loadedContainer.instantiateModelsToScene().rootNodes[0];
      cloneRoot.parent = houseClonesParent;
      cloneRoot.name = `House ${x} ${y}`;

      cloneRoot.position = positionToVector3({ x, y }).add(GridMidpoint);
      cloneRoot.rotation = FacingsToRotation[facing];

      cloneRoot
        .getChildMeshes()
        .forEach((mesh) => (mesh.material = houseMaterial));
    });

    function explode() {
      cloneRoot?.dispose();
    }

    function dispose() {
      disposed = true;
      cloneRoot?.dispose();
      cloneRoot = null;
    }

    return {
      explode,
      dispose,
    };
  };
}

/**
 * Creates a factory for instantiating terrain pieces into the scene.
 * @param scene The scene to instantiate into.
 * @param assetsManager The assets manager to load assets from.
 * @returns A method to call to dispose the instantiated mesh.
 */
function createTerrainFactory(
  scene: Scene,
  assetsManager: CowGameAssetsManager
) {
  const assetsPromise = Promise.all(
    // TODO: streetIntersection
    assetsManager.loadMeshes("streetStraight", "street4Way")
  ).then(async (terrainMeshes) => {
    console.debug(
      `Loaded ${terrainMeshes.length} terrain mesh assets.`,
      terrainMeshes
    );

    // Street tiles are 2x2, so scale them up to 4x4
    // TODO: this code assumes all loaded assets are street pieces
    for (const streetMesh of terrainMeshes) {
      streetMesh.loadedMeshes[0].scaling.setAll(WorldScale * 0.5);
    }

    return new Map<TerrainTypes, LoadMeshResult>([
      [TerrainTypes.Street_Straight, terrainMeshes[0]],
      [TerrainTypes.Street_4Way, terrainMeshes[1]],
    ]);
  });

  const terrainClonesParent = new TransformNode("Terrain pieces", scene);

  // Create a simple factory for the grass tile
  var grassMaterial = new StandardMaterial("grass material", scene);
  grassMaterial.diffuseColor = new Color3(0.25, 0.75, 0.25);
  var grassTile = MeshBuilder.CreateBox("box", {}, scene);
  grassTile.material = grassMaterial;
  grassTile.scaling.set(4, 1, 4);
  grassTile.setEnabled(false);

  function instantiateGrass(x: number, y: number) {
    const clone = grassTile.clone(`${x} ${y} grass`, terrainClonesParent);

    if (clone) {
      clone.position = positionToVector3({ x, y }, -0.5).add(GridMidpoint);
      clone.setEnabled(true);
      return clone;
    } else {
      return null;
    }
  }

  // Return a method that is asynchronous under the hood, but presents as
  // a standard method that returns a mini API to dispose the mesh

  return function instantiateTerrain(
    terrainType: TerrainTypes,
    x: number,
    y: number,
    facing: Facings
  ) {
    var disposed = false;
    var cloneRoot: TransformNode | null = null;

    if (terrainType === TerrainTypes.Grass) {
      cloneRoot = instantiateGrass(x, y);
    } else {
      assetsPromise.then((meshesByTerrainType) => {
        if (disposed) {
          return;
        }

        const terrainMesh = meshesByTerrainType.get(terrainType);
        if (!terrainMesh) {
          console.warn(
            "meshesByTerrainType didn't have a mesh for terrain type.",
            { terrainType }
          );
          return;
        }

        cloneRoot =
          terrainMesh.loadedContainer.instantiateModelsToScene().rootNodes[0];
        cloneRoot.parent = terrainClonesParent;
        cloneRoot.name = `${x} ${y} terrain`;

        cloneRoot.position = positionToVector3({ x, y }, -0.3).add(
          GridMidpoint
        );
        cloneRoot.rotation = FacingsToRotation[facing];
      });
    }

    function dispose() {
      disposed = true;
      cloneRoot?.dispose();
      cloneRoot = null;
    }

    return {
      dispose,
    };
  };
}
