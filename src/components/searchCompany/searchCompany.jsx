import { useState } from "react";
import { searchCompanyByName } from "../../services/api/companies";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

export default function SearchCompany({ cachedCompanies = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState([]); // Stocke tous les résultats
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = async () => {
    if (!search.trim()) return; // Ne rien faire si le champ est vide
    setError(null);
    setHasSearched(true); // Marquer qu'une recherche a été effectuée

    // Normalisez la saisie de l'utilisateur
    const normalizedSearch = search.toLowerCase();

    // Étape 1 : Recherche côté client
    const clientResults = cachedCompanies.filter((company) =>
      company.name.toLowerCase().includes(normalizedSearch)
    );

    if (clientResults.length > 0) {
      setCompanies(clientResults);
      return; // Arrêter ici si des résultats sont trouvés côté client
    }

    // Étape 2 : Recherche côté serveur si aucun résultat côté client
    setLoading(true);
    try {
      const data = await searchCompanyByName(normalizedSearch);
      setCompanies(data);
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

  const handleCompanyClick = (companyId) => {
    navigate(`/companies/${companyId}`);
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
          <BarLoader color="#4520ff" loading={loading} size={15} />
          <p>Chargement des résultats...</p>
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {/* Tableau unique pour tous les résultats */}
      {companies.length > 0 ? (
        <div className={styles.resultsContainer}>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Création</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className={styles.projectRow}>
                  <td>{company.name}</td>
                  <td>
                    {company.address_street}, {company.address_city} (
                    {company.address_zip_code})
                  </td>
                  <td>
                    {new Date(company.creation_date).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleCompanyClick(company.id)}
                      className={styles.actionButton}
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        hasSearched && <p>Aucun résultat trouvé</p>
      )}
    </div>
  );
}
