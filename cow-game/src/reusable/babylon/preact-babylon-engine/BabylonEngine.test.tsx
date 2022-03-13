import { h } from 'preact';
import { render } from '@testing-library/preact';
import { expect } from 'chai';
import BabylonEngine from './BabylonEngine';

describe('<App>', () => {
  it('renders learn react link', () => {
    function engineFactory() {
      return {
        engine: null as any,
        dispose: () => {},
      };
    }

    const renderResult = render(
      <BabylonEngine engineFactory={engineFactory} />,
    );
    // const linkElement = getByText(/learn preact/i);
    // expect(document.body.contains(linkElement));
  });
});
