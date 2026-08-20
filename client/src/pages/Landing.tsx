import { lazy, Suspense } from "react";
import { AppHomeScreen } from "../components/AppHomeScreen";
import { useIsAppHome } from "../lib/native";

const MarketingLanding = lazy(() => import("./MarketingLanding"));

export default function Landing() {
  const appHome = useIsAppHome();
  if (appHome) return <AppHomeScreen />;
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
      <MarketingLanding />
    </Suspense>
  );
}
