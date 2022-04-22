import type { Scene } from "@babylonjs/core/scene";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";

import { Disposer } from "../reusable/disposable";
import type { GameController } from "../cow-game-domain/cow-game-controller";
import { positionToVector3 } from "./babylon-helpers";
import { CowGameAssetsManager, HOUSE_SCALE } from "./assets-manager";

export function createHouseRenderer(
  scene: Scene,
  gameController: GameController,
  assetsManager: CowGameAssetsManager
) {
  const disposers: Disposer[] = [];

  console.log("Loading house stuff...");

  Promise.all(
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

    // TODO: look into some optimisations for the environment meshes
    // General discussion here:
    //  https://www.html5gamedevs.com/topic/37664-load-mesh-without-rendering-it-then-adding-it-to-the-world-many-times/
    // Mesh merging:
    //  https://doc.babylonjs.com/divingDeeper/mesh/mergeMeshes
    // Instancing:
    //  https://doc.babylonjs.com/divingDeeper/mesh/copies/instances
    // Thin instancing:
    //  https://doc.babylonjs.com/divingDeeper/mesh/copies/thinInstances

    // TODO: spawn the houses according to the game model

    const houseClonesParent = new TransformNode("Houses", scene);

    // Create a pool of each mesh-meterial combination
    const housePool = houseAssets.flatMap((houseAsset) =>
      houseMaterials.map((houseMaterial) => ({ houseAsset, houseMaterial }))
    );

    // North side of the street
    for (var x = -5; x < 5; x++) {
      // Pick a random mesh-material comination and remove it from the pool
      var { houseAsset, houseMaterial } = housePool.splice(
        Math.trunc(Math.random() * housePool.length),
        1
      )[0];

      const clone =
        houseAsset.loadedContainer.instantiateModelsToScene().rootNodes[0];
      clone.name = `House North clone ${x}`;
      clone.parent = houseClonesParent;

      clone.position = positionToVector3({ x, y: 1 });

      clone.getChildMeshes().forEach((mesh) => (mesh.material = houseMaterial));

      disposers.push(() => clone.dispose());
    }

    // South side of the street
    for (var x = -5; x < 5; x++) {
      // Pick a random mesh-material comination and remove it from the pool
      var { houseAsset, houseMaterial } = housePool.splice(
        Math.trunc(Math.random() * housePool.length),
        1
      )[0];

      const clone =
        houseAsset.loadedContainer.instantiateModelsToScene().rootNodes[0];
      clone.name = `House South clone ${x}`;
      clone.parent = houseClonesParent;

      clone.position = positionToVector3({ x, y: -1 });
      clone.addRotation(0, Math.PI, 0);

      clone.getChildMeshes().forEach((mesh) => (mesh.material = houseMaterial));

      disposers.push(() => clone.dispose());
    }
  });

  function dispose() {
    disposers.forEach((d) => d());
  }

  return {
    dispose,
  };
}
