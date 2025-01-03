"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Define the navigation item type
interface NavItem {
  name: string;
  icon: string;
  path?: string;
  active: boolean;
  onClick: () => void;
  badge?: {
    count: number;
    variant: "default" | "warning" | "error";
  };
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>(pathname);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      await supabase.auth.signOut();
      if (typeof window !== "undefined")
        window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navigationItems: NavItem[] = [
    {
      name: "AI Assistant",
      icon: "bot",
      path: "/dashboard/aiassistant",
      active: currentView === "/dashboard/aiassistant",
      onClick: () => {
        router.push("/dashboard/aiassistant");
      },
    },
    {
      name: 'Appointment Tools',
      path: '/dashboard/appointment-tools',
      icon: 'calendar',
      active: currentView === '/dashboard/appointment-tools',
      onClick: () => {
        router.push('/dashboard/appointment-tools');
      }
    },
    {
      name: "Calendar",
      icon: "calendar",
      path: "/dashboard/calendar",
      active: currentView === "/dashboard/calendar",
      onClick: () => {
        router.push("/dashboard/calendar");
      },
    },
    {
      name: "Twilio Integration",
      icon: "phone-call",
      path: "/dashboard/twilio",
      active: currentView === "/dashboard/twilio",
      onClick: () => {
        router.push("/dashboard/twilio");
      },
    },
    {
      name: "Data Import",
      icon: "upload",
      path: "/dashboard/dataimport",
      active: currentView === "/dashboard/dataimport",
      onClick: () => {
        router.push("/dashboard/dataimport");
      },
      badge: {
        count: 1,
        variant: "default",
      },
    },
    {
      name: "Voice Clone",
      icon: "mic",
      path: "/dashboard/voiceclone",
      active: currentView === "/dashboard/voiceclone",
      onClick: () => {
        router.prefetch("/dashboard/voiceclone");
        router.push("/dashboard/voiceclone");
      },
    },
    {
      name: "Tasks",
      icon: "tasks-checked",
      active: false,
      onClick: () => {},
      badge: {
        count: 5,
        variant: "error",
      },
    },
    {
      name: "Settings",
      icon: "settings",
      active: false,
      onClick: () => {},
    },
  ];

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <h2 className="text-xl font-bold text-gray-900">JENNY AI</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "ml-auto")}
        >
          <Icon
            name="chevronLeft"
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {navigationItems.map((item) => (
            <Button
              key={item.name}
              variant={item.active ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 mb-1 relative",
                collapsed ? "px-2" : "px-4",
                !collapsed && "text-left"
              )}
              onClick={() => {
                item.onClick();
                setCurrentView(item.path || "");
              }}
            >
              <Icon
                name={item.icon}
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  item.active && item.name === "AI Assistant" && "rotate-12"
                )}
              />
              {!collapsed && (
                <span className="transition-opacity duration-200">
                  {item.name}
                </span>
              )}
              {item.badge && !collapsed && (
                <span
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs",
                    item.badge.variant === "error" && "bg-red-100 text-red-700",
                    item.badge.variant === "warning" &&
                      "bg-yellow-100 text-yellow-700",
                    item.badge.variant === "default" &&
                      "bg-blue-100 text-blue-700"
                  )}
                >
                  {item.badge.count}
                </span>
              )}
              {item.badge && collapsed && (
                <span
                  className={cn(
                    "absolute -right-1 -top-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center",
                    item.badge.variant === "error" && "bg-red-500 text-white",
                    item.badge.variant === "warning" &&
                      "bg-yellow-500 text-white",
                    item.badge.variant === "default" && "bg-blue-500 text-white"
                  )}
                >
                  {item.badge.count}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            collapsed ? "px-2" : "px-4"
          )}
          onClick={handleSignOut}
        >
          <Icon name="logOut" className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}
