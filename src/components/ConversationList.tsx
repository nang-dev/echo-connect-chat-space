
import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; 
import { Search, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";

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
  const [friendEmail, setFriendEmail] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  // Fetch current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser({ id: data.user.id });
      }
    };
    
    getCurrentUser();
  }, []);

  // Fetch users and conversations
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      try {
        // Fetch all users except the current user
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser.id);

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
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });

        if (!messagesError && messages) {
          // Update conversations with last messages
          for (const conversation of formattedConversations) {
            const lastMessage = messages.find(
              msg => 
                (msg.sender_id === conversation.user_id && msg.receiver_id === currentUser.id) || 
                (msg.sender_id === currentUser.id && msg.receiver_id === conversation.user_id)
            );
            
            if (lastMessage) {
              conversation.lastMessage = lastMessage.content;
              conversation.time = new Date(lastMessage.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              
              // Count unread messages
              if (lastMessage.sender_id === conversation.user_id && lastMessage.receiver_id === currentUser.id) {
                conversation.unread = messages.filter(
                  msg => msg.sender_id === conversation.user_id && msg.receiver_id === currentUser.id
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
  }, [currentUser, toast]);

  // Subscribe to new messages
  useEffect(() => {
    if (!currentUser) return;
    
    const channel = supabase
      .channel('new-messages-list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id=eq.${currentUser.id},receiver_id=eq.${currentUser.id})`,
        },
        (payload) => {
          // Update the conversations when a new message is received
          const newMessage = payload.new as any;
          
          setConversations(prevConversations => {
            return prevConversations.map(conv => {
              const isForThisConversation = 
                (newMessage.sender_id === conv.user_id && newMessage.receiver_id === currentUser.id) ||
                (newMessage.sender_id === currentUser.id && newMessage.receiver_id === conv.user_id);
              
              if (isForThisConversation) {
                return {
                  ...conv,
                  lastMessage: newMessage.content,
                  time: new Date(newMessage.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  }),
                  unread: newMessage.sender_id === conv.user_id ? (conv.unread + 1) : conv.unread
                };
              }
              return conv;
            });
          });
        }
      )
      .subscribe();

    // Also subscribe to new users
    const usersChannel = supabase
      .channel('new-users')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'users',
        },
        () => {
          // Refresh the user list when a new user is added
          if (currentUser) {
            fetchUsers();
          }
        }
      )
      .subscribe();

    const fetchUsers = async () => {
      if (!currentUser) return;
      
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser.id);

        if (error) throw error;

        // Update only the user list, not the message data
        const newUsers = users.filter(user => 
          !conversations.some(conv => conv.user_id === user.id)
        );

        if (newUsers.length > 0) {
          const newConversations = newUsers.map(user => ({
            id: user.id,
            user_id: user.id,
            name: user.name || user.email,
            avatar: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random`,
            lastMessage: "No messages yet",
            time: "Now",
            unread: 0,
            isOnline: Math.random() > 0.5
          }));

          setConversations(prev => [...prev, ...newConversations]);
        }
      } catch (error) {
        console.error('Error fetching new users:', error);
      }
    };

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(usersChannel);
    };
  }, [currentUser, conversations, toast]);

  // Add friend function
  const handleAddFriend = async () => {
    if (!friendEmail || !currentUser) return;
    
    setAddingFriend(true);
    try {
      // Check if the user exists
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', friendEmail.trim())
        .limit(1);

      if (error) throw error;
      
      if (!users || users.length === 0) {
        toast({
          title: "User not found",
          description: "No user with that email address exists",
          variant: "destructive",
        });
        return;
      }

      const friendId = users[0].id;
      
      // Check if you're trying to add yourself
      if (friendId === currentUser.id) {
        toast({
          title: "Cannot add yourself",
          description: "You cannot add yourself as a friend",
          variant: "destructive",
        });
        return;
      }

      // Check if already friends
      const { data: existingFriends, error: friendCheckError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('friend_id', friendId)
        .limit(1);

      if (friendCheckError) throw friendCheckError;
      
      if (existingFriends && existingFriends.length > 0) {
        toast({
          title: "Already added",
          description: "This user is already in your friend list",
          variant: "default",
        });
        setShowAddFriendDialog(false);
        setFriendEmail("");
        return;
      }

      // Add friend relationship (both ways for simplicity)
      const { error: addError } = await supabase
        .from('friends')
        .insert([
          { user_id: currentUser.id, friend_id: friendId },
          { user_id: friendId, friend_id: currentUser.id }
        ]);

      if (addError) throw addError;

      toast({
        title: "Friend added",
        description: "User has been added to your friends",
      });
      
      setShowAddFriendDialog(false);
      setFriendEmail("");
      
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error adding friend",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setAddingFriend(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => 
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 flex justify-between items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search messages"
            className="pl-9 bg-secondary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={showAddFriendDialog} onOpenChange={setShowAddFriendDialog}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-2">
              <UserPlus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>
                Enter the email address of the user you want to add as a friend.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="friend@example.com"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddFriend} 
                disabled={addingFriend || !friendEmail.trim()}
              >
                {addingFriend ? "Adding..." : "Add Friend"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
