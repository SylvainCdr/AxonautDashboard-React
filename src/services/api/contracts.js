export const fetchContractById = async (contractId) => {
  const response = await fetch(
    `http://localhost:3001/contracts/${contractId}`,
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

export const fetchSupplierContractsByProjectTitle = async (projectTitle) => {
  if (!projectTitle) {
    throw new Error("Le titre du projet est requis.");
  }
  console.log ("fetchSupplierContractsByProjectTitle", projectTitle);

  try {
    const encodedTitle = encodeURIComponent(projectTitle.trim());
    const response = await fetch(
      `http://localhost:3001/supplier-contracts/${encodedTitle}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`Erreur HTTP (${response.status}): ${errorDetails}`);
    }

    return response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des Supplier Contracts :", error.message);
    throw error;
  }
};



