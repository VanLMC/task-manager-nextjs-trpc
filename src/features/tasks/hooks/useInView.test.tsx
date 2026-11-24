import { render } from '@testing-library/react';
import { useInView } from './useInView';

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observers: Array<{ callback: ObserverCallback; disconnect: ReturnType<typeof vi.fn> }> = [];

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect = vi.fn();
      constructor(callback: ObserverCallback) {
        observers.push({ callback, disconnect: this.disconnect });
      }
      observe() {}
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

function Sentinel({ onEnter, enabled }: { onEnter: () => void; enabled: boolean }) {
  const ref = useInView<HTMLDivElement>(onEnter, { enabled });
  return <div ref={ref} />;
}

describe('useInView', () => {
  it('calls onEnter only when the element becomes visible', () => {
    const onEnter = vi.fn();
    render(<Sentinel onEnter={onEnter} enabled />);

    observers[0]?.callback([{ isIntersecting: false }]);
    observers[0]?.callback([{ isIntersecting: true }]);

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it('does not observe while disabled and disconnects on unmount', () => {
    const { rerender, unmount } = render(<Sentinel onEnter={vi.fn()} enabled={false} />);
    expect(observers).toHaveLength(0);

    rerender(<Sentinel onEnter={vi.fn()} enabled />);
    unmount();

    expect(observers[0]?.disconnect).toHaveBeenCalled();
  });
});
