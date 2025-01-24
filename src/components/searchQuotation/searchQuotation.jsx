import React, { useState } from "react";
import { fetchQuotations } from "../../services/api/quotations";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

export default function SearchQuotation() {
  const [quotations, setQuotations] = useState([]); // Projets récupérés après recherche
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState(""); // Garde la recherche soumise
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // Nombre de projets par page
  const navigate = useNavigate(); // Hook pour la navigation

  const handleSearchSubmit = async () => {
    if (!search.trim()) return; // Ne rien faire si le champ est vide
    setLoading(true);
    setError(null);
    setSubmittedSearch(search); // Enregistre la recherche effectuée
    try {
      const data = await fetchQuotations(); // Charger tous les projets
      const lowerSearch = search.toLowerCase();
      const filtered = data.filter(
        (quotation) =>
          quotation.title.toLowerCase().includes(lowerSearch) ||
          quotation.company_name.toLowerCase().includes(lowerSearch)
      );
      setQuotations(filtered);
      setPage(1); // Réinitialiser la pagination
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

  const handlePageChange = (direction) => {
    setPage((prevPage) => Math.max(1, prevPage + direction)); // Pagination (1 minimum)
  };

  const paginatedQuotations = quotations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleQuotationClick = (quotationId, projectId) => {
    // Naviguer vers le chemin incluant `quotationId` et `projectId`
    navigate(`/quotations/${quotationId}/project/${projectId}`);
  };

  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

  return (
    <div className={styles.searchProjectContainer}>
      <div className={styles.searchBar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress} // Recherche au clavier (Enter)
          placeholder="Entreprise ou numéro du devis"
        />
        <button onClick={handleSearchSubmit}>Rechercher</button>
      </div>

      {error && <p>Erreur : {error}</p>}

      {/* {!submittedSearch && !loading && <p>Veuillez entrer un terme de recherche.</p>} */}

      <div className={styles.searchResults}>
        {paginatedQuotations.length > 0
          ? paginatedQuotations.map((quotation) => (
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
                      <td>
                        <span style={{ color: statusColor(quotation.status) }}>
                          {quotation.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          : submittedSearch &&
            !loading && <p>Aucun projet trouvé pour "{submittedSearch}".</p>}
      </div>

      {quotations.length > itemsPerPage && (
        <div>
          <button onClick={() => handlePageChange(-1)} disabled={page <= 1}>
            Page précédente
          </button>
          <button
            onClick={() => handlePageChange(1)}
            disabled={page * itemsPerPage >= quotations.length}
          >
            Page suivante
          </button>
        </div>
      )}
    </div>
  );
}
