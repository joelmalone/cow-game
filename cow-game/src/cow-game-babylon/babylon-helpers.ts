import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Plane } from "@babylonjs/core/Maths/math.plane";
import { Node } from "@babylonjs/core/node";

import { IPosition, Tappable } from "../cow-game-domain/cow-game-model";

export const GroundPlane = Plane.FromPositionAndNormal(
  Vector3.Zero(),
  Vector3.Up()
);

export function vector3ToPosition(vector3: Vector3): IPosition {
  return {
    x: vector3.x,
    y: vector3.z,
  };
}

export function positionToVector3(position: IPosition): Vector3 {
  return new Vector3(position.x, 0, position.y);
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
