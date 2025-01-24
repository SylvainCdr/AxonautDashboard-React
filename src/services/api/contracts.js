import { BASE_URL } from "../../url";

export const fetchContractById = async (contractId) => {
  const response = await fetch(`${BASE_URL}/contracts/${contractId}`, {
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

export const fetchSupplierContractsByProjectTitle = async (
  projectTitle,
  estimatedStart
) => {
  if (!projectTitle) {
    throw new Error("Le titre du projet est requis.");
  }
  console.log(
    "fetchSupplierContractsByProjectTitle",
    projectTitle,
    estimatedStart
  );

  try {
    const encodedTitle = encodeURIComponent(projectTitle.trim());
    const queryParams = estimatedStart
      ? `?estimatedStart=${encodeURIComponent(estimatedStart)}`
      : "";
    const response = await fetch(
      `${BASE_URL}/supplier-contracts/${encodedTitle}${queryParams}`,
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
    console.error(
      "Erreur lors de la récupération des Supplier Contracts :",
      error.message
    );
    throw error;
  }
};
