import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DoorCam",
  description: "IoT System Final Project",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
