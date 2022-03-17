import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Plane } from "@babylonjs/core/Maths/math.plane";

export const GroundPlane = Plane.FromPositionAndNormal(
  Vector3.Zero(),
  Vector3.Up()
);
