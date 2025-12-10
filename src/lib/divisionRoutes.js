const divisionRouteMap = {
  admin: "/admin",
  "1": "/admin", // Admin Super
  "2": "/admin", // Owner
  "3": "/sales", // Sales
  "4": "/finance", // Finance
  "5": "/hr/dashboard", // HR
  "11": "/admin", // Trainer (default ke admin untuk sementara)
  sales: "/sales",
  hr: "/hr/dashboard",
  "human resources": "/hr/dashboard",
  "human_resources": "/hr/dashboard",
  finance: "/finance",
  trainer: "/admin",
};

export function getDivisionHome(divisi) {
  if (!divisi) return "/admin";
  // Handle both string and number values
  const divisiStr = String(divisi).trim();
  // Try exact match first (for numeric strings like "3", "1", etc.)
  if (divisionRouteMap[divisiStr]) {
    return divisionRouteMap[divisiStr];
  }
  // Fallback to lowercase for text values
  const normalized = divisiStr.toLowerCase();
  return divisionRouteMap[normalized] || "/admin";
}

