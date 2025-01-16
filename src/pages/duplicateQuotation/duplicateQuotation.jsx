import React, { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { GridLoader } from "react-spinners";

export default function DuplicateQuotation() {
  const { duplicateQuotationId } = useParams(); // Récupère l'ID du devis depuis l'URL
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    const fetchDuplicateQuotation = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "DuplicateQuotation", duplicateQuotationId); // Vérifiez bien le nom de la collection
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setQuotation(snapshot.data()); // Charge les données du devis
        } else {
          setError("Aucun devis dupliqué trouvé pour cet ID.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération du devis dupliqué :", err);
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicateQuotation();
  }, [duplicateQuotationId]);

  console.log(quotation);

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  return (
    <div className={styles.duplicateQuotationContainer}>
      <h1>
        <i className="fa-solid fa-file-alt" style={{ color: "#4520ff", marginRight: "10px" }}></i>
        Détails du devis dupliqué - {quotation.number}
      </h1>
  
      <div className={styles.header}>
        <p>
          <strong>Numéro :</strong> {quotation.number}
        </p>
        <p>
          <strong>Titre :</strong> {quotation.title}
        </p>
        <p>
          <strong>Date :</strong> {new Date(quotation.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Montant total HT :</strong> {quotation.pre_tax_amount} €
        </p>
        <p>
          <strong>Montant total TTC :</strong> {quotation.total_amount} €
        </p>
        <p>
          <strong>Marge totale :</strong> {quotation.margin.toFixed(2)} €
        </p>
      </div>
  
      <div className={styles.lines}>
        <h2>
          <i className="fa-solid fa-list" style={{ color: "#4520ff", marginRight: "10px" }}></i>
          Lignes du devis
        </h2>
        {quotation.quotation_lines && quotation.quotation_lines.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Quantité initiale</th>
                <th>Quantité finale</th>
                <th>Prix vendu</th>
                <th>Cout de revient</th>
                <th>Total prix vendu</th>
                <th>Total cout de revient initial</th>
                <th>Marge co %</th>
                <th>Cout réel</th>
                <th>Total réel</th>
                <th>Total marge réelle %</th>
              </tr>
            </thead>
            <tbody>
              {quotation.quotation_lines.map((line, index) => (
                <tr key={index}>
                  <td>{line.product_code}</td>
                  <td>{line.product_name}</td>
                  <td>{line.quantity}</td>
                  <td style={{ color: "blue" }}>qté finale</td>
                  <td>{line.price} €</td>
                  <td>{line.unit_job_costing} €</td>
                  <td>{(line.quantity * line.price).toFixed(2)} €</td>
                  <td>{(line.quantity * line.unit_job_costing).toFixed(2)} €</td>
                  <td>
                    {(
                      ((line.quantity * line.price - line.quantity * line.unit_job_costing) /
                        (line.quantity * line.price)) *
                      100
                    ).toFixed(1)}{" "}
                    %
                  </td>
                  <td style={{ color: "blue" }}>cout réel</td>
                  <td style={{ color: "blue" }}>total réel</td>
                  <td style={{ color: "blue" }}>total marge réel</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucune ligne de devis disponible.</p>
        )}
      </div>
    </div>
  );

}
  