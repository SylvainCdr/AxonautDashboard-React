import { useState, useEffect } from "react";
import { searchQuotationByNumber } from "../../services/api/quotations";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { toast } from "react-toastify";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SearchQuotation({ cachedQuotations = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [quotation, setQuotation] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [supplyStudy, setSupplyStudy] = useState({
    realMarginPercent: null,
    supplyStudyFinished: false,
  });
  const [abortController, setAbortController] = useState(null); // Pour gérer l'annulation de la recherche
  const navigate = useNavigate();

  const handleSearchSubmit = async () => {
    if (!search.trim()) return;
    setError(null);
    setHasSearched(true);
  
    const normalizedSearch = search.toLowerCase().replace(/^pix/, "");
  
    // Recherche côté client
    const clientResult = cachedQuotations.find((quotation) => {
      const normalizedQuotationNumber = quotation.number
        .toLowerCase()
        .replace(/^pix/, "");
      return normalizedQuotationNumber === normalizedSearch;
    });
  
    if (clientResult) {
      setQuotation(clientResult);
      return;
    }
  
    // Recherche côté serveur
    const controller = new AbortController(); // Créez un AbortController pour annuler la recherche
    setAbortController(controller); // Sauvegardez le controller dans l'état
    setLoading(true);
    try {
      const data = await searchQuotationByNumber(normalizedSearch, { signal: controller.signal });
      console.log('Search result:', data); // Ajoutez ce log pour vérifier la structure
      setQuotation(data);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Recherche annulée");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour annuler la recherche en cours
  const handleCancelSearch = () => {
    if (abortController) {
      abortController.abort(); // Annule la requête
      setLoading(false); // Arrête l'indicateur de chargement
      setHasSearched(false); // Réinitialise la recherche
      setQuotation(null); // Réinitialise le résultat de la recherche
    }
  };

  // Fonction pour récupérer la marge réelle depuis supplyStudy
  const fetchRealMarginPercent = async (quotationId) => {
    try {
      const docRef = doc(db, "supplyStudy", quotationId.toString());
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          realMarginPercent: data.real_margin_percent || null, // Null si non défini
          supplyStudyFinished: data.supply_study_finished || false, // False si non défini
        };
      }
      return { realMarginPercent: null, supplyStudyFinished: false }; // Valeurs par défaut
    } catch (err) {
      console.error(
        `Erreur lors de la récupération de la marge réelle pour ${quotationId}:`,
        err
      );
      return { realMarginPercent: null, supplyStudyFinished: false }; // Valeurs par défaut en cas d'erreur
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  useEffect(() => {
    if (quotation) {
      fetchRealMarginPercent(quotation.id).then((data) => {
        setSupplyStudy(data);
      });
    }
  }, [quotation]);
  

  const statusColor = (marginPercent) => {
    if (marginPercent < 15) return "red";
    if (marginPercent < 28) return "orange";
    return "green";
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Numéro d'affaire"
        />
        <button onClick={handleSearchSubmit}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {loading && (
        <div className={styles.loaderContainer}>
          <BarLoader color="#4520ff" loading={loading} size={15} />
          <p>Chargement des résultats...</p>
          <button onClick={handleCancelSearch} className={styles.cancelButton}>Annuler</button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {hasSearched && quotation ? (
        <div className={styles.searchResults}>
          <table className={styles.quotationTable}>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Nom</th>
                <th>Client</th>
                <th>Date</th>
                <th>Montant HT</th>
                <th>Marge co (%)</th>
                <th>Marge réelle (%)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr key={quotation.id}>
                <td>{quotation.number}</td>
                <td>{decodeHtmlEntities(quotation.title)}</td>
                <td>{quotation.company_name || "Inconnu"}</td>
                <td>{new Date(quotation.date_customer_answer).toLocaleDateString()}</td>
                <td>{quotation.pre_tax_amount.toFixed(2)} €</td>
                <td style={{ color: statusColor((quotation.margin / quotation.pre_tax_amount) * 100) }}>
                  {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(1)} %
                </td>
                <td>
                  {supplyStudy.realMarginPercent === null ? (
                    <span role="img" aria-label="cross mark" style={{ color: "red" }}>❌</span>
                  ) : (
                    <span style={{ color: "black" }}>
                      {supplyStudy.supplyStudyFinished ? (
                        <span role="img" aria-label="check mark" style={{ color: "green" }}>✅</span>
                      ) : (
                        <span role="img" aria-label="hourglass" style={{ color: "orange" }}>⏳</span>
                      )}
                      {supplyStudy.realMarginPercent.toFixed(1)}%
                    </span>
                  )}
                </td>
                <td>
                  <button
                    onClick={() =>
                      window.open(`/quotations/${quotation.id}/project/${quotation.project_id}`)
                    }
                  >
                    Voir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        hasSearched && <p className={styles.noResults}>Aucun résultat trouvé</p>
      )}
    </div>
  );
}
