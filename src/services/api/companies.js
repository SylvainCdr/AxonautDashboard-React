import { BASE_URL } from "../../url";

export const fetchCompanies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/companies?page=${page}&per_page=10`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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

export const fetchCompanyById = async (companyId) => {
  const response = await fetch(`${BASE_URL}/companies/${companyId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }); // Assurez-vous que l'API backend fonctionne correctement
  if (!response.ok) {
    throw new Error(
      "Erreur lors de la récupération des données de l'entreprise"
    );
  }
  return response.json();
};

export const fetchQuotationsByCompanyId = async (companyId) => {
  const response = await fetch(`${BASE_URL}/quotations/company/${companyId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }); // Assurez-vous que l'API backend fonctionne correctement
  if (!response.ok) {
    throw new Error(
      "Erreur lors de la récupération des données de l'entreprise"
    );
  }
  return response.json();
};

export const fetchInvoicesByCompanyId = async (companyId) => {
  const response = await fetch(`${BASE_URL}/companies/${companyId}/invoices`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }); // Assurez-vous que l'API backend fonctionne correctement
  if (!response.ok) {
    throw new Error(
      "Erreur lors de la récupération des données de l'entreprise"
    );
  }
  return response.json();
};

// router.get("/suppliers", getAllSuppliers);
export const fetchSuppliers = async () => {
  const response = await fetch(`${BASE_URL}/suppliers`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }); // Assurez-vous que l'API backend fonctionne correctement
  if (!response.ok) {
    throw new Error(
      "Erreur lors de la récupération des données de l'entreprise"
    );
  }
  return response.json();
};
