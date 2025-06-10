import { BASE_URL } from "../../url";

export const fetchOpportunities = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/opportunities?page=${page}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ! Status : ${response.status}`);
    }

    const data = await response.json();
    return data.items || data; // Retourne les items ou les données si pas de structure paginée
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des entreprises :",
      error.message
    );
    throw error;
  }
};

// export const fetchQuotationById = async (quotationId) => {
//   const response = await fetch(`${BASE_URL}/quotations/${quotationId}`, {
//     method: "GET",
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

//   if (!response.ok) {
//     throw new Error("Erreur lors de la récupération des données du projet");
//   }
//   return response.json();
// };
