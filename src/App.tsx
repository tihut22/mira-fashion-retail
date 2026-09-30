import React from 'react';
import { RetailProvider, useRetail } from './context/RetailContext';
import { TopBar } from './components/navigation/TopBar';
import { StorefrontHome } from './components/storefront/StorefrontHome';
import { AdminPortal } from './components/admin/AdminPortal';
import { TelegramMiniApp } from './components/telegram/TelegramMiniApp';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { TelegramOrderModal } from './components/storefront/TelegramOrderModal';
import { CartDrawer } from './components/storefront/CartDrawer';
import { CheckoutModal } from './components/storefront/CheckoutModal';
import { OrderConfirmationModal } from './components/storefront/OrderConfirmationModal';
import { CustomerAccountModal } from './components/storefront/CustomerAccountModal';
import { AuthModal } from './components/common/AuthModal';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center p-6 text-center">
          <div className="bg-stone-800 p-8 rounded-2xl max-w-md w-full border border-stone-700 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold font-serif">Application Render Recovery</h2>
            <p className="text-xs text-stone-300 leading-relaxed font-mono bg-stone-900 p-3 rounded-lg text-left overflow-x-auto">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = window.location.pathname + '?view=admin';
                }}
                className="px-4 py-2.5 bg-stone-100 text-stone-900 rounded-xl text-xs font-bold hover:bg-white transition-colors cursor-pointer"
              >
                Open Admin Portal (?view=admin)
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = window.location.pathname + '?view=storefront';
                }}
                className="px-4 py-2.5 bg-amber-500 text-stone-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                Open Storefront Catalog (?view=storefront)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { activeView } = useRetail();

  if (activeView === 'telegram') {
    return <TelegramMiniApp />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Universal Top Bar with View Switcher */}
      <TopBar />

      {/* Main View: Customer Storefront or Admin Portal */}
      {activeView === 'storefront' ? <StorefrontHome /> : <AdminPortal />}

      {/* Shared Modals and Drawers */}
      <ProductDetailModal />
      <TelegramOrderModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderConfirmationModal />
      <CustomerAccountModal />
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <RetailProvider>
        <AppContent />
      </RetailProvider>
    </ErrorBoundary>
  );
}

export default App;
