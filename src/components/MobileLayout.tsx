
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConversationList from "./ConversationList";
import ChatArea from "./ChatArea";
import UserMenu from "./UserMenu";
import { Separator } from "@/components/ui/separator";

const MobileLayout = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col sm:hidden">
      <header className="bg-primary p-4 flex items-center">
        {selectedConversationId ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white mr-2"
            onClick={() => setSelectedConversationId(null)}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        ) : null}
        <h1 className="text-2xl font-bold text-white">
          {selectedConversationId ? "Chat" : "Echo Messenger"}
        </h1>
      </header>
      
      <main className="flex-1 overflow-hidden">
        {selectedConversationId ? (
          <ChatArea conversationId={selectedConversationId} />
        ) : (
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <ConversationList
                onSelectConversation={setSelectedConversationId}
                selectedConversationId={selectedConversationId}
              />
            </div>
            <Separator />
            <UserMenu />
          </div>
        )}
      </main>
    </div>
  );
};

export default MobileLayout;
