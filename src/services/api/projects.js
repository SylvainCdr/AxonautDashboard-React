
export const fetchProjects = async (page = 1) => {
    try {
      const response = await fetch(
        `http://localhost:3001/projects?page=${page}`,
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

  
  
  export const fetchProjectById = async (projectId) => {
    const response = await fetch(`http://localhost:3001/projects/${projectId}`, {
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


//   export const searchProjects = async (search = "", page = 1) => {
//   try {
//     const searchQuery = encodeURIComponent(search);

//     const response = await fetch(
//       `http://localhost:3001/projects/search?searchQuery=${searchQuery}&page=${page}`,
//       {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`Erreur HTTP ! Status : ${response.status}`);
//     }

//     return await response.json();
//   } catch (error) {
//     console.error("Erreur lors de la recherche des projets :", error.message);
//     throw error;
//   }
// };
  