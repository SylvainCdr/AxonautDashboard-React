export const fetchExpensesByProject = async (estimatedStart, estimatedEnd, page = 1) => {
    const response = await fetch(
      `http://localhost:3001/expensesByProject?estimatedStart=${encodeURIComponent(
        estimatedStart
      )}&estimatedEnd=${encodeURIComponent(estimatedEnd)}&page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des dépenses.");
    }
    
    return response.json();
  };
  