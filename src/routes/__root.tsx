import { Link, Outlet, createRootRoute } from "@tanstack/solid-router";

import { clientOnly } from "@solidjs/start";
import { Suspense } from "solid-js";
import { MetaProvider } from "@solidjs/meta";


const Devtools = clientOnly(() => import("../components/Devtools"));

export const Route = createRootRoute({
  component: RootComponent
});

function RootComponent() {
  return (
    <MetaProvider>
      <Suspense>
        <Outlet />
        <Devtools />
      </Suspense>
    </MetaProvider>
  );
}
