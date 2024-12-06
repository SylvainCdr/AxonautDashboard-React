export const fetchQuotations = async (page = 1) => {
  try {
    const response = await fetch(
      `http://localhost:3001/quotations?page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Réponse API Axonaut :", response);

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

export const fetchQuotationById = async (quotationId) => {
  const response = await fetch(
    `http://localhost:3001/quotations/${quotationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  console.log("Réponse API Axonaut :", response);

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données du projet");
  }
  return response.json();
};

// router.get("/quotations/project/:projectId", getQuotationByProjectId);

export const fetchQuotationByProjectId = async (projectId) => {
  const response = await fetch(
    `http://localhost:3001/quotations/project/${projectId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données du projet");
  }
  return response.json();
};
