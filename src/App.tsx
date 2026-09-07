import { createPortal } from "react-dom";
import ChatWidget from "@/features/chat-widget/chat-widget";
import MockHostPage from "@/pages/mock-host-page/mock-host-page";
import { PortalTargetProvider } from "@/embed/portal-context";
import { createDebugLogger } from "@/utils/debug-log";
import { memo } from "react";

const debugLog = createDebugLogger("[app]");
const App = memo(() => {
  debugLog.log("load");
  if (import.meta.env.DEV) {
    const shadowHost = document.getElementById("shadow-dev-host");
    const mountPoint = shadowHost?.shadowRoot?.getElementById("shadow-mount");
    const portalTarget = shadowHost?.shadowRoot?.getElementById("confirm-portal");

    return (
      <>
        <MockHostPage />
        {mountPoint &&
          portalTarget &&
          createPortal(
            <PortalTargetProvider value={portalTarget}>
              <ChatWidget />
            </PortalTargetProvider>,
            mountPoint
          )}
      </>
    );
  }

  return <ChatWidget />;
});

export default App;
