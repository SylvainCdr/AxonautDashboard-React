import { BASE_URL } from "../../url";

export const fetchInvoiceById = async (invoiceId) => {
  const response = await fetch(`${BASE_URL}/invoices/${invoiceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données du projet");
  }
  return response.json();
};
