import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isStandaloneApp, tapHaptic } from "../lib/native";

type Tab = {
  key: string;
  to: string;
  label: string;
  active: boolean;
  icon: (active: boolean) => React.ReactNode;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={active ? "#F0E0B8" : "#9DB0C0"}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={active ? "rgba(212,176,106,0.18)" : "none"}
      />
    </svg>
  );
}

function ExamsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="2"
        stroke={active ? "#F0E0B8" : "#9DB0C0"}
        strokeWidth="1.7"
        fill={active ? "rgba(94,200,192,0.12)" : "none"}
      />
      <path
        d="M8 8h8M8 12h8M8 16h5"
        stroke={active ? "#5EC8C0" : "#9DB0C0"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResultsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 19V10M12 19V5M19 19v-7"
        stroke={active ? "#F0E0B8" : "#9DB0C0"}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="5" cy="8" r="1.5" fill={active ? "#5EC8C0" : "#9DB0C0"} />
      <circle cx="12" cy="3.5" r="1.5" fill={active ? "#D4B06A" : "#9DB0C0"} />
      <circle cx="19" cy="10.5" r="1.5" fill={active ? "#5EC8C0" : "#9DB0C0"} />
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="9"
        r="3.5"
        stroke={active ? "#F0E0B8" : "#9DB0C0"}
        strokeWidth="1.7"
        fill={active ? "rgba(212,176,106,0.15)" : "none"}
      />
      <path
        d="M5.5 19.5c1.8-3.2 4-4.8 6.5-4.8s4.7 1.6 6.5 4.8"
        stroke={active ? "#5EC8C0" : "#9DB0C0"}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function shouldHideTabBar(path: string) {
  if (path === "/login" || path === "/register" || path === "/install" || path === "/privacy") return true;
  if (path.includes("/attempt/") || path.includes("/instructions")) return true;
  if (path === "/teacher/exam/new") return true;
  if (/\/teacher\/exam\/[^/]+\/(edit|analytics|video-solutions)/.test(path)) return true;
  return false;
}

export function MobileTabBar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const appMode = isStandaloneApp();
  const visible = (Boolean(user) || appMode) && !shouldHideTabBar(pathname);

  useEffect(() => {
    document.body.classList.toggle("has-mobile-tabs", visible);
    return () => document.body.classList.remove("has-mobile-tabs");
  }, [visible]);

  if (!visible) return null;

  const guestTabs: Tab[] = [
    {
      key: "home",
      to: "/",
      label: "Home",
      active: pathname === "/",
      icon: (a) => <HomeIcon active={a} />,
    },
    {
      key: "login",
      to: "/login",
      label: "Log in",
      active: pathname === "/login",
      icon: (a) => <AccountIcon active={a} />,
    },
    {
      key: "register",
      to: "/register",
      label: "Sign up",
      active: pathname === "/register",
      icon: (a) => <AccountIcon active={a} />,
    },
  ];

  const studentTabs: Tab[] = [
    {
      key: "home",
      to: "/",
      label: "Home",
      active: pathname === "/",
      icon: (a) => <HomeIcon active={a} />,
    },
    {
      key: "exams",
      to: "/student",
      label: "Exams",
      active: pathname === "/student" || pathname.startsWith("/student/exam"),
      icon: (a) => <ExamsIcon active={a} />,
    },
    {
      key: "results",
      to: "/student#history",
      label: "Results",
      active: pathname.includes("/result/"),
      icon: (a) => <ResultsIcon active={a} />,
    },
  ];

  const teacherTabs: Tab[] = [
    {
      key: "home",
      to: "/",
      label: "Home",
      active: pathname === "/",
      icon: (a) => <HomeIcon active={a} />,
    },
    {
      key: "exams",
      to: "/teacher",
      label: "Exams",
      active:
        pathname === "/teacher" ||
        (pathname.startsWith("/teacher/exam") && !pathname.includes("/results")),
      icon: (a) => <ExamsIcon active={a} />,
    },
    {
      key: "results",
      to: "/teacher/results",
      label: "Results",
      active: pathname.includes("/results") || pathname.includes("/analytics"),
      icon: (a) => <ResultsIcon active={a} />,
    },
  ];

  const tabs = !user ? guestTabs : user.role === "teacher" ? teacherTabs : studentTabs;

  return (
    <nav
      className="mobile-tab-bar fixed inset-x-0 bottom-0 z-[90] border-t border-white/10 bg-[#07121C] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-1 pt-1.5 sm:px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.key}
            to={tab.to}
            onClick={() => void tapHaptic()}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold tracking-wide transition sm:min-w-[4.5rem] sm:px-3 ${
              tab.active ? "text-champagne" : "text-bronze"
            }`}
          >
            {tab.icon(tab.active)}
            <span>{tab.label}</span>
          </NavLink>
        ))}
        {user && (
          <button
            type="button"
            onClick={() => {
              void tapHaptic();
              logout();
              window.location.assign("/");
            }}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold tracking-wide text-bronze transition hover:text-champagne sm:min-w-[4.5rem] sm:px-3"
          >
            <AccountIcon active={false} />
            <span>Log out</span>
          </button>
        )}
      </div>
    </nav>
  );
}
