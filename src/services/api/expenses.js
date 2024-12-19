


export const fetchExpensesByProject = async (projectId) => {
  if (!projectId) throw new Error("Le paramètre 'projectId' est requis.");

  const url = `http://localhost:3001/expensesByProject?project_id=${encodeURIComponent(projectId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des dépenses : ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.expenses)) {
    throw new Error("Format inattendu des données des dépenses.");
  }

  return data.expenses;
};

