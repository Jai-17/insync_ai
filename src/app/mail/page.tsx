import dynamic from "next/dynamic";
import React from "react";
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
    <div>
      <Mail
        defaultLayout={[20, 32, 48]}
        navCollapsedSize={4}
        defaultCollapsed={false}
      />
    </div>
  );
};

export default MailDashboard;
