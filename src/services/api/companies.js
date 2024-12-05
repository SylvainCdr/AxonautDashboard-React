export const fetchCompanies = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:3001/companies?page=${page}&per_page=10`,
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
  
  export const fetchCompanyById = async (companyId) => {
    const response = await fetch(`http://localhost:3001/companies/${companyId}`, {
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
  