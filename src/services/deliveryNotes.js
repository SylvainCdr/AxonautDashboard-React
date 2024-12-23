// router.get("/deliveryNotesByProject", async (req, res) => {


    export const fetchDeliveryNotesByProject = async (projectId) => {
        try {
          if (!projectId) {
            throw new Error("Le paramètre 'ProjectId' est requis.");
          }
      
          const url = `http://localhost:3001/deliveryNotesByProject?projectId=${encodeURIComponent(projectId)}`;
      
          const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            
          });
      
          if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des bons de livraisons : ${response.statusText}`);
          }
      
          const data = await response.json();
          console.log("Bons de livraisons filtrées :", data);
          return data.deliveryNotes
        } catch (error) {
          console.error("Erreur dans fetchDeliveryNotesByProject :", error.message);
          throw error;
        }
      };

  