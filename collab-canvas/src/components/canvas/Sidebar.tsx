import { memo } from 'react';
import { usePresence } from '../../hooks/usePresence';
import type { User, Presence } from '../../lib/types';
import './Sidebar.css';

interface SidebarProps {
  currentUser: User;
  projectId: string;
}

interface UserItemProps {
  user: Presence;
  isCurrentUser: boolean;
}

/**
 * Memoized user list item component
 */
const UserItem = memo(({ user, isCurrentUser }: UserItemProps) => (
  <li className="user-item">
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
));

UserItem.displayName = 'UserItem';

/**
 * Sidebar component showing online users
 * Optimized with memoization for better performance
 */
function Sidebar({ currentUser, projectId }: SidebarProps) {
  const { onlineUsers } = usePresence({
    projectId,
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
            {onlineUsers.map((user) => (
              <UserItem
                key={user.userId}
                user={user}
                isCurrentUser={user.userId === currentUser.id}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default memo(Sidebar);

