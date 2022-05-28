import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { ICameraInput } from "@babylonjs/core/Cameras/cameraInputsManager";
import type { Nullable } from "@babylonjs/core/types";
import type { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import {
  EventState,
  Observable,
  Observer,
} from "@babylonjs/core/Misc/observable";
import {
  PointerEventTypes,
  PointerInfo,
} from "@babylonjs/core/Events/pointerEvents";
import { Plane } from "@babylonjs/core/Maths/math.plane";
import { PickingInfo } from "@babylonjs/core/Collisions/pickingInfo";

export class PanCameraInput implements ICameraInput<FreeCamera> {
  private plane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());

  camera: Nullable<FreeCamera> = null;
  private pointerEventObserver: Nullable<Observer<PointerInfo>> = null;
  private dragStart: Vector2 | null = null;
  private dragCurrent: Vector2 | null = null;
  private dragLength = 0;

  public maximumDragLengthForClick = 0.5;
  public readonly clickObservable = new Observable<PickingInfo>();

  /** Returns true if the mouse popinter is down. Note that dragging may not have actually started yet. */
  public get isPointerDown() {
    return this.dragStart !== null;
  }

  /** Returns true if a drag has started, i.e., it has exceeded maximumDragLengthForClick. */
  public get isDragging() {
    return (
      this.isPointerDown && this.dragLength > this.maximumDragLengthForClick
    );
  }

  getClassName(): string {
    return PanCameraInput.name;
  }

  getSimpleName(): string {
    return "pan";
  }

  private getThings() {
    if (!this.camera) {
      throw new Error("this.camera is null.");
    }
    var engine = this.camera.getEngine();
    var element = engine.getInputElement();
    if (!element) {
      throw new Error("engine.getInputElement() returned null.");
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

    this.pointerEventObserver = scene.onPointerObservable.add(
      this.onPointerEvent.bind(this)
    );
  }

  private onPointerEvent(eventData: PointerInfo, state: EventState) {
    const { x, y } = eventData.event;

    switch (eventData.type) {
      case PointerEventTypes.POINTERDOWN:
        this.dragStart = new Vector2(x, y);
        this.dragLength = 0;
        break;
      case PointerEventTypes.POINTERMOVE:
        this.dragCurrent = new Vector2(x, y);
        break;
      case PointerEventTypes.POINTERUP:
        if (
          eventData.pickInfo &&
          this.dragLength <= this.maximumDragLengthForClick
        ) {
          this.clickObservable.notifyObservers(eventData.pickInfo);
        }
        this.dragStart = null;
        break;
    }
  }

  detachControl(): void {
    const { scene } = this.getThings();

    scene.onPointerObservable.remove(this.pointerEventObserver);
  }

  checkInputs() {
    if (!this.camera || !this.dragStart || !this.dragCurrent) {
      return;
    }

    const draggedFrom = this.getPlaneHitFromMouseXY(this.dragStart);
    const draggedTo = this.getPlaneHitFromMouseXY(this.dragCurrent);

    if (!draggedFrom || !draggedTo) {
      return;
    }

    const diff = draggedTo.subtract(draggedFrom);
    this.camera?.position.subtractInPlace(diff);

    this.dragStart = this.dragCurrent;
    this.dragCurrent = null;
    this.dragLength += diff.length();
  }

  getPlaneHitFromMouseXY(mouseXY: Vector2): Vector3 | null {
    const ray = this.camera
      ?.getScene()
      .createPickingRay(mouseXY.x, mouseXY.y, Matrix.Identity(), this.camera);

    if (!ray) {
      return null;
    }

    const hit = ray.intersectsPlane(this.plane);
    if (!hit) {
      return null;
    }

    return ray.origin.add(ray.direction.scale(hit));
  }
}
