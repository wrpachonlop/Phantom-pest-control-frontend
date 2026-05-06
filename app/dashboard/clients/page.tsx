import { redirect } from "next/navigation";

export default function ClientsRootPage() {
  // Por defecto, enviamos al usuario a la vista residencial
  redirect("/dashboard/clients/residential");
}