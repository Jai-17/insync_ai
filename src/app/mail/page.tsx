import ThemeToggle from "@/components/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import React from "react";
import ComposeButton from "./compose-button";
// import Mail from "./mail";
const Mail = dynamic(
  () => {
    return import("./mail");
  },
  {
    ssr: false,
  },
);

const MailDashboard = () => {
  return (
    <>
      <div className="absolute bottom-4 left-4">
        <div className="flex items-center gap-2">
          <UserButton />
          <ThemeToggle />
          <ComposeButton />
        </div>
      </div>
      <Mail
        defaultLayout={[20, 32, 48]}
        navCollapsedSize={4}
        defaultCollapsed={false}
      />
    </>
  );
};

export default MailDashboard;
