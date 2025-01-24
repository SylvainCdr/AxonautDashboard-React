import { BASE_URL } from "../../url";

export const fetchEmployees = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/employees?page=${page}`, {
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

export const fetchEmployeeById = async (employeeId) => {
  const response = await fetch(`${BASE_URL}/employees/${employeeId}`, {
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

export const fetchWorkforces = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/workforces?page=${page}`, {
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

export const fetchAxonautUsers = async () => {
  const response = await fetch(`${BASE_URL}/axonaut-users`, {
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
