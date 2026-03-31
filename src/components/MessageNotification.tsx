import { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MessageNotif {
  id: string;
  senderName: string;
  content: string;
  senderAvatar?: string;
  senderId: number;
}

interface MessageNotificationProps {
  messages: MessageNotif[];
  onDismiss: (id: string) => void;
  onOpen: (senderId: number) => void;
}

export default function MessageNotification({ messages, onDismiss, onOpen }: MessageNotificationProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-96 max-w-[calc(100vw-32px)] bg-card border border-border rounded-2xl shadow-2xl p-4 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 overflow-hidden">
                {msg.senderAvatar ? (
                  <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-card-foreground text-sm truncate">{msg.senderName}</h4>
                  <button
                    onClick={() => onDismiss(msg.id)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{msg.content}</p>

                {/* Action Button */}
                <button
                  onClick={() => {
                    onOpen(msg.senderId);
                    onDismiss(msg.id);
                  }}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3 h-3" />
                  Reply
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
