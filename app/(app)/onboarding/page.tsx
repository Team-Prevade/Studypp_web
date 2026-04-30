import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Redirect to step 1 (perfil)
  redirect("/onboarding/perfil");
}
