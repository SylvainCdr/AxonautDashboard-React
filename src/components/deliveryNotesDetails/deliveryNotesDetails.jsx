import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  fetchDeliveryNotesByProject,
  downloadDeliveryNote,
} from "../../services/deliveryNotes";
import styles from "./style.module.scss";
import { GridLoader } from "react-spinners";


export default function DeliveryNotesDetails() {
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [expandedNotes, setExpandedNotes] = useState({}); // Pour gérer les BL déroulés

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
   
        const deliveryNotesData = await fetchDeliveryNotesByProject(projectId);
        console.log(
          "Données brutes des bons de livraison :",
          deliveryNotesData
        );
        setDeliveryNotes(deliveryNotesData);

       
        setDeliveryNotes(deliveryNotesData);
      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données du projet.");
      } finally {
        setLoading(false);
      }
    };

    loadProjectData();
  }, [projectId]);


console.log ("Dépenses du projet :", expenses);
console.log ("Bons de livraison du projet :", deliveryNotes);


  // Fonction pour télécharger un bon de livraison, on transforme le base64 en Blob puis on crée un lien pour le télécharger
  const handleDownloadDeliveryNote = async (deliveryNoteId) => {
    try {
      const response = await fetch(
        `http://localhost:3001/downloadDeliveryNote?deliveryNoteId=${deliveryNoteId}`
      );
      const data = await response.json();
      const base64PDF = data.deliveryNote;

      // Convert base64 to Blob
      const byteCharacters = atob(base64PDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // Create a link to download the PDF
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `delivery_note_${deliveryNoteId}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Error downloading the delivery note:", err);
    }
  };


  // Fonction pour déployer ou réduire les détails d'un bon de livraison
  const toggleDeliveryNote = (noteId) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };









  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.deliveryNotesDetailsContainer}>
    <h1>Bons de livraison</h1>

    {deliveryNotes.length === 0 ? (
      <p>Aucun bon de livraison disponible.</p>
    ) : (
      <table>
        <thead>
          <tr>
            <th>Nom du document</th>
            <th>Date</th>
            <th>Adresse de livraison</th>
            <th>Commentaire</th>
            <th>Produits</th>
            <th>Télécharger</th>
          </tr>
        </thead>
        <tbody>
          {deliveryNotes.map((note) => (
            <React.Fragment key={note.id}>
              {/* Ligne principale */}
              <tr onClick={() => toggleDeliveryNote(note.id)}>
                <td>{note.file_name}</td>
                <td>
                  {new Date(
                    note.delivery_form_date.date
                  ).toLocaleDateString()}
                </td>
                <td>
                  {note.address.delivery_address_company_name},{" "}
                  {note.address.delivery_address_street},{" "}
                  {note.address.delivery_address_zip_code}{" "}
                  {note.address.delivery_address_town},{" "}
                  {note.address.delivery_address_country}
                </td>
                <td>{note.comment || "Aucun commentaire"}</td>
                <td>
                  <button>
                    {expandedNotes[note.id] ? "Réduire" : "Voir"}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => handleDownloadDeliveryNote(note.id)}
                  >
                    Télécharger
                  </button>
                </td>
              </tr>

              {/* Détails déroulants */}
              {expandedNotes[note.id] && (
                <tr>
                  <td colSpan="5">
                    <ul className={styles.productsList}>
                      {note.products.map((product) => (
                        <li key={product.id}>
                          <strong>{product.name}</strong> -{" "}
                          {product.description} -{" "}
                          {parseFloat(product.price).toFixed(2)} €
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    )}
  </div>
  );
}
