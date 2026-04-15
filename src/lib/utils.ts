import { format } from "date-fns";

/**
 * Parsea una fecha en formato YYYY-MM-DD evitando el desfase de zona horaria (UTC).
 * @param dateInput - Puede ser un string "2026-04-09", un ISO string o un objeto Date.
 * @param formatStr - El formato de date-fns deseado.
 * @returns String formateado o un fallback si la fecha es inválida.
 */
export const formatDateOnly = (
  dateInput: string | Date | null | undefined,
  formatStr: string = "MMM d, yyyy"
): string => {
  if (!dateInput) return "—";

  try {
    // Si es un string, extraemos solo la parte de la fecha (YYYY-MM-DD)
    if (typeof dateInput === "string") {
      // Tomamos solo la parte de la fecha antes de la 'T' por si viene un ISO string completo
      const datePart = dateInput.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);

      // Creamos el objeto Date usando el constructor local (año, mes index-0, día)
      // Esto le dice al navegador: "Crea esta fecha en MI hora local, tal cual está escrita"
      const localDate = new Date(year, month - 1, day);
      
      return format(localDate, formatStr);
    }

    // Si ya es un objeto Date (poco probable desde Supabase, pero por seguridad)
    return format(dateInput, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};