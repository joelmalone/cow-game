import { h, render, ComponentChildren } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";

import './modal.css'

interface IProps {
  hidden: boolean;
  children: ComponentChildren;
}

export function Modal({ hidden, children }: IProps) {
  return (
    <div class="modal" hidden={hidden}>
      <span class="modal-close">&times;</span>
      <div class="modal-content">{children}</div>
    </div>
  );
}
