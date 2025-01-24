import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchContractById } from "../../services/api/contracts";
import { GridLoader } from "react-spinners";
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
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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
  const [contract, setContract] = useState({});
  const navigate = useNavigate();

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
      }
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du devis dupliqué :",
        error
      );
    }
  };

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
      } catch (err) {
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);

  console.log("contract from quotationDetails", contract);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  // const totalPixProductCode = quotation.quotation_lines
  //   .filter((line) => line.product_code.startsWith("Pix_"))
  //   .reduce((acc, line) => acc + line.unit_job_costing, 0);

  return (
    <div className={styles.quotationContainer}>
      <h1>Détails de la commande - {quotation.number}</h1>

      {/* // ici un badge si le contract.end_date est différent de null */}
      {contract.end_date && (
        <div className={styles.badge}>
          <p>Affaire cloturée le {contract.end_date} </p>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.section1}>
          <p>
            <strong>Titre :</strong> {quotation.title}
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
        <div className={styles.section2}>
          <div className={styles.gauge}>
            <h3>Marge commerciale </h3>
            <p>
              <strong>Marge prévisionnelle :</strong> {quotation.margin.toFixed(2)} €
            </p>
            <GaugeChart
              id="margin-gauge"
              nrOfLevels={6}
              colors={["#FF5F6D", "#0ef124"]}
              arcWidth={0.3}
              percent={(quotation.margin / quotation.pre_tax_amount).toFixed(3)}
              textColor="#000"
              needleColor="#4520ff"
              size={200}
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
      nrOfLevels={6}
      colors={["#FF5F6D", "#0ef124"]}
      arcWidth={0.3}
      percent={(realMarginPercent / 100).toFixed(3)}
      textColor="#000"
      needleColor="#4520ff"
    />
  </div>
) : (
  // Message si pas de duplicateQuotation ou si marge réelle indisponible
  <div className={styles.gauge}>
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
              </tr>
            </thead>
            <tbody>
              {quotation.quotation_lines.map((line) => (
                <tr key={line.id}>
                  <td>{line?.product_code || ""}</td>
                  <td>{line.product_name}</td>
                  <td>{line.quantity}</td>
                  <td>{line.price} €</td>
                  <td>{line.pre_tax_amount} €</td>
                  <td>{line.unit_job_costing} €</td>
                  <td>{line.unit_job_costing * line.quantity} €</td>
                  <td>{line.margin.toFixed(1)} €</td>
                  <td>
                    {((line.margin / line.pre_tax_amount) * 100).toFixed(1)} %
                  </td>
                </tr>
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
