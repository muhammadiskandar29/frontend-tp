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
  Radio,
  Calendar,
} from "lucide-react";
import "@/styles/sales/sidebar.css";

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

export default function Sidebar({ role, isOpen = true, onToggle }) {
  const pathname = usePathname();
  const [viewport, setViewport] = useState(VIEWPORT.DESKTOP);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRailExpanded, setIsRailExpanded] = useState(isOpen);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isExplicitlyOpened, setIsExplicitlyOpened] = useState(isOpen);

  // Check if user is sales (divisi 3) or finance (divisi 4)
  const [isSales, setIsSales] = useState(false);
  const [isFinance, setIsFinance] = useState(false);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      const division = localStorage.getItem("division");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const userDivisi = user?.divisi || division;
          setIsSales(userDivisi === 3 || userDivisi === "3");
          setIsFinance(userDivisi === 4 || userDivisi === "4");
          setIsLeader(user?.level === "1" || user?.level === 1);
        } catch (e) {
          setIsSales(division === "3");
          setIsFinance(division === "4");
        }
      } else {
        setIsSales(division === "3");
        setIsFinance(division === "4");
      }
    }
  }, []);

  const isAddProductsPage = pathname.includes('/sales/products/addProducts') || pathname.includes('/sales/products/addProducts');

  // Listen for custom event from addProducts page
  useEffect(() => {
    if (!isAddProductsPage) return;

    const handleToggle = (e) => {
      setIsDrawerOpen(e.detail.isOpen);
    };

    window.addEventListener('addProductsSidebarToggle', handleToggle);
    return () => window.removeEventListener('addProductsSidebarToggle', handleToggle);
  }, [isAddProductsPage]);

  // Determine base path from pathname (memoized to avoid recalculation)
  const basePath = useMemo(() => {
    // Check for staff paths first (staff berada di dalam divisi)
    if (pathname?.startsWith("/sales/staff")) return "/sales/staff";
    if (pathname?.startsWith("/finance/staff")) return "/finance/staff";
    if (pathname?.startsWith("/finance")) return "/finance";
    if (pathname?.startsWith("/sales")) return "/sales";
    return "/admin";
  }, [pathname]);

  // Build menu structure with useMemo to stabilize reference (section-based)
  const menu = useMemo(() => {
    // Finance menu
    if (pathname?.startsWith("/finance")) {
      return [
        {
          section: "OVERVIEW",
          items: [
            { label: "Dashboard", href: "/finance", icon: <Home size={18} /> },
          ],
        },
        {
          section: "TRANSACTIONS",
          items: [
            { label: "Transactions", href: "/finance/transactions", icon: <ClipboardList size={18} /> },
          ],
        },
      ];
    }

    // Staff Sales menu (level 2)
    if (pathname?.startsWith("/sales/staff")) {
      return [
        {
          section: "OVERVIEW",
          items: [
            { label: "Dashboard", href: basePath, icon: <Home size={18} /> },
          ],
        },
        {
          section: "OPERATIONS",
          items: [
            { label: "Orders", href: `${basePath}/orders`, icon: <ClipboardList size={18} /> },
            { label: "Broadcast", href: `${basePath}/broadcast`, icon: <Radio size={18} /> },
          ],
        },
      ];
    }

    // Staff Finance menu (level 2) - untuk nanti
    if (pathname?.startsWith("/finance/staff")) {
      return [
        {
          section: "OVERVIEW",
          items: [
            { label: "Dashboard", href: basePath, icon: <Home size={18} /> },
          ],
        },
        {
          section: "TRANSACTIONS",
          items: [
            { label: "Transactions", href: `${basePath}/orders`, icon: <ClipboardList size={18} /> },
          ],
        },
      ];
    }



    // Admin menu (default)
    // Sales menu (leader)
    if (pathname?.startsWith("/sales")) {
      const salesItems = [
        {
          section: "OVERVIEW",
          items: [
            { label: "Dashboard", href: basePath, icon: <Home size={18} /> },
          ],
        },
        {
          section: "CUSTOMERS",
          items: [
            { label: "Customers", href: `${basePath}/customers`, icon: <UserCheck size={18} /> },
          ],
        },
        {
          section: "OPERATIONS",
          items: [
            { label: "Orders", href: `${basePath}/orders`, icon: <ClipboardList size={18} /> },
            {
              label: "Products",
              icon: <ShoppingBag size={18} />,
              submenu: [
                { label: "Kategori Produk", href: `${basePath}/kategori` },
                { label: "Produk", href: `${basePath}/products` },
              ],
            },
          ],
        },
        {
          section: "REPORTS",
          items: [
            { label: "Follow Up Logs", href: `${basePath}/followup/report`, icon: <Activity size={18} /> },
          ],
        },
      ];

      // Add Sales List and Broadcast for Leader (level 1)
      if (isLeader) {
        // Add Team Management section
        salesItems.splice(3, 0, {
          section: "TEAM MANAGEMENT",
          items: [
            { label: "Sales List", href: `${basePath}/sales-list`, icon: <Users size={18} /> }
          ]
        });

        // Add Broadcast to OPERATIONS
        const opsSection = salesItems.find(s => s.section === "OPERATIONS");
        if (opsSection) {
          opsSection.items.push({
            label: "Broadcast",
            href: `${basePath}/broadcast`,
            icon: <Radio size={18} />
          });
        }
      }

      return salesItems;
    }

    // Admin menu (default)
    return [
      {
        section: "OVERVIEW",
        items: [
          { label: "Dashboard", href: basePath, icon: <Home size={18} /> },
        ],
      },
      {
        section: "USER MANAGEMENT",
        items: [
          { label: "Users", href: "/admin/users", icon: <Users size={18} /> },
        ],
      },
    ];
  }, [pathname, basePath, isLeader]);

  // === DETECT SCREEN WIDTH ===
  useEffect(() => {
    const handleResize = () => setViewport(getViewport());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync isRailExpanded with isOpen prop
  useEffect(() => {
    if (viewport === VIEWPORT.DESKTOP) {
      setIsRailExpanded(isOpen);
      setIsExplicitlyOpened(isOpen);
    }
  }, [isOpen, viewport]);

  // Handle hover behavior for desktop - expand on hover, collapse on mouse leave (unless explicitly opened)
  useEffect(() => {
    if (viewport === VIEWPORT.DESKTOP) {
      if (isHovered) {
        setIsRailExpanded(true);
      } else {
        // Collapse only if not explicitly opened via click/burger button
        if (!isExplicitlyOpened) {
          setIsRailExpanded(false);
        }
      }
    }
  }, [isHovered, viewport, isExplicitlyOpened]);

  // Add class to body based on sidebar expanded state for CSS to adjust content margin
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const body = document.body;
      if (viewport === VIEWPORT.DESKTOP) {
        if (isRailExpanded) {
          body.classList.add('sidebar-expanded');
          body.classList.remove('sidebar-collapsed');
        } else {
          body.classList.add('sidebar-collapsed');
          body.classList.remove('sidebar-expanded');
        }
      } else {
        body.classList.remove('sidebar-expanded', 'sidebar-collapsed');
      }
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('sidebar-expanded', 'sidebar-collapsed');
      }
    };
  }, [isRailExpanded, viewport]);

  useEffect(() => {
    // Force mobile behavior for addProducts page
    if (isAddProductsPage) {
      setIsRailExpanded(false);
      setIsDrawerOpen(false);
      return;
    }

    // Normal behavior for other pages
    if (viewport === VIEWPORT.DESKTOP) {
      // isRailExpanded controlled by isOpen prop
      setIsDrawerOpen(false);
    } else if (viewport === VIEWPORT.TABLET) {
      setIsRailExpanded(false);
      setIsDrawerOpen(false);
    } else {
      setIsRailExpanded(false);
      setIsDrawerOpen(false);
    }
  }, [viewport, isAddProductsPage, isOpen]);

  // === AUTO OPEN SUBMENU IF CURRENT PAGE IS INSIDE IT ===
  useEffect(() => {
    if (!pathname || !menu) return;

    // Find which submenu should be open (if any)
    let submenuToOpen = null;

    menu.forEach((section) => {
      if (section.items) {
        section.items.forEach((item) => {
          if (item.submenu) {
            const activeSub = item.submenu.find((sub) => {
              if (!sub?.href) return false;
              // Normalize paths for comparison (handle both /admin and /sales)
              const normalizedPathname = String(pathname).replace(/^\/sales/, "/admin");
              const normalizedSubHref = String(sub.href).replace(/^\/sales/, "/admin");
              return normalizedPathname.startsWith(normalizedSubHref);
            });
            if (activeSub) {
              submenuToOpen = item.label;
            }
          }
        });
      }
    });

    // Only update state if the value actually changed (using functional update to avoid dependency)
    setOpenSubmenu((prev) => {
      return submenuToOpen !== prev ? submenuToOpen : prev;
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
    // On desktop, clicking expands the sidebar fully and keeps it open
    if (viewport === VIEWPORT.DESKTOP) {
      setIsRailExpanded(true);
      setIsExplicitlyOpened(true);
      if (onToggle && !isOpen) {
        onToggle();
      }
    }
  };

  // Handle sidebar click - expand fully and keep it open
  const handleSidebarClick = (e) => {
    if (viewport === VIEWPORT.DESKTOP) {
      // If clicking on a menu item or link, expand and keep open
      if (e.target.closest('.sidebar-item') || e.target.closest('a')) {
        setIsRailExpanded(true);
        setIsExplicitlyOpened(true);
        if (onToggle && !isOpen) {
          onToggle();
        }
      }
    }
  };


  // === TOGGLE SUBMENU ===
  const toggleSubmenu = (label) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  // === CHECK IF MENU OR SUBMENU IS ACTIVE ===
  const isMenuActive = (item) => {
    if (!pathname || !item) return false;
    // Normalize paths for comparison (handle both /admin and /sales)
    const normalizedPathname = String(pathname).replace(/^\/sales/, "/admin");

    if (item.href) {
      const normalizedItemHref = String(item.href).replace(/^\/sales/, "/admin");
      if (normalizedPathname === normalizedItemHref) return true;
    }

    if (item.submenu) {
      return item.submenu.some((sub) => {
        if (!sub?.href) return false;
        const normalizedSubHref = String(sub.href).replace(/^\/sales/, "/admin");
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
    if (viewport === VIEWPORT.DESKTOP && !isRailExpanded) {
      classes.push("sidebar--collapsed");
    }
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
      <aside
        className={sidebarClass}
        aria-label="Navigation sidebar"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleSidebarClick}
      >
        {/* === LOGO GANTI TULISAN === */}
        <div className="sidebar-logo">
          <Link href={
            pathname?.startsWith("/finance/staff") ? "/finance/staff" :
              pathname?.startsWith("/sales/staff") ? "/sales/staff" :
                isFinance ? "/finance" :
                  isSales ? "/sales" :
                    "/admin"
          }>
            <Image
              src="/assets/logo.png"
              alt="Logo"
              width={130}
              height={50}
              priority
            />
          </Link>
        </div>

        <nav className="sidebar-menu">
          {menu.map((section, sectionIndex) => {
            if (!section || !section.section || !section.items) return null;

            return (
              <section key={`section-${sectionIndex}`} className="sidebar-section-wrapper">
                {/* Section Header - Non-clickable label */}
                <h3 className="sidebar-section-header">
                  {section.section}
                </h3>

                {/* Section Items */}
                <ul className="sidebar-section-items">
                  {section.items.map((item) => {
                    if (!item || !item.label) return null;

                    const active = isMenuActive(item);
                    const isSubmenuOpen = openSubmenu === item.label;

                    return (
                      <li key={item.label} className="sidebar-item-wrapper">
                        {item.submenu ? (
                          <>
                            <button
                              onClick={() => {
                                // If sidebar is collapsed, expand it first, then toggle submenu
                                if (viewport === VIEWPORT.DESKTOP && !isRailExpanded) {
                                  setIsRailExpanded(true);
                                  setIsExplicitlyOpened(true);
                                  if (onToggle && !isOpen) {
                                    onToggle();
                                  }
                                  // Small delay to ensure sidebar expands before toggling submenu
                                  setTimeout(() => {
                                    toggleSubmenu(item.label);
                                  }, 100);
                                } else {
                                  toggleSubmenu(item.label);
                                  // Expand sidebar when submenu is clicked (if not already expanded)
                                  if (viewport === VIEWPORT.DESKTOP && !isRailExpanded) {
                                    setIsRailExpanded(true);
                                    setIsExplicitlyOpened(true);
                                    if (onToggle && !isOpen) {
                                      onToggle();
                                    }
                                  }
                                }
                              }}
                              className={`sidebar-item has-submenu w-full ${active ? "sidebar-item-active" : ""
                                } ${isSubmenuOpen ? "open" : ""}`}
                              aria-expanded={isSubmenuOpen}
                              aria-controls={`${item.label}-submenu`}
                            >
                              <div className="flex items-center gap-3" style={{ flex: 1 }}>
                                <span className="sidebar-item-icon-wrapper">
                                  {item.icon}
                                </span>
                                <span>{item.label}</span>
                              </div>
                              {isSubmenuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>

                            <ul className={`submenu-list ${isSubmenuOpen ? "submenu-open" : ""}`} id={`${item.label}-submenu`}>
                              {item.submenu.map((sub) => {
                                if (!sub || !sub.href || !sub.label) return null;
                                const normalizedPathname = String(pathname || "").replace(/^\/sales/, "/admin");
                                const normalizedSubHref = String(sub.href).replace(/^\/sales/, "/admin");
                                const isSubActive = normalizedPathname === normalizedSubHref || normalizedPathname.startsWith(normalizedSubHref + "/");
                                return (
                                  <li key={sub.href}>
                                    <Link
                                      href={sub.href}
                                      className={`submenu-item ${isSubActive ? "submenu-item-active" : ""
                                        }`}
                                      onClick={handleLinkClick}
                                    >
                                      {sub.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </>
                        ) : (
                          item.href ? (
                            <Link
                              href={item.href}
                              className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
                              onClick={handleLinkClick}
                            >
                              <span className="sidebar-item-icon-wrapper">
                                {item.icon}
                              </span>
                              <span>{item.label}</span>
                            </Link>
                          ) : null
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>

      </aside>

      {/* === TOGGLE BUTTON (TABLET & MOBILE) === */}
      {/* Hide toggle button for addProducts page - it has its own button */}
      {(viewport === VIEWPORT.MOBILE || viewport === VIEWPORT.TABLET) && !isAddProductsPage && (
        <button
          onClick={handleToggle}
          className={`sidebar-toggle-btn ${isDrawerOpen || (viewport === VIEWPORT.TABLET && isRailExpanded)
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
