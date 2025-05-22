'use client';

import { useEffect } from 'react';
import Intercom from '@intercom/messenger-js-sdk';
import { useUser } from '../contexts/UserContext';

export default function IntercomInit() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      Intercom({
        app_id: 'aqhtwkc5',
        user_id: user.id,
        name: user.name,
        email: user.email,
        created_at: Math.floor(new Date(user.createdAt).getTime() / 1000)
      });
    }
    return () => Intercom('shutdown');
  }, [user]);

  return null;
} 