import styles from "./style.module.scss";
import { useState, useEffect } from "react";
import { fetchOpportunities } from "../../services/api/opportunities";

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOpportunities = async () => {
      setLoading(true);
      try {
        const data = await fetchOpportunities(page);
        setOpportunities((prev) => [...prev, ...data]);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des opportunités :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadOpportunities();
  }, [page]);

  console.log("Opportunités :", opportunities);

  return (
    <div className={styles.opportunitiesContainer}>
      {/* {
  "id": 3754038,
  "name": "DC5 - Ceme-SA - VID - New",
  "comments": "",
  "amount": 216000,
  "probability": 10,
  "due_date": "2025-07-31",
  "end_date": null,
  "is_win": false,
  "is_archived": false,
  "user_name": "Arnaud Robic",
  "pipe_name": "Cycle commercial",
  "pipe_step_name": "Proposition \"Devis\"",
  "custom_fields": {
    "Date de Fin estimée": "30/03/2026",
    "Plan de facturation": [
      "Avancement"
    ],
    "Type d'affaires": "Projet"
  },
  "company": {
    "id": 27820496,
    "name": "CEME SA",
    "is_supplier": false,
    "is_prospect": false,
    "is_customer": true
  },
  "employees": [
    {
      "id": 35266440,
      "name": "Saad GHALLAB",
      "email": "sghallab@ceme-sa.com",
      "cellphone_number": "06 60 04 51 89",
      "phone_number": "01 34 61 44 36"
    }
  ]
} */}
      <h1>Opportunités</h1>

      <table className={styles.opportunitiesTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Entreprise</th>
            <th> Commercial</th>
            <th> Type d'affaire </th>
            <th>Montant</th>
            <th>Probabilité</th>
            <th>Date d'échéance</th>
            <th>Étape du cycle</th>
            <th>factu prev</th>
            <th> date fin estimée</th>
            <th> is_win </th>
            <th>is_archived</th>
          </tr>
        </thead>

        <tbody>
          {opportunities.map((opportunity) => {
            const custom_fields = opportunity.custom_fields || {};
            return (
              <tr key={opportunity.id}>
                <td>{opportunity.id}</td>
                <td>{opportunity.name}</td>
                <td>{opportunity.company.name}</td>
                <td>{opportunity.user_name}</td>
                <td>{custom_fields["Type d'affaires"] || "N/A"}</td>
                <td>{opportunity.amount} €</td>
                <td>{opportunity.probability} %</td>
                <td>{new Date(opportunity.due_date).toLocaleDateString()}</td>
                <td>{opportunity.pipe_step_name}</td>
                <td>
                  {custom_fields["Plan de facturation"]
                    ? custom_fields["Plan de facturation"].join(", ")
                    : "N/A"}
                </td>
                <td>
                  {custom_fields["Date de Fin estimée"]
                    ? custom_fields["Date de Fin estimée"]
                    : "N/A"}
                </td>
                <td>{opportunity.is_win ? "Oui" : "Non"}</td>
                <td>{opportunity.is_archived ? "Oui" : "Non"}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="8">
              {loading ? (
                <p>Chargement...</p>
              ) : (
                <button onClick={() => setPage((prev) => prev + 1)}>
                  Charger plus
                </button>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
