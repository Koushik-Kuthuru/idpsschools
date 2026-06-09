"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Menu, LogOut, User, X } from "lucide-react";
import { flatNav } from "./navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

const SAMPLE_NOTIFICATIONS = [
  {
    id: "1",
    title: "Fee reminder sent",
    body: "Class 10-A fee reminders were delivered to 42 parents.",
    time: "2 min ago",
    unread: true,
  },
  {
    id: "2",
    title: "New admission inquiry",
    body: "A parent submitted an admission form for Grade 6.",
    time: "1 hr ago",
    unread: true,
  },
  {
    id: "3",
    title: "Staff attendance synced",
    body: "Today's teaching staff attendance has been updated.",
    time: "Yesterday",
    unread: false,
  },
] as const;

export default function Header({ setIsMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const userInitials = React.useMemo(() => {
    if (!user) return "BA";
    const name = user.displayName || user.email || "Branch Admin";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [notificationsOpen]);

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-1.5 text-gray-500 hover:text-[#144835]"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={18} />
          </button>
          <h2 className="text-sm sm:text-lg font-bold text-[#1A1A1A] max-w-[55vw] sm:max-w-none truncate">
            {flatNav.find((n) => pathname === n.href || (n.href !== "/schools/idpskalaburagi/admin" && pathname.startsWith(n.href)))?.name ||
              "Dashboard"}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a2c144] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-56 bg-gray-100/50 border border-gray-200 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#a2c144]/20 focus:border-[#a2c144] transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 bg-red-500 rounded-full ring-2 ring-white z-10" />
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setUserMenuOpen(false);
                  setNotificationsOpen((open) => !open);
                }}
                className="relative p-1.5 text-gray-400 hover:text-[#144835] transition-colors rounded-full hover:bg-gray-100"
              >
                <Bell size={18} />
              </button>
            </div>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Account menu"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setNotificationsOpen(false);
                  setUserMenuOpen((open) => !open);
                }}
                className="h-8 w-8 rounded-full bg-[#144835] text-white flex items-center justify-center border-2 border-white shadow-sm hover:bg-[#0f3628] transition-colors overflow-hidden font-bold text-xs"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-2 border-b border-gray-50">
                    <p className="text-xs font-bold text-gray-800 truncate">{user?.displayName || "Branch Admin"}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email || "admin@school.edu"}</p>
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close notifications"
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
            onClick={() => setNotificationsOpen(false)}
          />
          <aside
            role="dialog"
            aria-label="Notifications"
            className="relative h-full w-full max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {SAMPLE_NOTIFICATIONS.filter((n) => n.unread).length} unread
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setNotificationsOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-[#144835] hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {SAMPLE_NOTIFICATIONS.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 ${n.unread ? "bg-[#144835]/[0.03]" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {n.unread && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a2c144]" />
                    )}
                    <div className={n.unread ? "" : "pl-3.5"}>
                      <p className="text-xs font-bold text-gray-900">{n.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </>
  );
}
