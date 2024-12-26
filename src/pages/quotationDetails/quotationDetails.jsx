import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import { fetchContractById } from "../../services/api/contracts";
import { fetchInvoiceById } from "../../services/api/invoices";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";

export default function QuotationDetails() {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState({});
  const [company, setCompany] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [contract, setContract] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // on met en pplace le onClick pr aller sur le détail du projet

  const navigate = useNavigate();

  const handleClickProject = (projectId) => {
    navigate(`/projects/${quotation.project_id}`);
  };

  useEffect(() => {
    const loadQuotationData = async () => {
      try {
        setLoading(true);
        const data = await fetchQuotationById(quotationId);
        const companyData = await fetchCompanyById(data.company_id);
        const contractData = await fetchContractById(data.contract_id);
        const invoicePromises = contractData.invoices_id.map((invoiceId) =>
          fetchInvoiceById(invoiceId)
        );
        const invoicesData = await Promise.all(invoicePromises);
      

        setQuotation(data);
        setCompany(companyData);
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

  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

  // si la date de paiement est inférieur à la date de création alors la facture est pas payée et donc rouge sinon verte
  const isPaidInvoice = (invoice) => {
    if (new Date(invoice.paid_date) < new Date(invoice.date)) {
      return "red";
    }
    return "green";
  };
  


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
            <strong>Date :</strong>{" "}
            {new Date(quotation.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Date d'expiration :</strong>{" "}
            {new Date(quotation.expiry_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Date de dernière mise à jour :</strong>{" "}
            {new Date(quotation.last_update_date).toLocaleDateString()}
          </p>
          <p>
            <strong>Statut :</strong>{" "}
            <span style={{ color: statusColor(quotation.status) }}>
              {quotation.status}
            </span>
          </p>
          <p>
            <strong>Commentaire(s):</strong> {quotation.comments}
          </p>
        </div>
        <div className={styles.section2}>
          <p>
            {/* <strong>Id utilisateur :</strong> {employee.firstname} {employee.lastname} */}
          </p>
          <p>
            <strong>Id entreprise :</strong> {quotation.company_id}
          </p>

          <p>
            <strong>Nom de l'entreprise :</strong> {quotation.company_name}
          </p>
          {/* // business_manager */}
          <p>
            {" "}
            <strong> Commercial :</strong>{" "}
            {company.business_manager?.name || "Inconnu"}
          </p>

          <p>
            <strong>Id projet :</strong>{" "}
            <button onClick={() => handleClickProject(quotation.project_id)}>
              {" "}
              {quotation.project_id}
            </button>
          </p>
          <p>
            <strong>Id opportunité :</strong> {quotation.opportunity_id}
          </p>
          <p>
            <strong>Id contrat :</strong> {quotation.contract_id}
          </p>
          <p>
            <strong>Montant total HT:</strong> {quotation.pre_tax_amount}€
          </p>
        </div>
      </div>

      <div className={styles.quotationLines}>
        <h2>Lignes de devis</h2>
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Désignation</th>
              <th>Quantité</th>
              <th>Prix unitaire HT</th>
              <th>Montant total HT</th>
              <th>Coût d'achat unit</th>
              <th>Marge total</th>
              <th> Marge en %</th>
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
                <td> {line.unit_job_costing} €</td>
                <td>{line.margin} €</td>
                <td>
                  {" "}
                  {((line.margin / line.pre_tax_amount) * 100).toFixed(2)} %
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <p>
            <strong>Montant total HT :</strong> {quotation.pre_tax_amount} €
          </p>
          <p>
            <strong>Montant total TTC :</strong> {quotation.total_amount} €
          </p>
          <p>
            <strong>Marge totale :</strong> {quotation.margin.toFixed(2)} €
          </p>
          <p>
            <strong> Marge % :</strong>{" "}
            {((quotation.margin / quotation.pre_tax_amount) * 100).toFixed(2)} %
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
        <a
          href={quotation.customer_portal_url}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans le portail client
        </a>
      </div>

      <div className={styles.contractContainer}>
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
          {/* <p>
            <strong>Montant total à facturer :</strong>{" "}
            {project.actual_revenue.toFixed(2)}  €
          </p> */}

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
    </div>
  );
}
