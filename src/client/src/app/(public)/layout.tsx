
import React from "react";
interface AuthLayoutPropes{
    children: React.ReactNode;
}
export default function PublicLayout({ children }: AuthLayoutPropes) {
  return (
      <>{children}</> 
  );
}