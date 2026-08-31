import { Component, type ErrorInfo, type ReactNode } from "react";
import { report } from "../utils/report";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    report("error", "render_failed", error);
    report("error", "render_failed_component", info.componentStack ?? "");
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
