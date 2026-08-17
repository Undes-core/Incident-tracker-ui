import { Component, type ReactNode } from "react";

// The four-state switch every panel that owns a query renders through (Principle VII), wrapped
// in an error boundary so a render-time failure degrades this panel only (Principle VIII).

export interface PanelBoundaryProps<T> {
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  data: T | undefined;
  isEmpty: (data: T) => boolean;
  isFiltered?: boolean;
  emptyNoDataMessage: ReactNode;
  emptyFilteredMessage?: ReactNode;
  onClearFilters?: () => void;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}

function PanelError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert">
      <p>{message ?? "Something went wrong loading this panel."}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}

interface BoundaryState {
  caughtError: Error | null;
}

class RenderErrorBoundary extends Component<{ onRetry?: () => void; children: ReactNode }, BoundaryState> {
  state: BoundaryState = { caughtError: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { caughtError: error };
  }

  handleRetry = (): void => {
    this.setState({ caughtError: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.caughtError) {
      return <PanelError message={this.state.caughtError.message} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

export function PanelBoundary<T>({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  data,
  isEmpty,
  isFiltered = false,
  emptyNoDataMessage,
  emptyFilteredMessage,
  onClearFilters,
  skeleton,
  children,
}: PanelBoundaryProps<T>) {
  return (
    <RenderErrorBoundary onRetry={onRetry}>
      {isLoading && skeleton}
      {!isLoading && isError && <PanelError message={errorMessage} onRetry={onRetry} />}
      {!isLoading && !isError && data !== undefined && isEmpty(data) && !isFiltered && (
        <div>{emptyNoDataMessage}</div>
      )}
      {!isLoading && !isError && data !== undefined && isEmpty(data) && isFiltered && (
        <div>
          {emptyFilteredMessage}
          {onClearFilters && <button onClick={onClearFilters}>Clear filters</button>}
        </div>
      )}
      {!isLoading && !isError && data !== undefined && !isEmpty(data) && children(data)}
    </RenderErrorBoundary>
  );
}
