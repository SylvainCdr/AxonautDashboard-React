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
      } catch (err) {
        setError("Impossible de charger les données du projet.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);


  console.log ('factures :', invoices)



  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p className={styles.error}>{error}</p>;



  // si la date de paiement est inférieur à la date de création alors la facture est pas payée et donc rouge sinon verte
  const isPaidInvoice = (invoice) => {
    if (new Date(invoice.paid_date) < new Date(invoice.date)) {
      return "red";
    }
    return "green";
  };
  


  return (
    <div className={styles.contractInvoicesDetailsContainer}>
    <h1> Détails de la facturation </h1>

    <div className={styles.contractDetails}>
      <p>
        <strong>Id contrat :</strong> {contract.id}
      </p>
      <p>
        <strong>Nom :</strong> {contract.name}
      </p>
      <p>
        <strong>Date de début :</strong>{" "}
        {new Date(contract.start_date).toLocaleDateString()}
      </p>
      <p>
        <strong>Commentaire :</strong> {contract.comments}
      </p>
      <p>
        <strong>Id utilisateur :</strong> {contract.user_id}
      </p>
      {/* <p>
        <strong>Adresse de facturation :</strong>{" "}
        {contract?.invoice_address.company_name}
      </p>
      <p>
        <strong>Adresse de facturation :</strong>{" "}
        {contract?.invoice_address.street}
      </p>
      <p>
        <strong>Code postal :</strong> {contract?.invoice_address.zip_code}
      </p>
      <p>
        <strong>Ville :</strong> {contract?.invoice_address.city}
      </p> */}

      <p>
        <strong>Date de dernière mise à jour :</strong>{" "}
        {new Date(contract.last_update_date).toLocaleDateString()}
      </p>
      <p>
        <strong>Id projet :</strong> {contract.project.id}
      </p>
      <p>
        <strong>Numéro projet :</strong> {contract.project.number}
      </p>
      <p>
        <strong>Nom projet :</strong> {contract.project.name}
      </p>
      <p>
        <strong>Id devis :</strong> {contract.quotation.id}
      </p>
      <p>
        <strong>Montant total HT du devis :</strong>{" "}
        {contract.quotation.pre_tax_amount.toFixed(2)}  €
      </p>
  

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
              <td>
                {invoice.number}{" "}
                {invoice.mandatory_mentions && (
                  <strong>{invoice.mandatory_mentions}</strong>
                )}
              </td>

              <td>{invoice.pre_tax_amount} €</td>
              <td>{new Date(invoice.date).toLocaleDateString()}</td>
              {/* <td>{new Date(invoice.paid_date).toLocaleDateString()}</td> */}
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
        </tbody>
      </table>
    </div>
  </div>
  );
}
