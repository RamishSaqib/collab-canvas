import { usePresence } from '../../hooks/usePresence';
import type { User } from '../../lib/types';
import './Sidebar.css';

interface SidebarProps {
  currentUser: User;
}

/**
 * Sidebar component showing online users
 */
export default function Sidebar({ currentUser }: SidebarProps) {
  const { onlineUsers } = usePresence({
    userId: currentUser.id,
    userName: currentUser.name,
    userColor: currentUser.color,
  });

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Online Users</h3>
        <span className="user-count">{onlineUsers.length}</span>
      </div>

      <div className="sidebar-content">
        {onlineUsers.length === 0 ? (
          <div className="empty-state">
            <p>No other users online</p>
          </div>
        ) : (
          <ul className="user-list">
            {onlineUsers.map((user) => {
              const isCurrentUser = user.userId === currentUser.id;
              
              return (
                <li key={user.userId} className="user-item">
                  <div 
                    className="user-indicator" 
                    style={{ backgroundColor: user.color }}
                    title={user.color}
                  />
                  <span className="user-name">
                    {user.userName}
                    {isCurrentUser && <span className="you-label"> (You)</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

