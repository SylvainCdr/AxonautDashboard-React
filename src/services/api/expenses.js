// export const fetchExpensesByProject = async (startDate, endDate) => {
//   try {
//     if (!startDate || !endDate) {
//       throw new Error("Les paramètres 'startDate' et 'endDate' sont requis.");
//     }

//     const url = `http://localhost:3001/expensesByProject?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
//       endDate
//     )}`;

//     const response = await fetch(url, {
//       method: "GET",
//       headers: { "Content-Type": "application/json" },
//     });

//     if (!response.ok) {
//       throw new Error(`Erreur lors de la récupération des dépenses : ${response.statusText}`);
//     }

//     const data = await response.json();
//     console.log('Données récupérées de l\'API Axonaut:', data);
//     return data.expenses || [];
//   } catch (error) {
//     console.error("Erreur dans fetchExpensesByProject :", error.message);
//     throw error;
//   }
// };


export const fetchExpensesByProject = async (startDate, endDate, projectId) => {
  try {
    if (!startDate || !endDate || !projectId) {
      throw new Error("Les paramètres 'startDate', 'endDate', et 'projectId' sont requis.");
    }

    const url = `http://localhost:3001/expensesByProject?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
      endDate
    )}&projectId=${encodeURIComponent(projectId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération des dépenses : ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Dépenses filtrées :", data);
    return data.expenses || [];
  } catch (error) {
    console.error("Erreur dans fetchExpensesByProject :", error.message);
    throw error;
  }
};
