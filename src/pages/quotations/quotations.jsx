import styles from "./style.module.scss";
import { fetchQuotations } from "../../services/api/quotations";
import { fetchAxonautUsers } from "../../services/api/employees";
import React, { useEffect, useState } from "react";
import { GridLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import SearchQuotations from "../../components/searchQuotations/searchQuotations";

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [axonautUsers, setAxonautUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  

  const navigate = useNavigate();

  // Fonction pour naviguer vers les détails du projet
  const handleClickProject = (quotationId, projectId) => {
    navigate(`/quotations/${quotationId}/project/${projectId}`);
  };

  // Mise à jour de l'état "Clôturé"
  const handleToggleClosed = async (quotationId, currentState) => {
    try {
      const quotationRef = doc(
        db,
        "isClosedQuotations",
        quotationId.toString()
      );
      await setDoc(quotationRef, { isClosed: !currentState });

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
        // Vérifie si le devis est marqué comme "Clôturé"
        const isClosed = await fetchClosedStatus(quotation.id);

        // Vérifie s'il existe une marge réelle dans supplyStudy
        const realMarginPercent = await fetchRealMarginPercent(quotation.id);

        return { ...quotation, isClosed, realMarginPercent };
      })
    );
    setQuotations(updatedQuotations);
  };

  // Chargement des devis avec les données supplémentaires
  useEffect(() => {
    const loadQuotationsData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotations(page);
        const limitedData = data.slice(0, 500); // On limite à 500 éléments

        // Charge les données supplémentaires (Clôturé et Marges réelles)
        await loadQuotationData(limitedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadQuotationsData();
  }, [page]);

  console.log(quotations);

  // Fonction pour récupérer la marge réelle depuis supplyStudy
  const fetchRealMarginPercent = async (quotationId) => {
    try {
      const docRef = doc(db, "supplyStudy", quotationId.toString());
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        return snapshot.data().real_margin_percent || 0; // Retourne la marge réelle si elle existe
      }
      return 0; // Retourne 0 si aucune donnée n'est trouvée
    } catch (err) {
      console.error(
        `Erreur lors de la récupération de la marge réelle pour ${quotationId}:`,
        err
      );
      return 0; // Retourne 0 en cas d'erreur
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

  const decodeHtmlEntities = (text) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return doc.documentElement.textContent;
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des devis...</p>
      </div>
    );
  }

  if (error) return <p>Erreur : {error}</p>;



  return (
    <div className={styles.quotationsContainer}>
      <h1>Gestion des Devis & Projets</h1>

      <SearchQuotations />

      <table className={styles.quotationTable}>
        <thead>
          <tr>
            {/* <th>ID</th> */}
            <th>Numéro</th>
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
            <th>Clôturé</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {quotations.map((quotation) => (
            <tr
              key={quotation.id}
              style={{
                backgroundColor: hasPixProductCode(quotation)
                  ? "#fff3cd" // Jaune clair pour les devis contenant "Pix_"
                  : "white", // Blanc pour les autres
              }}
            >
              {/* <td>{quotation.id}</td> */}
              <td>{quotation.number}</td>
              <td>{decodeHtmlEntities(quotation.title)}</td>
              <td>{quotation.company_name || "Inconnue"}</td>
              <td>{getQuotationUser(quotation)}</td>
              <td>{new Date(quotation.date).toLocaleDateString()}</td>

              <td>{quotation.pre_tax_amount.toFixed(2)} €</td>
              {/* <td>{quotation.total_amount.toFixed(2)} €</td> */}
              <td>{quotation.margin.toFixed(2)} €</td>
              {/* <td>
                {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(
                  2
                )}{" "}
                %
              </td> */}
              {/* // marge en % , si en dessous de 15 alors rouge, si en dessous de 29 alors orange et au dessus de 30 alors vert  */}
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
                {quotation.realMarginPercent == 0 ? (
                  <span role="img" aria-label="cross mark">
                    ❌
                  </span>
                ) : quotation.realMarginPercent < 15 ? (
                  <span style={{ color: "red" }}>
                    {quotation.realMarginPercent.toFixed(1)} %
                  </span>
                ) : quotation.realMarginPercent < 28 ? (
                  <span style={{ color: "orange" }}>
                    {quotation.realMarginPercent.toFixed(1)} %
                  </span>
                ) : (
                  <span style={{ color: "green" }}>
                    {quotation.realMarginPercent.toFixed(1)} %
                  </span>
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
