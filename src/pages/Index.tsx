
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import ConversationList from "@/components/ConversationList";
import ChatArea from "@/components/ChatArea";
import UserMenu from "@/components/UserMenu";
import MobileLayout from "@/components/MobileLayout";

const Index = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>("1");

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
