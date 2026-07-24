import { cn } from '../../lib/utils';

type SpinnerSize = 'md' | 'lg';

const sizeClasses: Record<SpinnerSize, string> = {
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

/** Brand loading spinner (black ring with a transparent top). */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        sizeClasses[size],
        'border-4 border-black border-t-transparent rounded-full animate-spin',
        className,
      )}
    />
  );
}

interface LoadingScreenProps {
  size?: SpinnerSize;
  className?: string;
  spinnerClassName?: string;
}

/** Centered spinner inside a flex container, used for page/section loading states. */
export function LoadingScreen({
  size = 'lg',
  className,
  spinnerClassName,
}: LoadingScreenProps) {
  return (
    <div className={cn('w-full flex items-center justify-center', className)}>
      <Spinner size={size} className={spinnerClassName} />
    </div>
  );
}
