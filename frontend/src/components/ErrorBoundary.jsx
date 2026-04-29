import React from 'react';
import ErrorPage from '../pages/errors/ErrorPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage 
          code="500" 
          title="Algo salió mal" 
          message="Ha ocurrido un error inesperado en la aplicación. Por favor, intenta recargar la página."
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
