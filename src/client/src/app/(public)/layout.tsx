
import React from "react";
interface AuthLayoutPropes{
    children: React.ReactNode;
}
export default function PublicLayout({ children }: AuthLayoutPropes) {
  return (
    <html lang="en">
      <body>{children}</body> 
    </html>
  );
}