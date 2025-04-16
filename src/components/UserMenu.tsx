
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, LogIn, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import FriendManager from "./FriendManager";

const UserMenu = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === "SIGNED_IN") {
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
          });
        } else if (event === "SIGNED_OUT") {
          toast({
            title: "Signed out",
            description: "You have been signed out successfully",
          });
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      // Clean up the listener on unmount
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-3 border-t flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-3 border-t flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Not signed in</p>
        <Button variant="default" size="sm" onClick={() => navigate("/auth")}>
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 border-t flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <img 
            src={user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100"} 
            alt={user.user_metadata?.full_name || user.email} 
            className="object-cover" 
          />
        </Avatar>
        <div>
          <h3 className="font-medium text-sm">{user.user_metadata?.full_name || user.email}</h3>
          <p className="text-xs text-green-600 font-medium">Active</p>
        </div>
      </div>
      
      <div className="flex">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MessageSquare className="h-5 w-5" />
        </Button>
        <FriendManager />
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default UserMenu;
