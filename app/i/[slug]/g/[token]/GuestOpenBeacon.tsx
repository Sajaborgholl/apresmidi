"use client";

import { useEffect } from "react";
import { markGuestOpened } from "../../actions";

// Records "opened" for the host's dashboard, once per page view, after the
// page has rendered in a real browser.
export default function GuestOpenBeacon({ token }: { token: string }) {
  useEffect(() => {
    void markGuestOpened(token);
  }, [token]);
  return null;
}
