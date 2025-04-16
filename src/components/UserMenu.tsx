
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, MessageSquare, Users, LogOut } from "lucide-react";

const currentUser = {
  name: "Alex Morgan",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100",
  status: "active"
};

const UserMenu = () => {
  return (
    <div className="p-3 border-t flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <img src={currentUser.avatar} alt={currentUser.name} className="object-cover" />
        </Avatar>
        <div>
          <h3 className="font-medium text-sm">{currentUser.name}</h3>
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
      </div>
    </div>
  );
};

export default UserMenu;
