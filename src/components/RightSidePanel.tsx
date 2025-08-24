import React from 'react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import NotificationBell from '@/components/social/NotificationBell';

const RightSidePanel = () => {
  return (
    <div className="fixed right-4 bottom-32 z-50 flex flex-col items-center gap-4">
      <ChatWidget />
      <NotificationBell />
    </div>
  );
};

export default RightSidePanel;