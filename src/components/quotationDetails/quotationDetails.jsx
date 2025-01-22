import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";
import GaugeChart from "react-gauge-chart";
import { db } from "../../firebase/firebase";
import { addDoc, collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
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

  // const checkDuplicateQuotation = async () => {
  //   try {
  //     const duplicateQuotationQuery = query(
  //       collection(db, "supplyStudy"),
  //       where("quotation_id", "==", quotationId)
  //     );
  //     const duplicateQuotationSnapshot = await getDocs(duplicateQuotationQuery);

  //     if (duplicateQuotationSnapshot.size > 0) {
  //       setIsDuplicate(true);
  //       setDuplicateQuotationId(duplicateQuotationSnapshot.docs[0].id);
  //     }
  //   } catch (e) {
  //     console.error("Erreur lors de la vérification de la duplication :", e);
  //   }
  // };



  // const duplicateQuotation = async () => {
  //   try {
  //     const docRef = await addDoc(collection(db, "DuplicateQuotation"), {
  //       ...quotation,
  //       quotation_id: quotationId,
  //     });
  //     console.log("Document dupliqué avec succès avec l'ID :", docRef.id);
  //     setIsDuplicate(true);
  //     setDuplicateQuotationId(docRef.id);

  //     // Naviguer automatiquement après duplication
  //     navigate(`/duplicate-quotation/${docRef.id}`);
  //   } catch (e) {
  //     console.error("Erreur lors de la duplication du document :", e);
  //   }
  
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

        setQuotation(data);
        setCompany(companyData);
        await checkDuplicateQuotation(); // Vérifie la duplication
      } catch (err) {
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  const totalPixProductCode = quotation.quotation_lines
    .filter((line) => line.product_code.startsWith("Pix_"))
    .reduce((acc, line) => acc + line.unit_job_costing, 0);

  return (
    <div className={styles.quotationContainer}>
      <h1>Détails du devis - {quotation.number}</h1>

      <div className={styles.header}>
        <div className={styles.section1}>
          <p>
            <strong>Numéro :</strong> {quotation.number}
          </p>

          <p>
            <strong>Titre :</strong> {quotation.title}
          </p>
          <p>
            <strong>Nom de l'entreprise :</strong> {quotation.company_name}
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
            <strong>Statut :</strong>{" "}
          </p>
          <p>
            <strong>Commentaire(s):</strong> {quotation.comments}
          </p>

          <p>
            <strong> Remise :</strong> {quotation.global_discount_amount} €
          </p>
        </div>
        <div className={styles.section2}>
          <h3>
            <strong>Montant total HT:</strong> {quotation.pre_tax_amount}€
          </h3>
          <h3>
            <strong>Marge prévi :</strong> {quotation.margin.toFixed(2)} €
          </h3>
      

          <GaugeChart
            id="margin-gauge"
            nrOfLevels={6}
            colors={["#FF5F6D", "#0ef124"]}
            arcWidth={0.3}
            percent={(quotation.margin / quotation.pre_tax_amount).toFixed(3)}
            textColor="#000"
            needleColor="#4520ff"
          />

             {/* // jauge avec les données du duplicateQuotation */}
      {isDuplicate && (
        <div className={styles.realMarginIndicators}>
          <h3>Données de l'étude d'appro :</h3>
          <p>
            <strong>Coût de revient total :</strong> {realCostTotal} €
          </p>
          <p>
            <strong>Marge réelle :</strong> {realMarginValue} €
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
                  <td>{line.product_code}</td>
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

          <p>
            <strong>Cout total des prestations :</strong> {totalPixProductCode}{" "}
            €
          </p>
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
        {/* <a
          href={quotation.customer_portal_url}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans le portail client
        </a> */}
        {!isDuplicate ? (
          <button onClick={duplicateQuotation} className={styles.button}>
            Réaliser l'étude d'appro
          </button>
        ) : (
          <button
            onClick={() =>
              navigate(`/supply-study/${duplicateQuotationId}`)
            }
            className={styles.button}
          >
            Voir l'étude d'appro
          </button>
        )}
      </div>

   
    </div>
  );
}
