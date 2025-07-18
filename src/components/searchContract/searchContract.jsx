import { useState } from "react";
import { searchContract } from "../../services/api/contracts";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SearchContract({ cachedQuotations = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [quotation, setQuotation] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [abortController, setAbortController] = useState(null);

  const handleSearchSubmit = async () => {
    if (!search.trim()) return;
    setError(null);
    setHasSearched(true);

    const normalizedSearch = search.toLowerCase().replace(/^pix/, "");

    const clientResults = cachedQuotations.filter((quotation) => {
      const normalizedQuotationNumber = quotation.name
        .toLowerCase()
        .replace(/^pix/, "");
      const normalizedQuotationName = quotation.name.toLowerCase();

      return (
        normalizedQuotationNumber === normalizedSearch ||
        normalizedQuotationName.includes(normalizedSearch)
      );
    });

    if (clientResults.length > 0) {
      const enriched = await Promise.all(clientResults.map(enrichQuotation));
      setQuotation(enriched.length === 1 ? enriched[0] : enriched);
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    try {
      const data = await searchContract(normalizedSearch, {
        signal: controller.signal,
      });

      if (data.length > 0) {
        const enriched = await Promise.all(data.map(enrichQuotation));
        setQuotation(enriched.length === 1 ? enriched[0] : enriched);
      } else {
        setQuotation(null);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const enrichQuotation = async (quotation) => {
    const quotationId =
      quotation.quotation?.id || quotation.id || quotation.quotation_id;

    if (!quotationId) {
      console.warn(
        "❌ Aucun ID de devis trouvé pour enrichissement :",
        quotation
      );
      return quotation;
    }

    const idStr = quotationId.toString();

    const [closedDoc, marginDoc, billingDoc] = await Promise.all([
      getDoc(doc(db, "isClosedQuotations", idStr)),
      getDoc(doc(db, "supplyStudy", idStr)),
      getDoc(doc(db, "billingPlans", idStr)),
    ]);

    const isClosed = closedDoc.exists() ? closedDoc.data().isClosed : false;
    const realMarginPercent = marginDoc.exists()
      ? marginDoc.data().real_margin_percent || null
      : null;
    const supplyStudyFinished = marginDoc.exists()
      ? marginDoc.data().supply_study_finished || false
      : false;
    const hasBillingPlan = billingDoc.exists();

    return {
      ...quotation,
      isClosed,
      realMarginPercent,
      supplyStudyFinished,
      hasBillingPlan,
    };
  };

  const handleCancelSearch = () => {
    if (abortController) {
      abortController.abort();
      setLoading(false);
      setHasSearched(false);
      setQuotation(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const renderResults = (data) => {
    const rows = Array.isArray(data) ? data : [data];

    return (
      <table className={styles.quotationTable}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Client</th>
            <th>Date</th>
            <th>Montant HT</th>
            <th>Marge réelle (%)</th>
            <th>Factu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id}>
              <td>
                <a
                  onClick={() =>
                    window.open(
                      `/quotations/${q.quotation?.id || q.id}/project/${
                        q.project?.id || q.project_id
                      }`
                    )
                  }
                >
                  {decodeHtmlEntities(q.name || q.title)}
                </a>
              </td>
              <td>{q.company?.name || q.company_name || "Inconnu"}</td>
              <td>
                {new Date(
                  q.last_update_date || q.date_customer_answer
                ).toLocaleDateString()}
              </td>
              <td>
                {(q.quotation?.pre_tax_amount || q.pre_tax_amount)?.toFixed(2)}{" "}
                €
              </td>
              <td>
                {q.realMarginPercent === null ? (
                  <span style={{ color: "red" }}>❌</span>
                ) : (
                  <span style={{ color: "black" }}>
                    {q.supplyStudyFinished ? (
                      <span style={{ color: "green" }}>✅</span>
                    ) : (
                      <span style={{ color: "orange" }}>⏳</span>
                    )}{" "}
                    {q.realMarginPercent.toFixed(1)}%
                  </span>
                )}
              </td>
              <td>
                {q.hasBillingPlan ? (
                  <button
                    onClick={() =>
                      window.open(
                        `/quotation/${q.quotation?.id || q.id}/billing-plan`,
                        "_blank"
                      )
                    }
                  >
                    Plan factu
                  </button>
                ) : (
                  <span style={{ color: "#888" }}>–</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="N° ou nom de l'affaire"
        />
        <button onClick={handleSearchSubmit}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {loading && (
        <div className={styles.loaderContainer}>
          <BarLoader color="#4520ff" loading={loading} size={60} />
          <p>Chargement des résultats...</p>
          <button onClick={handleCancelSearch} className={styles.cancelButton}>
            Annuler
          </button>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {hasSearched && quotation ? (
        <div className={styles.searchResults}>{renderResults(quotation)}</div>
      ) : (
        hasSearched && <p className={styles.noResults}>Aucun résultat trouvé</p>
      )}
    </div>
  );
}
