import styles from "./style.module.scss";
import { fetchContracts } from "../../services/api/contracts";
import { fetchAxonautUsers } from "../../services/api/employees";
import { fetchInvoiceById } from "../../services/api/invoices";
import { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import SearchQuotation from "../../components/searchQuotation/searchQuotation";
import { toast } from "react-toastify";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { getCachedInvoicesWithLimit } from "../../utils/getCachedInvoicesWithLimit";

export default function Contracts() {
  const [quotations, setQuotations] = useState([]);
  const [axonautUsers, setAxonautUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // pour savoir si on peut encore charger
  const [invoiceDataMap, setInvoiceDataMap] = useState({}); // pour stocker les données des factures

  const filteredQuotations = quotations.filter(
    (quotation) => quotation.isClosed === showClosed
  );

  // Mise à jour de l'état "Clôturé"
  const handleToggleClosed = async (quotationId, currentState) => {
    try {
      const quotationRef = doc(
        db,
        "isClosedQuotations",
        quotationId.toString()
      );
      await setDoc(quotationRef, { isClosed: !currentState });
      // alert
      toast.success(
        `La commande ${quotationId} a été ${
          !currentState ? "clôturée" : "réouverte"
        } avec succès.`
      );
      // Mise à jour de l'état dans le tableau

      setQuotations((prev) =>
        prev.map((quotation) =>
          quotation.id === quotationId
            ? { ...quotation, isClosed: !currentState }
            : quotation
        )
      );
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      alert("Erreur lors de la mise à jour de la quotation.");
    }
  };

  // Vérification de l'état "Clôturé" en base de données
  const fetchClosedStatus = async (quotationId) => {
    const docRef = doc(db, "isClosedQuotations", quotationId.toString());
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data().isClosed : false;
  };

  // Chargement des états "Clôturé" et des marges réelles pour chaque devis
  const loadQuotationData = async (quotationsList) => {
    const updatedQuotations = await Promise.all(
      quotationsList.map(async (quotation) => {
        const isClosed = await fetchClosedStatus(quotation.quotation?.id);
        const { realMarginPercent, supplyStudyFinished } =
          await fetchRealMarginPercent(quotation.quotation?.id);

        const billingPlanRef = doc(
          db,
          "billingPlans",
          quotation.quotation?.id.toString()
        );
        const billingPlanSnap = await getDoc(billingPlanRef);
        const hasBillingPlan = billingPlanSnap.exists();

        return {
          ...quotation,
          isClosed,
          realMarginPercent,
          supplyStudyFinished,
          hasBillingPlan,
        };
      })
    );

    updatedQuotations.sort((a, b) => {
      const dateA = a.date_customer_answer
        ? new Date(a.date_customer_answer)
        : new Date(0);
      const dateB = b.date_customer_answer
        ? new Date(b.date_customer_answer)
        : new Date(0);
      return dateB - dateA;
    });

    return updatedQuotations; // ✅ indispensable
  };

  // Chargement des devis avec les données supplémentaires

  useEffect(() => {
    const loadQuotationsData = async () => {
      if (page !== 1) return;

      try {
        setLoading(true);
        const data = await fetchContracts(1);
        const enriched = await loadQuotationData(data);
        setQuotations(enriched); // ✅ initialise

        // ✅ Lance le chargement des factures en parallèle
        const allInvoiceIds = enriched
          .flatMap((q) => q.invoices_id || [])
          .filter(Boolean);
        const uniqueIds = [...new Set(allInvoiceIds)];
        const cachedInvoices = await getCachedInvoicesWithLimit(uniqueIds, 20);
        setInvoiceDataMap(cachedInvoices);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuotationsData();
  }, [page]);

  console.log("contracts :", quotations);

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

  // Optimisation de la fonction pour récupérer le nom de l'utilisateur en charge
  const getQuotationUser = (quotation) => {
    const axonautUser = axonautUsers.find(
      (user) => parseInt(user.id) === parseInt(quotation.user_id)
    );
    return axonautUser
      ? `${axonautUser.firstname} ${axonautUser.lastname}`
      : "Inconnu";
  };

  // Chargement des données des employés
  useEffect(() => {
    const loadAxonautUsersData = async () => {
      try {
        const data = await fetchAxonautUsers();
        setAxonautUsers(data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des données des employés :",
          err
        );
      }
    };
    loadAxonautUsersData();
  }, []);

  const hasPixProductCode = (quotation) =>
    quotation.quotation_lines?.some((line) =>
      line.product_code?.startsWith("Pix_")
    );

  const loadMoreContracts = async () => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    const nextPage = page + 1;

    try {
      const newData = await fetchContracts(nextPage);
      if (!newData || newData.length === 0) {
        setHasMore(false);
        return;
      }

      const newEnriched = await loadQuotationData(newData);

      setQuotations((prev) => [...prev, ...newEnriched]); // ✅ concatène

      // ✅ charge les factures associées aux nouveaux devis
      const newInvoiceIds = newEnriched
        .flatMap((q) => q.invoices_id || [])
        .filter(Boolean);
      const uniqueIds = [...new Set(newInvoiceIds)];
      const cachedInvoices = await getCachedInvoicesWithLimit(uniqueIds, 20);

      setInvoiceDataMap((prev) => ({
        ...prev,
        ...cachedInvoices, // ajoute au map existant
      }));

      setPage(nextPage);
    } catch (err) {
      console.error("Erreur lors du scroll:", err);
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 300 &&
        !isFetchingMore &&
        hasMore
      ) {
        loadMoreContracts();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFetchingMore, hasMore, page]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#C60F7B" loading={loading} size={15} />
        <p>Chargement des commandes...</p>
      </div>
    );
  }

  if (error) return <p>Erreur : {error}</p>;

  return (
    <div className={styles.contractsContainer}>
      <h1>
        {" "}
        <i class="fas fa-list"></i> Liste des Commandes & Projets
      </h1>

      <div className={styles.filterContainer}>
        <button
          className={`${styles.toggleButton} ${
            !showClosed ? styles.activeButton : ""
          }`}
          onClick={() => setShowClosed(false)}
        >
          En cours
        </button>
        <button
          className={`${styles.toggleButton} ${
            showClosed ? styles.activeButton : ""
          }`}
          onClick={() => setShowClosed(true)}
        >
          Clôturés
        </button>
      </div>

      {/* <SearchQuotationsV2 /> */}
      <SearchQuotation cachedQuotations={quotations} />

      <table className={styles.quotationTable}>
        <thead>
          <tr>
            {/* <th>ID</th> */}
            {/* <th>N°</th> */}
            <th>Titre</th>
            <th>Client</th>
            <th>Commercial(e)</th>
            <th>Date</th>
            {/* <th>Statut</th> */}
            <th>Montant HT</th>
            {/* <th>Montant TTC</th> */}
            {/* <th>Marge co (€)</th>
            <th>Marge co (%)</th> */}
            <th>Marge réelle (%) </th>
            <th>Montant facturé</th>
            <th>Factu</th>
            {/* <th>Détails</th> */}
            <th>Fermer</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuotations.map((quotation) => {
            // Vérifier si end_date existe et n'est pas null
            const hasEndDate =
              quotation.end_date && quotation.end_date !== null;

            return (
              <tr
                key={`${quotation.id}-${quotation.quotation?.id}`}
                style={{
                  backgroundColor: hasEndDate
                    ? "#ff7070" // Fond rouge si end_date est présent
                    : hasPixProductCode(quotation)
                    ? "#F8F0FB" // Jaune clair pour les devis contenant "Pix_"
                    : "white", // Blanc pour les autres
                }}
              >
                <td className={styles.actionCell}>
                  <a
                    onClick={() => {
                      window.open(
                        `/quotations/${quotation.quotation?.id}/project/${quotation.project?.id}`
                      );
                    }}
                  >
                    <i className="fa-regular fa-folder-open"></i>{" "}
                    {decodeHtmlEntities(quotation.name.slice(0, 80))}
                  </a>
                </td>

                <td>{quotation.company?.name || "Inconnue"}</td>
                <td>{getQuotationUser(quotation).split(" ")[0]}</td>
                <td>
                  {new Date(quotation.last_update_date).toLocaleDateString()}
                </td>

                <td>{quotation.quotation?.pre_tax_amount.toFixed(2)} €</td>

                {/* Affichage de la marge réelle */}
                <td>
                  {quotation.realMarginPercent === null ? (
                    <span
                      role="img"
                      aria-label="cross mark"
                      style={{ color: "red", marginLeft: "25px" }}
                    >
                      ❌
                    </span>
                  ) : (
                    <span style={{ color: "black" }}>
                      {quotation.supplyStudyFinished ? (
                        <span
                          role="img"
                          aria-label="check mark"
                          style={{ color: "green", marginLeft: "8px" }}
                        >
                          ✅
                        </span>
                      ) : (
                        <span
                          role="img"
                          aria-label="hourglass"
                          style={{ color: "orange", marginLeft: "8px" }}
                        >
                          ⏳
                        </span>
                      )}
                      {quotation.realMarginPercent.toFixed(1)}%
                    </span>
                  )}
                </td>

                {/* Factures */}
                {/* <td>
                  {quotation.invoices_id && quotation.invoices_id.length > 0 ? (
                    quotation.invoices_id.map((invoiceId) => (
                      <a
                        key={invoiceId}
                        onClick={() =>
                          window.open(`/invoices/${invoiceId}`, "_blank")
                        }
                        className={styles.invoiceButton}
                      >
                        <i className="fas fa-file-invoice"></i> N° {invoiceId}
                      </a>
                    ))
                  ) : (
                    <span style={{ color: "#888" }}>–</span>
                  )}
                </td> */}
                <td>
                  {quotation.invoices_id && quotation.invoices_id.length > 0 ? (
                    (() => {
                      const total = quotation.invoices_id.reduce(
                        (acc, invoiceId) => {
                          const invoice =
                            invoiceDataMap?.[invoiceId.toString()];
                          return acc + (invoice?.preTaxAmount || 0);
                        },
                        0
                      );

                      const formattedTotal = total.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      });

                      // Optionnel : couleur en fonction du signe
                      const color = total >= 0 ? "#006400" : "#C60F7B"; // vert ou rose

                      return <span style={{ color }}>{formattedTotal}</span>;
                    })()
                  ) : (
                    <span style={{ color: "#888" }}>–</span>
                  )}
                </td>

                {/* Plan de facturation */}
                <td className={styles.actionCell}>
                  {quotation.hasBillingPlan ? (
                    <button
                      onClick={() =>
                        window.open(
                          `/quotation/${quotation.quotation?.id}/billing-plan`,
                          "_blank"
                        )
                      }
                    >
                      Factu
                    </button>
                  ) : (
                    <span style={{ color: "#888" }}>–</span>
                  )}
                </td>

                {/* Checkbox de clôture */}
                <td>
                  <input
                    type="checkbox"
                    className={styles.formCheckInput}
                    checked={quotation.isClosed || false}
                    onChange={() =>
                      handleToggleClosed(quotation.id, quotation.isClosed)
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer className={styles.footer}>
        {isFetchingMore && (
          <div style={{ textAlign: "center", margin: "2rem 0" }}>
            <GridLoader color="#C60F7B" size={10} />
            <p style={{ marginTop: "0.5rem" }}>
              Chargement de plus de contrats...
            </p>
          </div>
        )}

        {!isFetchingMore && !hasMore && (
          <p style={{ textAlign: "center", margin: "2rem 0", color: "#888" }}>
            Tous les contrats sont chargés.
          </p>
        )}
      </footer>
    </div>
  );
}
