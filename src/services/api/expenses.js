import { BASE_URL } from "../../url";

export const fetchExpensesByProject = async (startDate, endDate, projectId) => {
  try {
    if (!startDate || !endDate || !projectId) {
      throw new Error(
        "Les paramètres 'startDate', 'endDate', et 'projectId' sont requis."
      );
    }

    const url = `${BASE_URL}/expensesByProject?startDate=${encodeURIComponent(
      startDate
    )}&endDate=${encodeURIComponent(endDate)}&projectId=${encodeURIComponent(
      projectId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la récupération des dépenses : ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Dépenses filtrées :", data);
    return data.expenses || [];
  } catch (error) {
    console.error("Erreur dans fetchExpensesByProject :", error.message);
    throw error;
  }
};

export const postExpenseReport = async (expense) => {
  try {
    const url = `${BASE_URL}/create-expense-report`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense),
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Erreur API côté backend :", errorResponse);
      throw new Error(
        `Erreur API : ${errorResponse.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur dans postExpenseReport :", error.message);
    throw error;
  }
};
