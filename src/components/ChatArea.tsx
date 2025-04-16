
import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Paperclip, Send, Phone, Video, MoreVertical } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sent: boolean;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
  messages: Message[];
}

const dummyConversations: Record<string, Conversation> = {
  "1": {
    id: "1",
    name: "Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=100&h=100",
    isOnline: true,
    messages: [
      { id: "1", text: "Hey, how's it going?", sent: false, time: "10:30 AM" },
      { id: "2", text: "I'm good! Just finished that project we talked about.", sent: true, time: "10:32 AM" },
      { id: "3", text: "That's great! Can you send me the files?", sent: false, time: "10:33 AM" },
      { id: "4", text: "Sure, I'll email them to you in a bit.", sent: true, time: "10:35 AM" },
      { id: "5", text: "Thanks! Also, are we still on for coffee tomorrow?", sent: false, time: "10:36 AM" },
      { id: "6", text: "Yes, definitely! Looking forward to it.", sent: true, time: "10:38 AM" },
      { id: "7", text: "Great! See you at the usual place at 2pm?", sent: false, time: "10:40 AM" },
      { id: "8", text: "Perfect. See you then!", sent: true, time: "10:42 AM" },
    ]
  },
  "2": {
    id: "2",
    name: "Mike Peterson",
    avatar: "https://images.unsplash.com/photo-1583864697784-a0efc8379f70?auto=format&fit=crop&q=80&w=100&h=100",
    isOnline: false,
    lastSeen: "Yesterday at 7:23 PM",
    messages: [
      { id: "1", text: "Hey Mike, about that meeting tomorrow", sent: true, time: "Yesterday" },
      { id: "2", text: "Let's meet at 6pm tomorrow instead of 5pm", sent: false, time: "Yesterday" },
      { id: "3", text: "That works for me. Same place?", sent: true, time: "Yesterday" },
      { id: "4", text: "Yes, at the office conference room", sent: false, time: "Yesterday" },
    ]
  },
  "3": {
    id: "3",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100",
    isOnline: true,
    messages: [
      { id: "1", text: "Did you see the new movie that just came out?", sent: false, time: "Yesterday" },
      { id: "2", text: "Not yet, is it good?", sent: true, time: "Yesterday" },
      { id: "3", text: "It's amazing! We should go watch it this weekend", sent: false, time: "Yesterday" },
    ]
  },
  "4": {
    id: "4",
    name: "David Chen",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100&h=100",
    isOnline: false,
    lastSeen: "Monday at 1:45 PM",
    messages: [
      { id: "1", text: "I needed help with the presentation", sent: false, time: "Monday" },
      { id: "2", text: "What do you need help with?", sent: true, time: "Monday" },
      { id: "3", text: "Just needed some design tips, but I figured it out", sent: false, time: "Monday" },
      { id: "4", text: "Thanks for the help anyway!", sent: false, time: "Monday" },
    ]
  },
  "5": {
    id: "5",
    name: "Amy Taylor",
    avatar: "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&q=80&w=100&h=100",
    isOnline: true,
    messages: [
      { id: "1", text: "Team meeting today at 2pm", sent: false, time: "Sunday" },
      { id: "2", text: "I'll be there", sent: true, time: "Sunday" },
      { id: "3", text: "Actually, can we reschedule to 3pm?", sent: false, time: "Sunday" },
      { id: "4", text: "Sure, that works for me", sent: true, time: "Sunday" },
      { id: "5", text: "Great, meeting rescheduled to 3pm", sent: false, time: "Sunday" },
    ]
  },
};

interface ChatAreaProps {
  conversationId: string | null;
}

const ChatArea = ({ conversationId }: ChatAreaProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (conversationId && dummyConversations[conversationId]) {
      setConversation(dummyConversations[conversationId]);
    } else {
      setConversation(null);
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversationId) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedConvo = { 
      ...dummyConversations[conversationId],
      messages: [...dummyConversations[conversationId].messages, newMsg]
    };

    // In a real app, we would update the state properly and persist to backend
    dummyConversations[conversationId] = updatedConvo;
    setConversation(updatedConvo);
    setNewMessage("");
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-muted-foreground">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <img src={conversation.avatar} alt={conversation.name} className="object-cover" />
          </Avatar>
          <div>
            <h3 className="font-medium">{conversation.name}</h3>
            <p className="text-xs text-muted-foreground">
              {conversation.isOnline ? "Online" : `Last seen ${conversation.lastSeen}`}
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
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sent ? "justify-end" : "justify-start"}`}
            >
              {!message.sent && (
                <Avatar className="h-8 w-8 mr-2 self-end">
                  <img src={conversation.avatar} alt={conversation.name} className="object-cover" />
                </Avatar>
              )}
              <div className="flex flex-col">
                <div className={message.sent ? "message-sent" : "message-received"}>
                  {message.text}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-2">
                  {message.time}
                </span>
              </div>
            </div>
          ))}
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
