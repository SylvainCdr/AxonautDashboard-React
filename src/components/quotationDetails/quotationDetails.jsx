import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchContractById } from "../../services/api/contracts";
import { DotLoader } from "react-spinners";
import styles from "./style.module.scss";
import GaugeChart from "react-gauge-chart";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { getUserByUid } from "../../utils/getUserByUid";

export default function QuotationDetails() {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState({});
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false); // Vérification de duplication
  const [showDetails, setShowDetails] = useState(false); // Toggle des détails
  const [duplicateQuotationId, setDuplicateQuotationId] = useState(null);
  const [realCostTotal, setRealCostTotal] = useState(0);
  const [realMarginPercent, setRealMarginPercent] = useState(0);
  const [realMarginValue, setRealMarginValue] = useState(0);
  const [establishedBy, setEstablishedBy] = useState("");
  const [userStudy, setUserStudy] = useState({});
  const [establishedDate, setEstablishedDate] = useState("");

  const [contract, setContract] = useState({});
  const [deliveredLines, setDeliveredLines] = useState({});
  const [deliveryInfoLines, setDeliveryInfoLines] = useState({});

  const navigate = useNavigate();

  //Fonction pour vérifier si le devis a été dupliqué
  const checkDuplicateQuotation = async () => {
    try {
      const duplicateQuotationQuery = query(
        collection(db, "supplyStudy"),
        where("quotation_id", "==", quotationId)
      );

      const querySnapshot = await getDocs(duplicateQuotationQuery);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setIsDuplicate(true);
        setDuplicateQuotationId(doc.id);

        const data = doc.data();
        setRealCostTotal(data.real_cost_total);
        setRealMarginPercent(data.real_margin_percent);
        setRealMarginValue(data.real_margin_value);
        setEstablishedBy(data.established_by);

        // Récupérer les informations complètes de l'utilisateur
        const userData = await getUserByUid(data.established_by);
        setUserStudy(userData);
        setEstablishedDate(data.established_date);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du devis dupliqué :",
        error
      );
    }
  };

  // Fonction pour dupliquer le devis
  const duplicateQuotation = async () => {
    try {
      // Utiliser le même ID que le devis original pour le nouvel objet
      const docRef = doc(db, "supplyStudy", quotationId.toString());

      await setDoc(docRef, {
        ...quotation,
        quotation_id: quotationId,
      });

      console.log("Document dupliqué avec succès avec l'ID :", quotationId);
      setIsDuplicate(true);
      setDuplicateQuotationId(quotationId);

      // Naviguer automatiquement après duplication
      navigate(`/supply-study/${quotationId}`);
    } catch (e) {
      console.error("Erreur lors de la duplication du document :", e);
    }
  };

  // Récupère les lignes livrées au chargement
  const fetchDeliveredLines = async () => {
    const docRef = doc(db, "addInfosQuotation", quotationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const lines = data.lines || {};

      const deliveredData = {};
      const deliveryInfoData = {};

      Object.entries(lines).forEach(([lineId, lineData]) => {
        deliveredData[lineId] = lineData.delivered;
        deliveryInfoData[lineId] = lineData.deliveryInfo;
      });

      setDeliveredLines(deliveredData);
      setDeliveryInfoLines(deliveryInfoData);
    }
  };

  // Met à jour Firestore et le state local
  const handleDeliveryToggle = async (
    lineKey,
    newDelivered,
    newDeliveryInfo
  ) => {
    const docRef = doc(db, "addInfosQuotation", quotationId);

    await setDoc(
      docRef,
      {
        quotation_id: quotationId,
        lines: {
          [lineKey]: {
            delivered: newDelivered,
            deliveryInfo: newDeliveryInfo,
          },
        },
      },
      { merge: true }
    );

    setDeliveredLines((prev) => ({
      ...prev,
      [lineKey]: newDelivered,
    }));

    setDeliveryInfoLines((prev) => ({
      ...prev,
      [lineKey]: newDeliveryInfo,
    }));
  };

  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleDeliveryInfoChange = (lineId, newDeliveryInfo) => {
    // Mise à jour immédiate du state local pour avoir un affichage réactif
    setDeliveryInfoLines((prev) => ({
      ...prev,
      [lineId]: newDeliveryInfo,
    }));

    // On nettoie le précédent timer si l'utilisateur tape encore
    if (typingTimeout) clearTimeout(typingTimeout);

    // On crée un nouveau timer qui déclenchera la sauvegarde 500ms après la dernière frappe
    setTypingTimeout(
      setTimeout(() => {
        // On envoie la mise à jour en BDD, en gardant la valeur de "delivered" actuelle (ou false)
        handleDeliveryToggle(
          lineId,
          deliveredLines[lineId] || false,
          newDeliveryInfo
        );
      }, 500)
    );
  };

  useEffect(() => {
    const loadQuotationData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotationById(quotationId);
        const companyData = await fetchCompanyById(data.company_id);
        const contractData = await fetchContractById(data.contract_id);

        setQuotation(data);
        setCompany(companyData);
        setContract(contractData);
        await checkDuplicateQuotation(); // Vérifie la duplication
        await fetchDeliveredLines(); // Récupère les lignes livrées
      } catch (err) {
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);

  console.log("contract from quotationDetails", contract);

  const gaugeStyle = {
    width: 250,
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <DotLoader color="#C60F7B" loading={loading} size={60} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.quotationContainer}>
      <h1>Détails de la commande - {quotation.number}</h1>

      {/* // ici un badge si le contract.end_date est différent de null */}
      {contract.end_date && (
        <div className={styles.badgeClosed}>
          <p>
            <i class="fa-solid fa-square-check"></i> Affaire cloturée sur
            Axonaut le {contract.end_date}
          </p>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.section1}>
          <div className={styles.section1Header}>
            <img
              src="https://img.icons8.com/?size=100&id=110478&format=png&color=000000"
              alt="company illustration"
            />
          </div>

          <div className={styles.section1Content}>
            <p>
              <strong>Titre :</strong> {decodeHtmlEntities(quotation.title)}
            </p>
            <p>
              <strong>Entreprise :</strong> {quotation.company_name}
            </p>
            <p>
              <strong>Date :</strong>{" "}
              {new Date(quotation.date).toLocaleDateString()}
            </p>

            <p>
              <strong>Commercial :</strong>{" "}
              {company.business_manager?.name || "Inconnu"}
            </p>

            <p>
              <strong>Commentaire(s):</strong> {quotation.comments}
            </p>
            <p>
              <strong>Montant total HT:</strong> {quotation.pre_tax_amount}€
            </p>

            <p>
              <strong> Remise :</strong> {quotation.global_discount_amount} €
            </p>
          </div>
        </div>
        <div className={styles.section2}>
          <div className={styles.gauge}>
            <h3>Marge commerciale </h3>
            <p>
              <strong>Marge prévisionnelle :</strong>{" "}
              {quotation.margin.toFixed(2)} €
            </p>
            <GaugeChart
              id="margin-gauge"
              arcsLength={[0.15, 0.13, 0.27, 0.45]}
              arcWidth={0.2}
              colors={[" #F07167", "#FFBC42", "#91F5AD", "#009fe3"]}
              percent={(quotation.margin / quotation.pre_tax_amount).toFixed(3)}
              textColor="#000"
              needleColor="#4909c069"
              style={gaugeStyle}
            />
          </div>
          {/* // jauge avec les données du duplicateQuotation */}
          <h3>Marge réelle</h3>

          {isDuplicate && !isNaN(realMarginValue) && realMarginValue !== 0 ? (
            <div className={styles.gauge}>
              <p>
                <strong> Marge réelle : </strong> {realMarginValue.toFixed(2)} €
              </p>
              <GaugeChart
                id="margin-gauge"
                arcsLength={[0.15, 0.13, 0.27, 0.45]}
                arcWidth={0.3}
                colors={[" #F07167", "#FFBC42", "#91F5AD", "#009fe3"]}
                percent={(realMarginPercent / 100).toFixed(3)}
                textColor="#000"
                needleColor="#4909c069"
                style={gaugeStyle}
              />
              <p>
                Étude réalisée par <br />
                {userStudy?.email} <br />
                le {new Date(establishedDate).toLocaleDateString()}{" "}
              </p>
            </div>
          ) : (
            // Message si pas de duplicateQuotation ou si marge réelle indisponible
            <div className={styles.emptyGauge}>
              <p>Étude d'appro</p>
              <span
                role="img"
                aria-label="hourglass"
                style={{ color: "orange", marginLeft: "8px" }}
              >
                ⏳
              </span>
              <p>En attente</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.quotationLines}>
        <button
          onClick={() => setShowDetails(!showDetails)} // Toggle visibility on click
          className={styles.toggleButton}
        >
          <i className="fa-solid fa-bars"></i>
          {showDetails
            ? "  Cacher les détails du devis"
            : "  Voir les détails du devis"}
        </button>

        {showDetails && (
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Quantité</th>
                <th>Prix unit HT</th>
                <th>Montant total HT</th>
                <th>PA unit</th>
                <th>PA total</th>
                <th>Marge total</th>
                <th>Marge en %</th>
                <th>Reçu </th>
                <th>Délai</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                quotation.quotation_lines.reduce((groups, line) => {
                  const chapter = line.chapter || "Autres"; // Regrouper par `chapter`, ou "Autres" si non défini
                  if (!groups[chapter]) groups[chapter] = [];
                  groups[chapter].push(line);
                  return groups;
                }, {})
              ).map(([chapter, lines], chapterIndex) => (
                <React.Fragment key={chapterIndex}>
                  {/* Affichage du chapitre */}
                  <tr>
                    <td colSpan="11" className={styles.chapterRow}>
                      {decodeHtmlEntities(chapter)}
                    </td>
                  </tr>
                  {/* Affichage des lignes dans le chapitre */}
                  {lines.map((line, index) => {
                    const lineKey = `${chapter}-${index}`; // clé unique par chapitre + index
                    return (
                      <tr key={lineKey}>
                        <td>{line?.product_code || ""}</td>
                        <td>{line.product_name}</td>
                        <td>{line.quantity}</td>
                        <td>{line.price} €</td>
                        <td>{line.pre_tax_amount} €</td>
                        <td>{line.unit_job_costing} €</td>
                        <td>
                          {(line.unit_job_costing * line.quantity).toFixed(2)} €
                        </td>
                        <td>{line.margin.toFixed(1)} €</td>
                        <td>
                          {((line.margin / line.pre_tax_amount) * 100).toFixed(
                            1
                          )}{" "}
                          %
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={deliveredLines[lineKey] || false}
                            onChange={async (e) => {
                              const newDelivered = e.target.checked;
                              const newDeliveryInfo =
                                deliveryInfoLines[lineKey] || "";
                              await handleDeliveryToggle(
                                lineKey,
                                newDelivered,
                                newDeliveryInfo
                              );
                            }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={deliveryInfoLines[lineKey] || ""}
                            onChange={(e) =>
                              handleDeliveryInfoChange(lineKey, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        <div className={styles.totals}>
          <p>
            <strong>Montant total HT :</strong> {quotation.pre_tax_amount} €
          </p>

          <p>
            <strong>Remise HT :</strong> {quotation.global_discount_amount} €
          </p>

          <p>
            <strong>Marge totale :</strong> {quotation.margin.toFixed(2)} €
          </p>
          <p>
            <strong>Marge % :</strong>{" "}
            {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(1)} %
          </p>

          {/* <p>
            <strong>Cout total des prestations :</strong> {totalPixProductCode}{" "}
            €
          </p> */}
        </div>
      </div>

      <div className={styles.footer}>
        <a
          href={quotation.public_path}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans Axonaut
        </a>

        {!isDuplicate ? (
          <button onClick={duplicateQuotation} className={styles.button}>
            Réaliser l'étude d'appro
          </button>
        ) : (
          <button
            onClick={() => navigate(`/supply-study/${duplicateQuotationId}`)}
            className={styles.button}
          >
            Voir l'étude d'appro
          </button>
        )}
      </div>
    </div>
  );
}
