

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
  