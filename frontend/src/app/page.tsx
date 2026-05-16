import { redirect } from "next/navigation";

/**
 * Root route — 307 redirect to the war-room demo.
 * There is no content here on purpose; the home page is the incident.
 */
export default function Page(): never {
  redirect("/incidents/demo");
}
