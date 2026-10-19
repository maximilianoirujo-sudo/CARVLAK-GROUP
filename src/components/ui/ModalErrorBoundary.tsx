import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ModalErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  onClose?: () => void;
}

interface ModalErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * ErrorBoundary especializado para modales de formulario.
 * Si ocurre un error de render o de ejecución, muestra un cartel rojo con el detalle
 * ("Ocurrió un error: ...") en lugar de desmontar y cerrar el modal sin aviso.
 */
export class ModalErrorBoundary extends Component<ModalErrorBoundaryProps, ModalErrorBoundaryState> {
  public state: ModalErrorBoundaryState = {
    hasError: false,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): ModalErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || String(error || 'Error inesperado en el formulario')
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ModalErrorBoundary] Error capturado en modal:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-[#D7141A] rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D7141A] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#D7141A]">
                  Ocurrió un error: {this.state.errorMessage}
                </h3>
                <p className="text-xs text-[#6B6B6B] mt-1">
                  El formulario se mantuvo abierto y tus datos están resguardados en el borrador automático.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E3]">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-xl bg-[#D7141A] hover:bg-[#b01015] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Continuar editando</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
