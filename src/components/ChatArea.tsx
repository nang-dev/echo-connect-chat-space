
import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Paperclip, Send, Phone, Video, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface ChatAreaProps {
  conversationId: string | null;
}

const ChatArea = ({ conversationId }: ChatAreaProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        // Get more user details from the users table
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (!error && userData) {
          setCurrentUser(userData);
        } else {
          setCurrentUser({
            id: data.user.id,
            name: data.user.user_metadata?.full_name,
            email: data.user.email || '',
            image: data.user.user_metadata?.avatar_url
          });
        }
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch target user & messages when conversation changes
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get target user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (userError) throw userError;
        setTargetUser(userData);

        // Get messages between current user and target user
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${conversationId}),and(sender_id.eq.${conversationId},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        toast({
          title: "Error loading conversation",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId, currentUser, toast]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    // Set up real-time subscription to messages
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id=eq.${currentUser.id},receiver_id=eq.${conversationId}),and(sender_id=eq.${conversationId},receiver_id=eq.${currentUser.id}))`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUser) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: currentUser.id,
          receiver_id: conversationId,
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-muted-foreground">
        Loading conversation...
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-muted-foreground">
        User not found
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <img 
              src={targetUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name || targetUser.email)}`} 
              alt={targetUser.name || targetUser.email} 
              className="object-cover" 
            />
          </Avatar>
          <div>
            <h3 className="font-medium">{targetUser.name || targetUser.email}</h3>
            <p className="text-xs text-muted-foreground">
              Active now
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No messages yet. Send a message to start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isSent = message.sender_id === currentUser?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  {!isSent && (
                    <Avatar className="h-8 w-8 mr-2 self-end">
                      <img 
                        src={targetUser.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name || targetUser.email)}`} 
                        alt={targetUser.name || targetUser.email} 
                        className="object-cover" 
                      />
                    </Avatar>
                  )}
                  <div className="flex flex-col">
                    <div className={isSent ? "message-sent" : "message-received"}>
                      {message.content}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 px-2">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="p-3 border-t flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          className="flex-1"
        />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          size="icon"
          className="bg-primary text-primary-foreground"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default ChatArea;
