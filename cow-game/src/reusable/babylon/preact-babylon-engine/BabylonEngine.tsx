import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import type { Engine } from '@babylonjs/core/Engines/engine';

import './BabylonEngine.css';

export interface DisposableEngine {
  readonly engine: Engine;
  readonly dispose: () => void;
}

export interface IProps {
  readonly engineFactory: (
    canvas: HTMLCanvasElement,
  ) => Promise<DisposableEngine>;
}

function BabylonEngine({ engineFactory }: IProps) {
  // https://preactjs.com/guide/v10/refs/
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine is a product (memo?) of props.onEngineInstantiated and canvasRef
  // TODO: would it be better to use context instead of onEngineInstantiated?
  const [disposableEngine, setDisposableEngine] =
    useState<DisposableEngine | null>(null);
  useEffect(() => {
    if (!canvasRef.current) {
      throw new Error(
        'Unable to create the Babylong engine because canvasRef is null.',
      );
    }

    console.debug(
      'useEffect() is creating a new Babylon engine on element',
      canvasRef.current,
    );

    var cancelled = false;
    engineFactory(canvasRef.current).then((engine) => {
      if (!cancelled) {
        setDisposableEngine(engine);
      } else {
        console.debug('useEffect() is disposing a Babylon engine that never got to spread its wings.');
        engine.dispose();
      }
    });

    return () => {
      cancelled = true;
      setDisposableEngine((old) => {
        if (old) {
          console.debug('useEffect() is disposing the current Babylon engine.');
          old.dispose();
        }
        return null;
      });
    };
  }, [engineFactory, canvasRef]);

  useEffect(() => {
    function onResize() {
      if (disposableEngine && disposableEngine.engine) {
        console.debug('Window has been resized.');
        disposableEngine.engine.resize();
      } else {
        console.debug('Window has been resized but engine is null.');
      }
    }
    if (disposableEngine && disposableEngine.engine) {
      console.debug('Attaching onResize listener.');
      window.addEventListener('resize', onResize);
    }
    return () => {
      if (disposableEngine && disposableEngine.engine) {
        console.debug('Detaching onResize listener.');
        window.removeEventListener('resize', onResize);
      }
    };
  }, [window, disposableEngine]);

  return <canvas ref={canvasRef}></canvas>;
}

export default BabylonEngine;
