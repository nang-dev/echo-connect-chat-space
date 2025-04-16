
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Users, UserMinus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Friend {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

const FriendManager = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser({ id: data.user.id });
      }
    };
    
    getCurrentUser();
  }, []);

  // Fetch friends when dialog opens
  useEffect(() => {
    if (open && currentUser) {
      fetchFriends();
    }
  }, [open, currentUser]);

  const fetchFriends = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Get friend IDs from the friends table
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', currentUser.id);

      if (friendsError) throw friendsError;
      
      if (!friendsData || friendsData.length === 0) {
        setFriends([]);
        return;
      }

      // Get user details for each friend
      const friendIds = friendsData.map(f => f.friend_id);
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', friendIds);

      if (usersError) throw usersError;
      
      setFriends(usersData || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast({
        title: "Error loading friends",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;
    
    try {
      // Remove both friend relationships
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`);

      if (error) throw error;
      
      // Update the friends list
      setFriends(friends.filter(friend => friend.id !== friendId));
      
      toast({
        title: "Friend removed",
        description: "User has been removed from your friends list",
      });
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error removing friend",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Friends</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center p-4">
              <p className="text-muted-foreground">Loading friends...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You haven't added any friends yet.</p>
              <p className="text-xs text-muted-foreground mt-2">
                Use the "Add Friend" button to connect with people.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <img 
                        src={friend.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || friend.email)}&background=random`} 
                        alt={friend.name || friend.email} 
                        className="object-cover" 
                      />
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{friend.name || friend.email}</p>
                      {friend.name && <p className="text-xs text-muted-foreground">{friend.email}</p>}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFriend(friend.id)}
                  >
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FriendManager;
