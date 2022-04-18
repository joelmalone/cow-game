import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Plane } from "@babylonjs/core/Maths/math.plane";
import { Node } from "@babylonjs/core/node";

import { IPosition, Tappable } from "../cow-game-domain/cow-game-model";

/*

The "world" is an infinite grid with 0,0 being the origin and extending in all directions.

When mapped to the Babylon scene, the centre of grid tile 0,0 is at the centre of the scene.

World +x extends in the scene's +x direction.
World +y extends in the scene's +z direction.
World +z generally doesn't exist; the world is a flat 2d plane, however it is rendered in full 3d.

WorldScale is used to control the scaling.

Some example mappings, if WorldScale is 4:

0,0 maps to 0,0,0
0,1 maps to 0,0,4
-3,2 maps to -12,0,8

Take note of the world tiles being centred on their positions, e.g. the tile
at -1,2 has these bounds in the scene: (-6,6) -> (-2,10)

*/

/** @type {number} The scale of the world compared to IPosition values. */
export const WorldScale = 4;

export const GroundPlane = Plane.FromPositionAndNormal(
  Vector3.Zero(),
  Vector3.Up()
);

export function vector3ToPosition(vector3: Vector3): IPosition {
  return {
    x: vector3.x / WorldScale,
    y: vector3.z / WorldScale,
  };
}

export function positionToVector3(position: IPosition, y: number = 0): Vector3 {
  return new Vector3(position.x * WorldScale, y, position.y * WorldScale);
}

export interface Metadata {
  tappable?: Tappable;
}

export function getMetadata(node: Node | null) {
  return node?.metadata as Metadata;
}

export function setMetadata(node: Node, metadata: Metadata) {
  node.metadata = metadata;
}
