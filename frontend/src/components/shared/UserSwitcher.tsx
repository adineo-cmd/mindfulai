import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

const USERS = [
  { id: 1, name: 'Aditya' },
  { id: 2, name: 'Friend 1' },
  { id: 3, name: 'Friend 2' },
  { id: 4, name: 'Friend 3' },
];

export default function UserSwitcher() {
  const [currentUserId, setCurrentUserId] = useState('1');

  useEffect(() => {
    // Load saved user on mount
    const saved = localStorage.getItem('current_user_id') || '1';
    setCurrentUserId(saved);
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setCurrentUserId(newId);
    localStorage.setItem('current_user_id', newId);
    // Reload the page to refresh all charts with new data
    window.location.reload(); 
  };

  return (
    <div className="flex items-center gap-2 bg-bg2 border border-[rgba(255,200,120,0.10)] rounded-lg px-3 py-1.5">
      <Users className="h-4 w-4 text-amber" />
      <select 
        value={currentUserId} 
        onChange={handleUserChange}
        className="bg-transparent text-sm text-cream outline-none cursor-pointer"
      >
        {USERS.map(user => (
          <option key={user.id} value={user.id} className="bg-bg2 text-cream">
            {user.name}
          </option>
        ))}
      </select>
    </div>
  );
}