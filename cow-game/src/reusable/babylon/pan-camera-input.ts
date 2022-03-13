import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { ICameraInput } from '@babylonjs/core/Cameras/cameraInputsManager';
import type { Nullable } from '@babylonjs/core/types';
import type { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import type { EventState, Observer } from '@babylonjs/core/Misc/observable';
import {
  PointerEventTypes,
  PointerInfo,
} from '@babylonjs/core/Events/pointerEvents';
import { Plane } from '@babylonjs/core/Maths/math.plane';

export class PanCameraInput implements ICameraInput<FreeCamera> {
  private plane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());

  camera: Nullable<FreeCamera> = null;
  private pointerEventObservable: Nullable<Observer<PointerInfo>> = null;
  private dragStart: Vector3 | null = null;
  private dragCurrent: Vector3 | null = null;

  getClassName(): string {
    return PanCameraInput.name;
  }

  getSimpleName(): string {
    return 'pan';
  }

  private getThings() {
    if (!this.camera) {
      throw new Error('this.camera is null.');
    }
    var engine = this.camera.getEngine();
    var element = engine.getInputElement();
    if (!element) {
      throw new Error('engine.getInputElement() returned null.');
    }
    return {
      camera: this.camera,
      engine,
      element,
      scene: this.camera.getScene(),
    };
  }

  attachControl(noPreventDefault?: boolean): void {
    const { scene } = this.getThings();

    this.pointerEventObservable = scene.onPointerObservable.add(
      this.onPointerEvent.bind(this),
    );
  }

  private onPointerEvent(eventData: PointerInfo, state: EventState) {
    const ray = eventData.pickInfo?.ray;
    if (!ray) {
      return;
    }
    const hit = ray.intersectsPlane(this.plane);
    if (hit === null) {
      return;
    }

    const hitPosition = ray.origin.add(ray.direction.scale(hit));

    switch (eventData.type) {
      case PointerEventTypes.POINTERDOWN:
        this.dragStart = hitPosition;
        break;
      case PointerEventTypes.POINTERMOVE:
        this.dragCurrent = hitPosition;
        break;
      case PointerEventTypes.POINTERUP:
        this.dragStart = null;
        break;
    }
  }

  detachControl(): void {
    const { scene } = this.getThings();

    scene.onPointerObservable.remove(this.pointerEventObservable);
  }

  checkInputs() {
    if (!this.camera || !this.dragStart || !this.dragCurrent) {
      return;
    }

    const diff = this.dragCurrent.subtract(this.dragStart);
    this.camera?.position.subtractInPlace(diff);
    this.dragCurrent = null;
  }
}
