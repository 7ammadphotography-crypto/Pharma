import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
                    <div className="max-w-md w-full glass-card p-8 rounded-2xl border border-red-500/20 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-slate-400 mb-6">
                            We encountered an unexpected error. Our team has been notified.
                        </p>

                        <div className="bg-red-950/30 p-4 rounded-lg mb-6 text-left overflow-auto max-h-32">
                            <code className="text-red-400 text-xs font-mono">
                                {this.state.error?.toString()}
                            </code>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={this.handleReload}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reload Page
                            </Button>

                            <Button
                                onClick={this.handleReset}
                                variant="outline"
                                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Go to Home
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
