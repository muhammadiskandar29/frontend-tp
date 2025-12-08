"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Home,
  Users,
  FileText,
  Settings,
  ShoppingBag,
  Tag,
  Menu,
  ChevronDown,
  ChevronRight,
  Activity,
  ClipboardList,
  UserCheck,
} from "lucide-react";
import "@/styles/sidebar.css";

const VIEWPORT = {
  DESKTOP: "desktop",
  TABLET: "tablet",
  MOBILE: "mobile",
};

const getViewport = () => {
  if (typeof window === "undefined") return VIEWPORT.DESKTOP;
  if (window.innerWidth < 768) return VIEWPORT.MOBILE;
  if (window.innerWidth < 1024) return VIEWPORT.TABLET;
  return VIEWPORT.DESKTOP;
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState([]);
  const [viewport, setViewport] = useState(VIEWPORT.DESKTOP);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRailExpanded, setIsRailExpanded] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  
  // Check if user is sales (divisi 3)
  const [isSales, setIsSales] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      const division = localStorage.getItem("division");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          // Check if divisi is 3 (Sales) or "3"
          const userDivisi = user?.divisi || division;
          setIsSales(userDivisi === 3 || userDivisi === "3");
        } catch (e) {
          // Fallback to division from localStorage
          setIsSales(division === "3");
        }
      } else {
        setIsSales(division === "3");
      }
    }
  }, []);
  
  // Check if we're on addProducts page - force mobile behavior
  const isAddProductsPage = pathname.includes('/admin/products/addProducts') || pathname.includes('/sales/products/addProducts');
  
  // Listen for custom event from addProducts page
  useEffect(() => {
    if (!isAddProductsPage) return;
    
    const handleToggle = (e) => {
      setIsDrawerOpen(e.detail.isOpen);
    };
    
    window.addEventListener('addProductsSidebarToggle', handleToggle);
    return () => window.removeEventListener('addProductsSidebarToggle', handleToggle);
  }, [isAddProductsPage]);

  // === MENU BASED ON ROLE ===
  useEffect(() => {
    const basePath = isSales ? "/sales" : "/admin";
    
    const baseMenu = [
      { label: "Dashboard", href: basePath, icon: <Home size={18} /> },
      // Users hanya untuk admin, tidak untuk sales
      ...(isSales ? [] : [{ label: "Users", href: "/admin/users", icon: <Users size={18} /> }]),
      { label: "Customers", href: `${basePath}/customers`, icon: <UserCheck size={18} /> },
      {
        label: "Products",
        icon: <ShoppingBag size={18} />,
        submenu: [
          { label: "Kategori Produk", href: `${basePath}/kategori` },
          { label: "Produk", href: `${basePath}/products` },
        ],
      },
      { label: "Orders", href: `${basePath}/orders`, icon: <ClipboardList size={18} /> },
      {
        label: "Follow Up",
        icon: <Tag size={18} />,
        submenu: [
          { label: "Report", href: `${basePath}/followup/report` },
        ],
      },
      // { label: "Aktivitas", href: `${basePath}/aktivitas`, icon: <Activity size={18} /> }, // Route belum tersedia
      // { label: "Settings", href: `${basePath}/settings`, icon: <Settings size={18} /> }, // Route belum tersedia
    ];

    setMenu(baseMenu);
  }, [role, isSales]);

  // === DETECT SCREEN WIDTH ===
  useEffect(() => {
    const handleResize = () => setViewport(getViewport());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Force mobile behavior for addProducts page
    if (isAddProductsPage) {
      setIsRailExpanded(false);
      setIsDrawerOpen(false);
      return;
    }
    
    // Normal behavior for other pages
    if (viewport === VIEWPORT.DESKTOP) {
      setIsRailExpanded(true);
      setIsDrawerOpen(false);
    } else if (viewport === VIEWPORT.TABLET) {
      setIsRailExpanded(false);
      setIsDrawerOpen(false);
    } else {
      setIsRailExpanded(false);
      setIsDrawerOpen(false);
    }
  }, [viewport, isAddProductsPage]);

  // === AUTO OPEN SUBMENU IF CURRENT PAGE IS INSIDE IT ===
  useEffect(() => {
    menu.forEach((item) => {
      if (item.submenu) {
        const activeSub = item.submenu.find((sub) => {
          // Normalize paths for comparison (handle both /admin and /sales)
          const normalizedPathname = pathname.replace(/^\/sales/, "/admin");
          const normalizedSubHref = sub.href.replace(/^\/sales/, "/admin");
          return normalizedPathname.startsWith(normalizedSubHref);
        });
        if (activeSub) setOpenSubmenu(item.label);
      }
    });
  }, [pathname, menu]);

  const handleToggle = () => {
    if (viewport === VIEWPORT.MOBILE) {
      setIsDrawerOpen((prev) => !prev);
      return;
    }
    if (viewport === VIEWPORT.TABLET) {
      setIsRailExpanded((prev) => !prev);
    }
  };

  const handleLinkClick = () => {
    if (viewport === VIEWPORT.MOBILE) {
      setIsDrawerOpen(false);
    }
  };

  // === TOGGLE SUBMENU ===
  const toggleSubmenu = (label) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  // === CHECK IF MENU OR SUBMENU IS ACTIVE ===
  const isMenuActive = (item) => {
    // Normalize paths for comparison (handle both /admin and /sales)
    const normalizedPathname = pathname.replace(/^\/sales/, "/admin");
    const normalizedItemHref = item.href.replace(/^\/sales/, "/admin");
    
    if (normalizedPathname === normalizedItemHref) return true;
    if (item.submenu) {
      return item.submenu.some((sub) => {
        const normalizedSubHref = sub.href.replace(/^\/sales/, "/admin");
        return normalizedPathname.startsWith(normalizedSubHref);
      });
    }
    return false;
  };

  const sidebarClass = useMemo(() => {
    // Force mobile class for addProducts page
    if (isAddProductsPage) {
      const classes = ["sidebar", "sidebar--mobile"];
      classes.push(isDrawerOpen ? "sidebar--open" : "sidebar--closed");
      return classes.join(" ");
    }
    
    // Normal behavior for other pages
    const classes = ["sidebar", `sidebar--${viewport}`];
    if (viewport === VIEWPORT.TABLET && !isRailExpanded) {
      classes.push("sidebar--compact");
    }
    if (viewport === VIEWPORT.MOBILE) {
      classes.push(isDrawerOpen ? "sidebar--open" : "sidebar--closed");
    }
    return classes.join(" ");
  }, [viewport, isRailExpanded, isDrawerOpen, isAddProductsPage]);

  return (
    <>
      <aside className={sidebarClass} aria-label="Navigation sidebar">
        {/* === LOGO GANTI TULISAN === */}
        <div className="sidebar-logo">
          <Link href={isSales ? "/sales" : "/admin"}>
            <Image
              src="/assets/logo.png"
              alt="Logo"
              width={130}
              height={50}
              priority
            />
          </Link>
        </div>

        <ul className="sidebar-menu">
          {menu.map((item) => {
            const active = isMenuActive(item);
            const isOpen = openSubmenu === item.label;

            return (
              <li key={item.label}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`sidebar-item has-submenu w-full ${
                        active ? "sidebar-item-active open" : ""
                      }`}
                      aria-expanded={openSubmenu === item.label}
                      aria-controls={`${item.label}-submenu`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {isOpen && (
                      <ul className="submenu-list" id={`${item.label}-submenu`}>
                        {item.submenu.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <li key={sub.href}>
                              <Link
                                href={sub.href}
                                className={`submenu-item ${
                                  isSubActive ? "submenu-item-active" : ""
                                }`}
                                onClick={handleLinkClick}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
                    onClick={handleLinkClick}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">© 2025 One Dashboard</div>
      </aside>

      {/* === TOGGLE BUTTON (TABLET & MOBILE) === */}
      {/* Hide toggle button for addProducts page - it has its own button */}
      {(viewport === VIEWPORT.MOBILE || viewport === VIEWPORT.TABLET) && !isAddProductsPage && (
        <button
          onClick={handleToggle}
          className={`sidebar-toggle-btn ${
            isDrawerOpen || (viewport === VIEWPORT.TABLET && isRailExpanded)
              ? "sidebar-toggle-btn--active"
              : ""
          }`}
          aria-label="Toggle sidebar visibility"
          aria-expanded={
            viewport === VIEWPORT.MOBILE ? isDrawerOpen : isRailExpanded
          }
        >
          <Menu size={18} />
        </button>
      )}

      {/* Overlay for mobile and addProducts page */}
      {(viewport === VIEWPORT.MOBILE || isAddProductsPage) && isDrawerOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
    </>
  );
}
