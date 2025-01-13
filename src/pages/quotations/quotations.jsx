import styles from "./style.module.scss";
import { fetchQuotations } from "../../services/api/quotations";
import React, { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import SearchQuotations from "../../components/searchQuotations/searchQuotations";

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const handleClickProject = (quotationId, projectId) => {
    navigate(`/quotations/${quotationId}/project/${projectId}`);
  };

  useEffect(() => {
    const loadQuotationsData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotations(page);
        const limitedData = data.slice(0, 500); // On limite à 500 éléments
        setQuotations(limitedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadQuotationsData();
  }, [page]);

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des devis...</p>
      </div>
    );
  }

  if (error) return <p>Erreur : {error}</p>;

  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

  const hasPixProductCode = (quotation) =>
    quotation.quotation_lines?.some((line) =>
      line.product_code?.startsWith("Pix_")
    );

  return (
    <div className={styles.quotationsContainer}>
      <h1>Gestion des Devis & Projets</h1>

      <SearchQuotations />

      <table className={styles.quotationTable}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Numéro</th>
            <th>Entreprise</th>
            <th>Commercial(e)</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Montant HT</th>
            <th>Montant TTC</th>
            <th>Marge (€)</th>
            <th>Marge (%)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((quotation) => (
            <tr
              key={quotation.id}
              style={{
                backgroundColor: hasPixProductCode(quotation)
                  ? "#f0e68c" // Jaune clair pour les devis contenant "Pix_"
                  : "white", // Blanc pour les autres
              }}
            >
              <td>{quotation.id}</td>
              <td>{quotation.number}</td>
              <td>{quotation.company_name || "Inconnue"}</td>
              <td>{quotation.user_id}</td>
              <td>{new Date(quotation.date).toLocaleDateString()}</td>
              <td>
                <span style={{ color: statusColor(quotation.status) }}>
                  {quotation.status}
                </span>
              </td>
              <td>{quotation.pre_tax_amount.toFixed(2)} €</td>
              <td>{quotation.total_amount.toFixed(2)} €</td>
              <td>{quotation.margin.toFixed(2)} €</td>
              <td>
                {(
                  (quotation.margin / quotation.pre_tax_amount) *
                  100
                ).toFixed(2)}{" "}
                %
              </td>
              <td className={styles.actionCell}>
                <button
                  onClick={() =>
                    handleClickProject(quotation.id, quotation.project_id)
                  }
                >
                  Voir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className={styles.footer}>
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Page précédente
        </button>
        <button onClick={handleNextPage}>Page suivante</button>
      </footer>
    </div>
  );
}
