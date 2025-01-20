import React, { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { GridLoader } from "react-spinners";
import { p } from "framer-motion/client";

export default function DuplicateQuotation() {
  const { duplicateQuotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // const totalLineAmountSold = (line) => line.quantity * line.price;
  const totalLineAmountReal = (line) => line.final_quantity * line.actual_cost;

  // Charge les données du devis
  useEffect(() => {
    const fetchDuplicateQuotation = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "DuplicateQuotation", duplicateQuotationId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          setQuotation(snapshot.data());
        } else {
          setError("Aucun devis dupliqué trouvé pour cet ID.");
        }
      } catch (err) {
        console.error(
          "Erreur lors de la récupération du devis dupliqué :",
          err
        );
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicateQuotation();
  }, [duplicateQuotationId]);

  // Met à jour les champs modifiables
  const handleChange = (originalIndex, field, value) => {
    const updatedLines = [...quotation.quotation_lines];
    updatedLines[originalIndex][field] = value;
    setQuotation((prev) => ({
      ...prev,
      quotation_lines: updatedLines,
    }));
  };
  

  // Ajoute une nouvelle ligne en bas du tableau
  const addNewLine = () => {
    const newLine = {
      product_code: "",
      product_name: "",
      quantity: 0,
      final_quantity: 0,
      price: 0,
      unit_job_costing: 0,
      actual_cost: 0,
    };

    setQuotation((prev) => ({
      ...prev,
      quotation_lines: [...prev.quotation_lines, newLine],
    }));
  };

  // Sauvegarde les modifications dans Firestore
  const saveChanges = async () => {
    try {
      const docRef = doc(db, "DuplicateQuotation", duplicateQuotationId);
      await updateDoc(docRef, quotation);
      alert("Devis mis à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      alert("Erreur lors de la mise à jour du devis.");
    }
  };




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
        <i
          className="fa-solid fa-file-alt"
          style={{ color: "#4520ff", marginRight: "10px" }}
        ></i>
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
          <strong>Date :</strong>{" "}
          {new Date(quotation.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Montant Commande HT :</strong> {quotation.pre_tax_amount} €
        </p>

        <p>
          <strong>Remise globale:</strong>
          {quotation.global_discount_amount} €
        </p>
        <p>
          <strong>Remise globale %:</strong>
          {((quotation.global_discount_amount / quotation.pre_tax_amount) * 100).toFixed(1)} %
        </p>



        <p>
          <strong>Marge Commande:</strong>
          {quotation.margin.toFixed(2)} €{" "}
        </p>

        <p>
          <strong>Marge Commande %:</strong>
          {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(1)} %
        </p>
      </div>

      <div className={styles.lines}>
        <h2>
          <i
            className="fa-solid fa-list"
            style={{ color: "#4520ff", marginRight: "10px" }}
          ></i>
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
                <th>Remise </th>
                <th>Total prix vendu</th>
                <th>Cout de revient initial</th>
                <th>Total cout de revient initial</th>
                <th>Marge co %</th>
                <th>Cout réel</th>
                <th>Total réel</th>
                <th>Total marge réelle %</th>
              </tr>
            </thead>
            <tbody>
  {Object.entries(
    quotation.quotation_lines.reduce((groups, line, index) => {
      const chapter = line.chapter || "Autres";
      if (!groups[chapter]) {
        groups[chapter] = [];
      }
      // Ajout de l'index d'origine
      groups[chapter].push({ ...line, originalIndex: index });
      return groups;
    }, {})
  ).map(([chapter, lines], chapterIndex) => (
    <React.Fragment key={chapterIndex}>
      {/* Ligne du chapitre */}
      <tr className={styles.chapterRow}>
        <td colSpan="13" className={styles.chapterHeader}>
          <strong>{chapter}</strong>
        </td>
      </tr>
      {/* Lignes des éléments dans le chapitre */}
      {lines.map((line, index) => {
        const discountPercentage =
          line.pre_tax_amount > 0
            ? ((line.pre_tax_amount - line.quantity * line.price) /
                line.pre_tax_amount) *
              100
            : 0;

        const commercialMargin =
          line.pre_tax_amount > 0
            ? ((line.pre_tax_amount - line.quantity * line.unit_job_costing) /
                line.pre_tax_amount) *
              100
            : 0;

        const realMargin =
          line.pre_tax_amount > 0
            ? ((line.pre_tax_amount - totalLineAmountReal(line)) /
                line.pre_tax_amount) *
              100
            : 0;

        return (
          <tr key={index}>
            <td>
              <input
                type="text"
                value={line.product_code || ""}
                onChange={(e) =>
                  handleChange(line.originalIndex, "product_code", e.target.value)
                }
              />
            </td>
            <td>
              <input
                type="text"
                value={line.product_name || ""}
                onChange={(e) =>
                  handleChange(line.originalIndex, "product_name", e.target.value)
                }
              />
            </td>
            <td>{line.quantity > 0 ? line.quantity : "N/A"}</td>
            <td>
              <input
                type="number"
                value={line.final_quantity || ""}
                onChange={(e) =>
                  handleChange(
                    line.originalIndex,
                    "final_quantity",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </td>
            <td>{line.price > 0 ? `${line.price} €` : "-"}</td>
            <td>
              {!isNaN(discountPercentage)
                ? discountPercentage.toFixed(1)
                : "0.0"}{" "}
              %
            </td>
            <td>
              {line.pre_tax_amount > 0
                ? `${line.pre_tax_amount.toFixed(2)} €`
                : "-"}
            </td>
            <td>
              {line.unit_job_costing > 0
                ? `${line.unit_job_costing.toFixed(2)} €`
                : "-"}
            </td>
            <td>
              {line.quantity > 0
                ? (line.quantity * line.unit_job_costing).toFixed(2)
                : "-"}{" "}
              €
            </td>
            <td>
              {!isNaN(commercialMargin)
                ? commercialMargin.toFixed(1)
                : "0.0"}{" "}
              %
            </td>
            <td>
              <input
                type="number"
                value={line.actual_cost || ""}
                onChange={(e) =>
                  handleChange(
                    line.originalIndex,
                    "actual_cost",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </td>
            <td>
              {totalLineAmountReal(line) > 0
                ? `${totalLineAmountReal(line).toFixed(2)} €`
                : "-"}
            </td>
            <td
              className={
                realMargin > 50
                  ? styles.orange
                  : realMargin > 30
                  ? styles.green
                  : realMargin >= 15
                  ? styles.orange
                  : realMargin < 0
                  ? styles.red
                  : styles.red
              }
            >
              {!isNaN(realMargin) ? realMargin.toFixed(1) : "0.0"} %{" "}
              <span>
                {realMargin > 50 && <span>🔥</span>}
                {realMargin > 30 && realMargin <= 50 && <span>✅</span>}
                {realMargin >= 15 && realMargin <= 30 && <span>⚠️</span>}
                {realMargin < 0 && <span>☠️</span>}
                {realMargin >= 0 && realMargin < 15 && <span>⬇️</span>}
              </span>
            </td>
          </tr>
        );
      })}
    </React.Fragment>
  ))}
</tbody>



            {/* //bouton pour ajouter une ligne */}
            <button onClick={addNewLine} className={styles.addButton}>
              <i class="fa-solid fa-plus"></i>
            </button>
         <tfoot>
  <tr>
    <td colSpan="7">Total</td>
    <td>
      {/* Total prix vendu */}
      {quotation.quotation_lines
        .reduce((acc, line) => acc + (line.pre_tax_amount || 0), 0)
        .toFixed(2)}{" "}
      €
    </td>
    <td>
      {/* Total coût de revient initial */}
      {quotation.quotation_lines
        .reduce(
          (acc, line) =>
            acc + (line.quantity || 0) * (line.unit_job_costing || 0),
          0
        )
        .toFixed(2)}{" "}
      €
    </td>
    <td>
      {/* Total marge commerciale en %*/}
      {quotation.pre_tax_amount > 0
        ? (
            (quotation.quotation_lines.reduce(
              (acc, line) =>
                acc +
                (line.pre_tax_amount || 0) -
                (line.quantity || 0) * (line.unit_job_costing || 0),
              0
            ) /
              quotation.pre_tax_amount) *
            100
          ).toFixed(1)
        : "0"}{" "}
      %
    </td>
      

    <td></td>
    <td>
      {/* Total coût réel */}
      {quotation.quotation_lines
        .reduce(
          (acc, line) =>
            acc + (line.final_quantity || 0) * (line.actual_cost || 0),
          0
        )
        .toFixed(2)}{" "}
      €
    </td>
    <td>
      {/* Marge réelle totale */}
      {quotation.pre_tax_amount > 0
        ? (
            (quotation.quotation_lines.reduce(
              (acc, line) =>
                acc +
                (line.pre_tax_amount || 0) -
                (line.final_quantity || 0) * (line.actual_cost || 0),
              0
            ) /
              quotation.pre_tax_amount) *
            100
          ).toFixed(0)
        : "0"}{" "}
      %
    </td>
  </tr>
</tfoot>

          </table>
        ) : (
          <p>Aucune ligne de devis disponible.</p>
        )}
      </div>
      <button onClick={saveChanges} className={styles.saveButton}>
        Enregistrer les modifications
      </button>
    </div>
  );
}
