import { useState } from "react";
import { searchCompanyByName } from "../../services/api/quotations";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { searchCompanyByName } from "../../services/api/companies";

export default function SearchQuotation({ cachedCompanies = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState({});
  const [hasSearched, setHasSearched] = useState(false); // Nouvel état pour suivre les recherches
  const navigate = useNavigate();

  const handleSearchSubmit = async () => {
    if (!search.trim()) return; // Ne rien faire si le champ est vide
    setError(null);
    setHasSearched(true); // Marquer qu'une recherche a été effectuée

    // Normalisez la saisie de l'utilisateur
    const normalizedSearch = search.toLowerCase();

    // Étape 1 : Recherche côté client
    const clientResult = cachedCompanies.find((company) => {
      const normalizedCompanyName = company.name
        .toLowerCase()
      return normalizedCompanyName === normalizedSearch;
    });

    if (clientResult) {
      setCompany(clientResult);
      return; // Arrêter ici si un résultat est trouvé côté client
    }

    // Étape 2 : Recherche côté serveur si aucun résultat côté client
    setLoading(true);
    try {
      const data = await searchCompanyByName(normalizedSearch);
      setCompany(data);
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

  const handleQuotationClick = (companyId) => {
    navigate(`/Companies/${companyId}`);
  };

  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Nom de l'entreprise"
      />
      <button onClick={handleSearchSubmit}>Rechercher</button>
      {loading && (
        <div className={styles.loaderContainer}>
          <BarLoader color="#4520ff" loading={loading} size={20} />
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
                  <th>Nom</th>
                  <th>Adresse</th>
                  <th>Code postal</th>
                  <th>Ville</th>
                  <th>Pays</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{company.name}</td>
                  <td>{company.address}</td>
                  <td>{company.zip_code}</td>
                  <td>{company.city}</td>
                  <td>{company.country}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : hasSearched ? (
          <p>Aucun résultat trouvé</p>
        ) : null}
      </div>
    </div>
  );
}

