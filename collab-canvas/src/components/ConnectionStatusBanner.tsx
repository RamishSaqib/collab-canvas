import { useConnectionStatus } from '../hooks/useConnectionStatus';
import './ConnectionStatusBanner.css';

/**
 * Connection Status Banner Component
 * Shows a persistent banner when the user is offline or reconnecting
 * Automatically hides when online
 */
export default function ConnectionStatusBanner() {
  const { status, isOnline } = useConnectionStatus();

  // Don't render anything when online
  if (isOnline) {
    return null;
  }

  const getMessage = () => {
    switch (status) {
      case 'offline':
        return {
          icon: '🔌',
          text: 'You are offline. Changes will be saved when you reconnect.',
          className: 'offline'
        };
      case 'reconnecting':
        return {
          icon: '🔄',
          text: 'Reconnecting...',
          className: 'reconnecting'
        };
      default:
        return {
          icon: '✅',
          text: 'Connected',
          className: 'online'
        };
    }
  };

  const { icon, text, className } = getMessage();

  return (
    <div className={`connection-status-banner ${className}`} role="alert">
      <span className="banner-icon">{icon}</span>
      <span className="banner-text">{text}</span>
    </div>
  );
}

