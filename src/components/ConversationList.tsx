
import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  user_id: string;
}

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId: string | null;
}

const ConversationList = ({ 
  onSelectConversation, 
  selectedConversationId 
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch users from supabase to show as conversations
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) return;

        // Fetch all users except the current user
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser.user.id);

        if (error) throw error;

        // Convert users to conversations format
        const formattedConversations: Conversation[] = users.map(user => ({
          id: user.id,
          user_id: user.id,
          name: user.name || user.email,
          avatar: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`,
          lastMessage: "No messages yet",
          time: "Now",
          unread: 0,
          isOnline: Math.random() > 0.5 // Randomly set online status for now
        }));

        // Get last messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${currentUser.user.id},receiver_id.eq.${currentUser.user.id}`)
          .order('created_at', { ascending: false });

        if (!messagesError && messages) {
          // Update conversations with last messages
          for (const conversation of formattedConversations) {
            const lastMessage = messages.find(
              msg => 
                (msg.sender_id === conversation.user_id && msg.receiver_id === currentUser.user.id) || 
                (msg.sender_id === currentUser.user.id && msg.receiver_id === conversation.user_id)
            );
            
            if (lastMessage) {
              conversation.lastMessage = lastMessage.content;
              conversation.time = new Date(lastMessage.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              
              // Count unread messages
              if (lastMessage.sender_id === conversation.user_id && lastMessage.receiver_id === currentUser.user.id) {
                conversation.unread = messages.filter(
                  msg => msg.sender_id === conversation.user_id && msg.receiver_id === currentUser.user.id
                ).length;
              }
            }
          }
        }

        setConversations(formattedConversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          title: "Error loading conversations",
          description: "Please refresh and try again",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  const filteredConversations = conversations.filter(conversation => 
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search messages"
            className="pl-9 bg-secondary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No conversations match your search" : "No conversations found"}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors ${
                selectedConversationId === conversation.id ? "bg-secondary" : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <img 
                    src={conversation.avatar} 
                    alt={conversation.name} 
                    className="object-cover"
                  />
                </Avatar>
                {conversation.isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium truncate">{conversation.name}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {conversation.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage}
                </p>
              </div>
              
              {conversation.unread > 0 && (
                <div className="ml-2 bg-primary text-primary-foreground h-5 min-w-5 rounded-full flex items-center justify-center text-xs font-medium">
                  {conversation.unread}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
