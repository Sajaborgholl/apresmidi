import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False during the server render and hydration, true once the page's
// JavaScript is running. Forms that submit through an onSubmit handler
// (rather than <form action>, which React itself holds until hydration)
// disable their submit button until this is true — otherwise a click before
// the page is interactive falls through to a plain browser submission.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
