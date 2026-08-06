import {
  BriefcaseBusiness,
  History,
  House,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: House,
  },
  {
    label: "Staff",
    path: "/staff",
    icon: Users,
  },
  {
    label: "Work Types",
    path: "/work-types",
    icon: BriefcaseBusiness,
  },
  {
    label: "History",
    path: "/history",
    icon: History,
  },
];

function BottomNavigation() {
  return (
    <nav className="bottom-navigation">
      {navigationItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `bottom-navigation__item ${
                isActive ? "bottom-navigation__item--active" : ""
              }`
            }
          >
            <Icon size={21} strokeWidth={1.9} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default BottomNavigation;