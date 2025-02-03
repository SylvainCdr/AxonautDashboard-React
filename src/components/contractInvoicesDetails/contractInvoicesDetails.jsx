import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchContractById } from "../../services/api/contracts";
import { fetchInvoiceById } from "../../services/api/invoices";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";

export default function ContractInvoicesDetails() {
  const { quotationId } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [contract, setContract] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false); // État pour le pop-up

  useEffect(() => {
    const loadQuotationData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotationById(quotationId);
        const contractData = await fetchContractById(data.contract_id);
        const invoicePromises = contractData.invoices_id.map((invoiceId) =>
          fetchInvoiceById(invoiceId)
        );
        const invoicesData = await Promise.all(invoicePromises);

        setContract(contractData);
        setInvoices(invoicesData);

        // Vérifier si un commentaire est présent et afficher le pop-up
        if (contractData.comments && contractData.comments.trim() !== "") {
          setShowPopup(true);
        }
      } catch (err) {
        setError("Impossible de charger les données du projet.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);

  console.log("contract", contract);

  // Calculer le montant total payé
  const totalPaidAmount = invoices.reduce((acc, invoice) => {
    if (invoice.paid_date) {
      return acc + invoice.pre_tax_amount;
    }
    return acc;
  }, 0);

  const totalInvoiceAmount = invoices.reduce(
    (acc, invoice) => acc + invoice.pre_tax_amount,
    0
  );

  const paymentPercentage =
    totalInvoiceAmount === 0 ? 0 : (totalPaidAmount / contract.quotation.pre_tax_amount) * 100;

  const isPaidInvoice = (invoice) =>
    invoice.paid_date && new Date(invoice.paid_date) >= new Date(invoice.date)
      ? "green"
      : "red";

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
<GridLoader color="#C60F7B" loading={loading} size={15} />        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.contractInvoicesDetailsContainer}>
      {/* 🔔 Pop-up si un commentaire est présent */}
      {showPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h2>🔔 Information importante</h2>
            <h3>Veuillez prendre note de ce commentaire ajouté à l'affaire </h3>
            <p dangerouslySetInnerHTML={{ __html: contract.comments }}></p>
            <button onClick={() => setShowPopup(false)}>Fermer</button>
          </div>
        </div>
      )}

      <h1> Détails de la facturation </h1>

      <div className={styles.contractDetails}>
        <p>
          <strong>Nom :</strong> {contract.name}
        </p>

        {contract.comments && contract.comments.trim() !== "" && (
          <p>
            <strong>Commentaire :</strong>
            <div
              dangerouslySetInnerHTML={{ __html: contract.comments }}
              className={styles.comment}
            ></div>
          </p>
        )}

        <p>
          <strong>Montant total HT du devis :</strong>{" "}
          {contract.quotation.pre_tax_amount.toFixed(2)} €
        </p>

        {/* Jauge de progression */}
        <div className={styles.progressBarContainer}>
          <p>
            Avancement du paiement :
          </p>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${paymentPercentage}%` }}
            ></div>
          </div>
          <p>{paymentPercentage.toFixed()}% payé</p>
        </div>

        <h2>Factures liées au contrat</h2>
        <table>
          <thead>
            <tr>
              <th>Numéro facture </th>
              <th>Montant HT</th>
              <th>Date de création</th>
              <th>Date de Paiement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.number}</td>
                <td>{invoice.pre_tax_amount} €</td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>
                  <span style={{ color: isPaidInvoice(invoice) }}>
                    {invoice.paid_date
                      ? new Date(invoice.paid_date).toLocaleDateString()
                      : "Non payée"}
                  </span>
                </td>
                <td>
                  <a
                    href={invoice.public_path}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Voir la facture
                  </a>
                </td>
              </tr>
            ))}
            <tr>
              <td>Montant total des factures :</td>
              <td>{totalInvoiceAmount.toFixed(2)} €</td>
              <td>Montant total payé :</td>
              <td>{totalPaidAmount.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
