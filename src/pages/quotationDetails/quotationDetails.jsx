import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchCompanyById } from "../../services/api/companies";
import styles from "./style.module.scss";






export default function QuotationDetails() {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState({});
  const [company, setCompany] = useState({});
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
        setQuotation(data);
        setCompany(companyData);
      } catch (err) {
        setError("Impossible de charger les données du projet.");
      } finally {
        setLoading(false);
      }
    };
    loadQuotationData();
  }, [quotationId]);

  if (loading) return <div className={styles.loader}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

 
//   id: 7269800,
//   number: 'Pix4527',
//   title: 'Pix4527 Hanwha Divers',
//   date: '2024-11-25T00:00:00+01:00',
//   expiry_date: '2024-12-25T00:00:00+01:00',
//   sent_date: null,
//   last_update_date: '2024-11-25T15:05:51+01:00',
//   status: 'accepted',
//   date_customer_answer: '2024-11-26T00:00:00+01:00',
//   user_id: 462785,
//   company_id: 27714284,
//   company_name: 'SPIE BUILDING SOLUTIONS',
//   project_id: 1050344,
//   opportunity_id: null,
//   contract_id: 4057128,
//   global_discount_amount: 0,
//   global_discount_amount_with_tax: 0,
//   global_discount_unit_is_percent: null,
//   global_discount_comments: null,
//   pre_tax_amount: 3350.64,
//   tax_amount: 670.13,
//   total_amount: 4020.77,
//   margin: 358.80999999999995,
//   payments_to_display_in_pdf: null,
//   electronic_signature_date: null,
//   comments: '',
//   public_path: 'https://axonaut.com/public/quotation/pdf/0e10e2d2f6cc77c88f127718b4dd29a927c76b312a0e4bad1cb7a79f996621eb',
//   customer_portal_url: 'https://axonaut.com/document/QH3MBEM5WTPCQPGS',
//   quotation_lines: [
//     [Object], [Object],
//     [Object], [Object],
//     [Object], [Object],
//     [Object]
//   ]
// },


  return (
    <div className={styles.quotationContainer}>
      <h1>Détails du devis</h1>

      <div className={styles.header}>
        <div className={styles.section1}>
          <p>
            <strong>Id :</strong> {quotation.id}
          </p>
          <p>
            <strong>Numéro :</strong> {quotation.number}
          </p>

          <p>
            <strong>Titre :</strong> {quotation.title}
          </p>
          <p>
            <strong>Date :</strong> {quotation.date}
          </p>
          <p>
            <strong>Date d'expiration :</strong> {quotation.expiry_date}
          </p>
          <p>
            <strong>Date de dernière mise à jour :</strong>{" "}
            {quotation.last_update_date}
          </p>
          <p>
            <strong>Statut :</strong> {quotation.status}
          </p>
          <p>
            <strong>Date de réponse du client :</strong>{" "}
            {quotation.date_customer_answer}
          </p>
        </div>
        <div className={styles.section2}>
          <p>
            <strong>Id utilisateur :</strong> {quotation.user_id}
          </p>
          <p>
            <strong>Id entreprise :</strong> {quotation.company_id}
          </p>

          <p>
            <strong>Nom de l'entreprise :</strong> {quotation.company_name}
          </p>
          // lien vers le projet 
          <p>
            <strong>Id projet :</strong> <button onClick={() => handleClickProject(quotation.project_id)}> {quotation.project_id}</button>
          </p>
          <p>
            <strong>Id opportunité :</strong> {quotation.opportunity_id}
          </p>
          <p>
            <strong>Id contrat :</strong> {quotation.contract_id}
          </p>
          <p>
            <strong>Montant total :</strong> {quotation.total_amount}€
          </p>
        </div>
      </div>

      <div className={styles.quotationLines}>
        <h2>Lignes de devis</h2>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix unitaire HT</th>
              <th>Montant total HT</th>
            </tr>
          </thead>
          <tbody>
            {quotation.quotation_lines.map((line) => (
              <tr key={line.id}>
                <td>{line.product_name}</td>
                <td>{line.quantity}</td>
                <td>{line.price} €</td>
                <td>{line.pre_tax_amount} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <a
          href={quotation.public_path}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis
        </a>
        <a
          href={quotation
            .customer_portal_url}
          target="_blank"
          rel="noreferrer"
          className={styles.button}
        >
          Voir le devis dans le portail client
        </a>
      </div>
    </div>
  );
}
