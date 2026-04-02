const mockWithUniwind = jest.fn();
const wrappedEaseView = jest.fn();

mockWithUniwind.mockReturnValue(wrappedEaseView);

jest.mock(
  'uniwind',
  () => ({
    withUniwind: mockWithUniwind,
  }),
  { virtual: true },
);

// Import after mock is set up
import { EaseView as BaseEaseView } from '../EaseView';

describe('uniwind entry point', () => {
  it('wraps EaseView with withUniwind and re-exports the wrapped component', () => {
    const entry = require('../uniwind');

    expect(mockWithUniwind).toHaveBeenCalledTimes(1);
    expect(mockWithUniwind).toHaveBeenCalledWith(BaseEaseView);
    expect(entry.EaseView).toBe(wrappedEaseView);
  });
});
