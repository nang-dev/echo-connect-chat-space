
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, LogIn, MessageSquare, Users } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const UserMenu = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for active session on component mount
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session:", error);
        } else if (data?.session) {
          // Get user details if session exists
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData.user);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData.user);
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
          });
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          toast({
            title: "Signed out",
            description: "You have been signed out successfully",
          });
        }
      }
    );

    return () => {
      // Clean up the listener on unmount
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
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
        <Button variant="default" size="sm" onClick={() => window.location.href = "/auth"}>
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
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Users className="h-5 w-5" />
        </Button>
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
