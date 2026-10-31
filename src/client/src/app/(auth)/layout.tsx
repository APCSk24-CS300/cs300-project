
import React from "react";
interface AuthLayoutPropes{
    children: React.ReactNode;
}
export default function AuthLayout({ children }: AuthLayoutPropes) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}