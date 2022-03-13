import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

import BabylonEngine, { IProps } from './BabylonEngine';

/**
 * A substitute for `<BabylonEngine>` that will repeatedly 
 * mount and unmount the component forever, so we can test 
 * disposal.
 *
 * @export
 * @param {IProps} { engineFactory }
 * @return {*} 
 */
export function BlinkingBabylonEngine({ engineFactory }: IProps) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCount(count + 1), 1000);
    return () => clearTimeout(timer);
  }, [count, setCount]);

  return count % 2 === 0 ? (
    <BabylonEngine engineFactory={engineFactory} />
  ) : (
    <p>The engine is hidden and will be disposed.</p>
  );
}
