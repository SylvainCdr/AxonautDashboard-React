// export const fetchExpensesByProject = async (estimatedStart, estimatedEnd, page = 1) => {
//     const response = await fetch(
//       `http://localhost:3001/expensesByProject?estimatedStart=${encodeURIComponent(
//         estimatedStart
//       )}&estimatedEnd=${encodeURIComponent(estimatedEnd)}&page=${page}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
    
//     if (!response.ok) {
//       throw new Error("Erreur lors de la récupération des dépenses.");
//     }
    
//     // return response.json();
//     return response.json().then((data) => data.expenses);

//   };
  

export const fetchExpensesByProject = async (estimatedStart, estimatedEnd, page = 1) => {
  const response = await fetch(
    `http://localhost:3001/expensesByProject?estimatedStart=${encodeURIComponent(
      estimatedStart
    )}&estimatedEnd=${encodeURIComponent(estimatedEnd)}&page=${page}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des dépenses.");
  }

  const data = await response.json();
  if (!Array.isArray(data.expenses)) {
    throw new Error("Format inattendu des données des dépenses.");
  }

  return data.expenses;
};
