
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
}

const dummyConversations: Conversation[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100",
    lastMessage: "Hey, how's it going?",
    time: "10:45 AM",
    unread: 2,
    isOnline: true,
  },
  {
    id: "2",
    name: "Mike Peterson",
    avatar: "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?auto=format&fit=crop&q=80&w=100&h=100",
    lastMessage: "Let's meet at 6pm tomorrow",
    time: "Yesterday",
    unread: 0,
    isOnline: false,
  },
  {
    id: "3",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100",
    lastMessage: "Did you see the new movie?",
    time: "Yesterday",
    unread: 0,
    isOnline: true,
  },
  {
    id: "4",
    name: "David Chen",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100",
    lastMessage: "Thanks for the help!",
    time: "Monday",
    unread: 0,
    isOnline: false,
  },
  {
    id: "5",
    name: "Amy Taylor",
    avatar: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=100&h=100",
    lastMessage: "Meeting rescheduled to 3pm",
    time: "Sunday",
    unread: 3,
    isOnline: true,
  },
];

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  selectedConversationId: string | null;
}

const ConversationList = ({ 
  onSelectConversation, 
  selectedConversationId 
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState(dummyConversations);

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
        {filteredConversations.map((conversation) => (
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
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
