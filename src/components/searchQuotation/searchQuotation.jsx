import { useState } from "react";
import { searchQuotationByNumber } from "../../services/api/quotations";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";

export default function SearchQuotation({ cachedQuotations = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [quotation, setQuotation] = useState({});
  const [hasSearched, setHasSearched] = useState(false); // Nouvel état pour suivre les recherches
  const navigate = useNavigate();

  const handleSearchSubmit = async () => {
    if (!search.trim()) return; // Ne rien faire si le champ est vide
    setError(null);
    setHasSearched(true); // Marquer qu'une recherche a été effectuée

    // Normalisez la saisie de l'utilisateur
    const normalizedSearch = search.toLowerCase().replace(/^pix/, "");

    // Étape 1 : Recherche côté client
    const clientResult = cachedQuotations.find((quotation) => {
      const normalizedQuotationNumber = quotation.number
        .toLowerCase()
        .replace(/^pix/, ""); // Normalisez le numéro des devis
      return normalizedQuotationNumber === normalizedSearch;
    });

    if (clientResult) {
      setQuotation(clientResult);
      return; // Arrêter ici si un résultat est trouvé côté client
    }

    // Étape 2 : Recherche côté serveur si aucun résultat côté client
    setLoading(true);
    try {
      const data = await searchQuotationByNumber(normalizedSearch);
      setQuotation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleQuotationClick = (quotationId, projectId) => {
    navigate(`/quotations/${quotationId}/project/${projectId}`);
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Numéro d'affaire"
      />
   
      <button onClick={handleSearchSubmit}> <i class="fas fa-search"></i></button>
      {loading && (
        <div className={styles.loaderContainer}>
          <BarLoader color="#4520ff" loading={loading} size={15} />
          <p>Chargement des résultats...</p>
        </div>
      )}
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
                  <td>{decodeHtmlEntities(quotation.title)}</td>
                  <td>{quotation.company_name}</td>
                  <td>{new Date(quotation.date).toLocaleDateString()}</td>
                  <td>{quotation.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          hasSearched && <p>Aucun résultat trouvé</p> // Afficher uniquement si une recherche a été effectuée
        )}
      </div>
    </div>
  );
}
