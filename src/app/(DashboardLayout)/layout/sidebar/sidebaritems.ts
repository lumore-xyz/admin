import { uniqueId } from "lodash";

export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: string;
  children?: ChildItem[];
  item?: unknown;
  url?: string;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  isPro?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: string;
  id?: number | string;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: string;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  isPro?: boolean;
}

const SidebarContent: MenuItem[] = [
  // ==================== NON-PRO SECTIONS ====================
  // {
  //   heading: "Home",
  //   children: [
  //     {
  //       name: "Modern",
  //       icon: "solar:widget-2-linear",
  //       id: uniqueId(),
  //       url: "/",
  //       isPro: false,
  //     },
  //   ],
  // },

  {
    heading: "Home",
    children: [
      {
        name: "Dashboard",
        icon: "solar:widget-2-linear",
        id: uniqueId(),
        url: "/",
      },
      {
        name: "Users",
        icon: "solar:users-group-rounded-linear",
        id: uniqueId(),
        url: "/users",
      },

      {
        name: "Credits",
        icon: "solar:wallet-money-linear",
        id: uniqueId(),
        url: "/credits",
      },
    ],
  },
  {
    heading: "Moderation",
    children: [
      {
        name: "Reported Users",
        icon: "solar:users-group-rounded-linear",
        id: uniqueId(),
        url: "/moderation/reported-users",
      },
      {
        name: "Game Submissions",
        icon: "solar:shield-check-linear",
        id: uniqueId(),
        url: "/moderation/this-or-that",
      },
    ],
  },
  {
    heading: "Operation",
    children: [
      {
        name: "App Options",
        icon: "solar:settings-linear",
        id: uniqueId(),
        url: "/options",
      },
    ],
  },
  {
    heading: "Engagement",
    children: [
      {
        name: "Send Campaign",
        icon: "solar:chat-round-dots-linear",
        id: uniqueId(),
        url: "/engagement/notifications",
      },
      {
        name: "User Groups",
        icon: "solar:users-group-two-rounded-linear",
        id: uniqueId(),
        url: "/engagement/groups",
      },
    ],
  },
];

export default SidebarContent;
