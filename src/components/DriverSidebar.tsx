import { Car, MapPin, Navigation, History, IndianRupee, Star, LogOut } from 'lucide-react';
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

export type DriverView = 'requests' | 'active' | 'history' | 'earnings' | 'ratings';

const navItems: { title: string; icon: React.ElementType; view: DriverView }[] = [
  { title: 'Ride Requests', icon: MapPin, view: 'requests' },
  { title: 'Active Ride', icon: Navigation, view: 'active' },
  { title: 'Ride History', icon: History, view: 'history' },
  { title: 'Earnings', icon: IndianRupee, view: 'earnings' },
  { title: 'Ratings', icon: Star, view: 'ratings' },
];

interface DriverSidebarProps {
  activeView: DriverView;
  onViewChange: (view: DriverView) => void;
  userName: string;
  onLogout: () => void;
}

export function DriverSidebar({ activeView, onViewChange, userName, onLogout }: DriverSidebarProps) {
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
            {!collapsed && 'Driver Panel'}
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
            <SidebarMenuButton className="cursor-default hover:bg-transparent">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-xs font-bold shrink-0">
                {userName.split(' ').map(n => n[0]).join('')}
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-sidebar-foreground">{userName}</span>
                  <span className="text-xs text-sidebar-foreground/50">Driver</span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onLogout} tooltip="Sign Out" className="cursor-pointer text-destructive hover:text-destructive">
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
