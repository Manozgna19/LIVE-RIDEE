import { Car, MapPin, Navigation, History, Users, CreditCard, Clock, LogOut, Heart } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

export type UserView = 'book' | 'track' | 'history' | 'carpool' | 'subscriptions' | 'scheduled' | 'favorites';

const navItems: { title: string; icon: React.ElementType; view: UserView }[] = [
  { title: 'Book Ride', icon: MapPin, view: 'book' },
  { title: 'Track Ride', icon: Navigation, view: 'track' },
  { title: 'Ride History', icon: History, view: 'history' },
  { title: 'Saved Places', icon: Heart, view: 'favorites' },
  { title: 'Carpool', icon: Users, view: 'carpool' },
  { title: 'Subscriptions', icon: CreditCard, view: 'subscriptions' },
  { title: 'Scheduled Rides', icon: Clock, view: 'scheduled' },
];

interface UserSidebarProps {
  activeView: UserView;
  onViewChange: (view: UserView) => void;
  onLogout: () => void;
}

export function UserSidebar({ activeView, onViewChange, onLogout }: UserSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-accent-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg text-sidebar-foreground">LiveRide</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
            {!collapsed && 'Dashboard'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.view}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.view)}
                    isActive={activeView === item.view}
                    tooltip={item.title}
                    className="cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Logout" className="cursor-pointer text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
