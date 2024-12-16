export const fetchInvoiceById = async (invoiceId) => {
  const response = await fetch(`http://localhost:3001/invoices/${invoiceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("Réponse API Axonaut :", response);

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données du projet");
  }
  return response.json();
};
