import styles from "./style.module.scss";
import { fetchQuotations } from "../../services/api/quotations";
import { fetchAxonautUsers } from "../../services/api/employees";
import { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import SearchQuotation from "../../components/searchQuotation/searchQuotation";
import { toast } from "react-toastify";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [axonautUsers, setAxonautUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showClosed, setShowClosed] = useState(false);

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
        const isClosed = await fetchClosedStatus(quotation.id);
        const { realMarginPercent, supplyStudyFinished } =
          await fetchRealMarginPercent(quotation.id);

        const billingPlanRef = doc(db, "billingPlans", quotation.id.toString());
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

    // 🔽 Tri par date_customer_answer décroissante
    updatedQuotations.sort((a, b) => {
      const dateA = a.date_customer_answer
        ? new Date(a.date_customer_answer)
        : new Date(0);
      const dateB = b.date_customer_answer
        ? new Date(b.date_customer_answer)
        : new Date(0);
      return dateB - dateA;
    });

    setQuotations(updatedQuotations);
  };

  // Chargement des devis avec les données supplémentaires
  useEffect(() => {
    const loadQuotationsData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotations(page);

        // Charge les données supplémentaires (Clôturé et Marges réelles)
        await loadQuotationData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuotationsData();
  }, [page]);


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

  // Navigation entre les pages
  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  const hasPixProductCode = (quotation) =>
    quotation.quotation_lines?.some((line) =>
      line.product_code?.startsWith("Pix_")
    );

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
    <div className={styles.quotationsContainer}>
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
          Non masquées
        </button>
        <button
          className={`${styles.toggleButton} ${
            showClosed ? styles.activeButton : ""
          }`}
          onClick={() => setShowClosed(true)}
        >
          Masquées
        </button>
      </div>

      {/* <SearchQuotationsV2 /> */}
      <SearchQuotation cachedQuotations={quotations} />

      <table className={styles.quotationTable}>
        <thead>
          <tr>
            {/* <th>ID</th> */}
            <th>N°</th>
            <th>Titre</th>
            <th>Client</th>
            <th>Commercial(e)</th>
            <th>Date</th>
            {/* <th>Statut</th> */}
            <th>Montant HT</th>
            {/* <th>Montant TTC</th> */}
            <th>Marge co (€)</th>
            <th>Marge co (%)</th>
            <th>Marge réelle (%) </th>
            <th>Factu</th>
            {/* <th>Détails</th> */}
            <th>Masquer</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuotations.map((quotation) => (
            <tr
              key={quotation.id}
              style={{
                backgroundColor: hasPixProductCode(quotation)
                  ? "#F8F0FB" // Jaune clair pour les devis contenant "Pix_"
                  : "white", // Blanc pour les autres
              }}
            >
              {/* <td>{quotation.id}</td> */}
              <td> {quotation.number}</td>

              <td>
                <a
                  onClick={() => {
                    window.open(
                      `/quotations/${quotation.id}/project/${quotation.project_id}`
                    );
                  }}
                >
                  <i class="fa-regular fa-folder-open"></i>{" "}
                  {decodeHtmlEntities(quotation.title)}
                </a>
              </td>
              <td>{quotation.company_name || "Inconnue"}</td>
              <td>{getQuotationUser(quotation).split(" ")[0]}</td>
              <td>
                {new Date(quotation.date_customer_answer).toLocaleDateString()}
              </td>

              <td>{quotation.pre_tax_amount.toFixed(2)} €</td>
              <td>{quotation.margin.toFixed(2)} €</td>
              <td>
                {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(
                  2
                ) < 15 ? (
                  <span style={{ color: "red" }}>
                    {(
                      (quotation.margin / quotation.pre_tax_amount) *
                      100
                    ).toFixed(1)}{" "}
                    %
                  </span>
                ) : (
                    (quotation.margin / quotation.pre_tax_amount) *
                    100
                  ).toFixed(1) < 28 ? (
                  <span style={{ color: "orange" }}>
                    {(
                      (quotation.margin / quotation.pre_tax_amount) *
                      100
                    ).toFixed(1)}{" "}
                    %
                  </span>
                ) : (
                  <span style={{ color: "green" }}>
                    {(
                      (quotation.margin / quotation.pre_tax_amount) *
                      100
                    ).toFixed(1)}{" "}
                    %
                  </span>
                )}
              </td>

              {/* // marge réelle */}
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
              {/* Plan de factu  */}
              <td className={styles.actionCell}>
                {quotation.hasBillingPlan ? (
                  <button
                    onClick={() =>
                      window.open(
                        `/quotation/${quotation.id}/billing-plan`,
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
