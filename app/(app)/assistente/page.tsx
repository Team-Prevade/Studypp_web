import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AssistantView } from "@/components/assistant-view";

export default async function AssistentePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return <AssistantView />;
}
