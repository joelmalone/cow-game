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

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { positionToVector3 } from "./babylon-helpers";
import { CowGameAssetsManager, HOUSE_SCALE } from "./assets-manager";
import { Facings, HouseTypes, ICell } from "../cow-game-domain/cow-game-model";

export function createHouseRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  console.log("Loading house stuff...");

  const houseFactoryPromise = Promise.all(
    assetsManager.loadMeshes("house1", "house2", "house3", "house4", "house5")
  ).then(async (houseAssets) => {
    console.debug(`Loaded ${houseAssets.length} house assets.`, houseAssets);

    // Set the scale of the house assets so each house is ~3x3
    for (const houseAsset of houseAssets) {
      houseAsset.loadedMeshes[0].scaling.setAll(HOUSE_SCALE);
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

    const houseClonesParent = new TransformNode("Houses", scene);

    return function instantiateHouseFromHouseType(
      houseType: number,
      x: number,
      y: number,
      facing: Facings
    ) {
      if (HouseTypes !== 20) {
        console.error(
          "The renderer code expects exactly 25 house types so uhhhh."
        );
      }

      const houseAsset = houseAssets[houseType % 5];
      const houseMaterial = houseMaterials[Math.trunc(houseType / 5)];

      console.log(houseType % 5,{houseMaterial})

      const cloneRoot =
        houseAsset.loadedContainer.instantiateModelsToScene().rootNodes[0];
      cloneRoot.parent = houseClonesParent;
      cloneRoot.name = `House North clone ${x} ${y}`;

      cloneRoot.position = positionToVector3({ x, y });

      cloneRoot
        .getChildMeshes()
        .forEach((mesh) => (mesh.material = houseMaterial));

      function dispose() {
        cloneRoot.dispose();
      }

      return {
        dispose,
      };
    };
  });

  const unsubscribeEvents = gameController.subscribeEvents((ev) => {
    switch (ev.event.type) {
      case "INewGameStarted": {
        const { grid } = ev.event;

        for (var x = 0; x < grid.width; x++) {
          for (var y = 0; y < grid.height; y++) {
            const cell = grid.cells[x + y * grid.width];
            // Need to copy x and y because they're not scoped and won't be included in the closure
            const xyCopy = { x, y };

            houseFactoryPromise.then((houseFactory) => {
              const houseClone = houseFactory(
                cell.houseType,
                xyCopy.x,
                xyCopy.y,
                cell.houseFacing
              );
              disposers.push(() => houseClone.dispose());
            });
          }
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
