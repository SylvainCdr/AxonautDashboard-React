import { useState } from "react";
import { searchQuotationByNumber } from "../../services/api/quotations";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

export default function SearchQuotationV2() {
  // const [quotation, setQuotation] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [quotation, setQuotation] = useState({});
  const navigate = useNavigate();

  const handleSearchSubmit = async () => {
    if (!search.trim()) return; // Ne rien faire si le champ est vide
    setLoading(true);
    setError(null);
    try {
      const data = await searchQuotationByNumber(search); // Charger tous les projets
      setQuotation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <BarLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des résultats...</p>
      </div>
    );
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleQuotationClick = (quotationId, projectId) => {
    // Naviguer vers le chemin incluant `quotationId` et `projectId`
    navigate(`/quotations/${quotationId}/project/${projectId}`);
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Numéro de devis"
      />
      <button onClick={handleSearchSubmit}>Rechercher</button>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.searchResults}>
        {quotation.id ? (
          <div
            key={quotation.id}
            onClick={() =>
              handleQuotationClick(quotation.id, quotation.project_id)
            }
            className={styles.projectRow}
          >
            <table>
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Nom</th>
                  <th>Client</th>
                  <th>Date de début</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{quotation.number}</td>
                  <td>{quotation.title}</td>
                  <td>{quotation.company_name}</td>
                  <td>{new Date(quotation.date).toLocaleDateString()}</td>
                  <td>{quotation.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p>Aucun devis trouvé</p>
        )}
      </div>
    </div>
  );
}
