import { redirect } from "next/navigation";

// Default landing: when the Vercel URL is opened, take the user straight
// into the GSI Asset Control app. Middleware will further redirect to
// /login if no session cookie is present.
export default function Home() {
  redirect("/dashboard-v2");
}
