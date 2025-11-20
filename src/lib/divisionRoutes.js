const divisionRouteMap = {
  admin: "/admin",
  "1": "/admin",
  sales: "/sales",
  "2": "/sales",
  hr: "/hr/dashboard",
  "human resources": "/hr/dashboard",
  "human_resources": "/hr/dashboard",
};

export function getDivisionHome(divisi) {
  if (!divisi) return "/admin";
  const normalized = String(divisi).trim().toLowerCase();
  return divisionRouteMap[normalized] || "/admin";
}

