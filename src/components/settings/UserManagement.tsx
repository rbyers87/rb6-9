import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { UserInviteForm } from './UserInviteForm';
import { UserList } from './UserList';

export function UserManagement() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">User Management</h2>
      <div className="space-y-6">
        <UserInviteForm />
        <UserList />
      </div>
    </div>
  );
}
