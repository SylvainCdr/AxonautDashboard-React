import React, { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { useParams } from "react-router-dom";
import { db } from "../../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { GridLoader } from "react-spinners";

export default function DuplicateQuotation() {
  const { duplicateQuotationId } = useParams(); // Récupère l'ID du devis depuis l'URL
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error("Erreur lors de la récupération du devis dupliqué :", err);
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };

    fetchDuplicateQuotation();
  }, [duplicateQuotationId]);

  // Met à jour les champs modifiables
  const handleChange = (index, field, value) => {
    const updatedLines = [...quotation.quotation_lines];
    updatedLines[index][field] = value;
    setQuotation((prev) => ({
      ...prev,
      quotation_lines: updatedLines,
    }));
  };

  // Insère une nouvelle ligne vide après un indice spécifique
  const addLineAfter = (index) => {
    const newLine = {
      product_code: "",
      product_name: "",
      quantity: 0,
      final_quantity: 0,
      price: 0,
      unit_job_costing: 0,
      actual_cost: 0,
    };

    const updatedLines = [...quotation.quotation_lines];
    updatedLines.splice(index + 1, 0, newLine); // Ajoute la nouvelle ligne après l'indice
    setQuotation((prev) => ({
      ...prev,
      quotation_lines: updatedLines,
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotation.quotation_lines.map((line, index) => (
                <tr key={index}>
                  <td>{line.product_code}</td>
                  <td>{line.product_name}</td>
                  <td>{line.quantity}</td>
                  <td>
                    <input
                      type="number"
                      value={line.final_quantity || ""}
                      onChange={(e) =>
                        handleChange(index, "final_quantity", parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
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
                  <td>
                    <input
                      type="number"
                      value={line.actual_cost || ""}
                      onChange={(e) =>
                        handleChange(index, "actual_cost", parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td>{(line.final_quantity * line.actual_cost || 0).toFixed(2)} €</td>
                  <td>
                    {(
                      ((line.final_quantity * line.price -
                        line.final_quantity * line.actual_cost) /
                        (line.final_quantity * line.price)) *
                      100
                    ).toFixed(1)}{" "}
                    %
                  </td>
                  <td>
                    <button onClick={() => addLineAfter(index)} className={styles.addButton}>
                      Ajouter une ligne
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
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
