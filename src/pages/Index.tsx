
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import ConversationList from "@/components/ConversationList";
import ChatArea from "@/components/ChatArea";
import UserMenu from "@/components/UserMenu";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (!data.session) {
        // Redirect to auth page if not authenticated
        navigate('/auth');
        toast({
          title: "Authentication required",
          description: "Please sign in to view your messages",
        });
      } else {
        setAuthenticated(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return null; // This will never render because we navigate away
  }

  return (
    <>
      {/* Mobile Layout */}
      <MobileLayout />
      
      {/* Desktop Layout */}
      <div className="h-screen flex flex-col hidden sm:flex">
        <header className="bg-primary p-4 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-white">Echo Messenger</h1>
        </header>
        
        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 md:w-96 border-r flex flex-col">
            <ConversationList 
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
            />
            <Separator />
            <UserMenu />
          </div>
          
          {/* Chat area */}
          <div className="flex-1">
            <ChatArea conversationId={selectedConversationId} />
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;
