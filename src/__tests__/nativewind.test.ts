const mockCssInterop = jest.fn();

jest.mock(
  'nativewind',
  () => ({
    cssInterop: mockCssInterop,
  }),
  { virtual: true },
);

// Import after mock is set up
import { EaseView } from '../EaseView';

describe('nativewind entry point', () => {
  it('calls cssInterop with EaseView and className → style mapping', () => {
    require('../nativewind');

    expect(mockCssInterop).toHaveBeenCalledTimes(1);
    expect(mockCssInterop).toHaveBeenCalledWith(EaseView, {
      className: 'style',
    });
  });
});
