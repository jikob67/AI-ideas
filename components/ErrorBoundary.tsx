import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// @ts-ignore
export class ErrorBoundary extends React.Component<Props, State> {
  // @ts-ignore
  public props: Props;
  // @ts-ignore
  public state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.componentName || 'Component'}:`, error, errorInfo);
  }

  private handleReset = () => {
    // @ts-ignore
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-slate-900/60 border border-red-500/30 rounded-xl text-center max-w-xl mx-auto my-8">
          <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-400 mb-2 font-sans">عذرًا، حدث خطأ غير متوقع</h3>
          <p className="text-sm text-slate-400 mb-4 Arabic-rtl leading-relaxed">
            واجه المكون "{this.props.componentName || 'عنصر واجهة المستخدم'}" مشكلة أثناء التشغيل. تم عزل هذا الخطأ بأمان للحفاظ على استقرار التطبيق.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-medium rounded-lg shadow-sm font-sans"
              id="error-boundary-retry-btn"
            >
              إعادة تحميل المكون
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 text-sm font-medium rounded-lg font-sans"
              id="error-boundary-reload-page-btn"
            >
              تحديث الصفحة بأكملها
            </button>
          </div>
          {this.state.error && (
            <div className="mt-4 p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-left text-xs font-mono text-red-300 overflow-x-auto max-h-40">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
