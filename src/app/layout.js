import ToasterProvider from "@/components/ToasterProvider";

export const metadata = {
  title: "One Dashboard",
  description: "Dashboard system for multi-role access",
  icons: {
    icon: [
      { url: "/assets/icon.png", type: "image/png" },
    ],
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
