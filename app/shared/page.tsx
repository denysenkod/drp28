import { Suspense } from "react";
import { SharedProfile } from "@/components/shared-profile";

export default function SharedPage() {
  return (
    <Suspense fallback={null}>
      <SharedProfile />
    </Suspense>
  );
}
