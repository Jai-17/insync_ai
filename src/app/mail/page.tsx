import React from "react";
import Mail from "./mail";

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
