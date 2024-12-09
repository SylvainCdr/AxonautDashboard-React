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


  // 

  // {
  //   id: 7423684,
  //   number: 'Pix4627',
  //   title: 'Pix4627',
  //   date: '2024-12-06T00:00:00+01:00',
  //   expiry_date: '2025-01-05T00:00:00+01:00',
  //   sent_date: null,
  //   last_update_date: '2024-12-06T14:32:21+01:00',
  //   status: 'pending',
  //   user_id: 462785,
  //   company_id: 27714284,
  //   company_name: 'SPIE BUILDING SOLUTIONS',
  //   project_id: null,
  //   opportunity_id: null,
  //   contract_id: null,
  //   global_discount_amount: 0,
  //   global_discount_amount_with_tax: 0,
  //   global_discount_unit_is_percent: null,
  //   global_discount_comments: null,
  //   pre_tax_amount: 1152.48,
  //   tax_amount: 230.5,
  //   total_amount: 1382.98,
  //   margin: 82.31999999999991,
  //   payments_to_display_in_pdf: null,
  //   electronic_signature_date: null,
  //   comments: '',
  //   public_path: 'https://axonaut.com/public/quotation/pdf/7d5aae12df488f747d89bafa61d33e0b3558382162b4eeed99288e717811dbb9', 
  //   customer_portal_url: 'https://axonaut.com/document/DFZJ2WQXA5Q1843G',
  //   quotation_lines: [
  //     {
  //       product_id: 20680908,
  //       product_internal_id: null,
  //       product_name: 'XND-6080R',
  //       product_code: 'XND-6080R',
  //       title: 'XND-6080R',
  //       details: 'X series powered by Wisenet 5 network IR indoor dome camera, 2MP @60fps, 2.8 ~ 12.0mm motorized varifocal lens',
  //       quantity: 1,
  //       unit: '',
  //       price: 351.96,
  //       tax_rates: [Array],
  //       line_discount_amount: '0.00',
  //       line_discount_amount_with_tax: '0.00',
  //       line_discount_unit_is_percent: true,
  //       tax_amount: 70.39,
  //       pre_tax_amount: 351.96,
  //       total_amount: 422.35,
  //       margin: 25.14,
  //       unit_job_costing: 326.82,
  //       chapter: ''
  //     }, ... 



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
            <strong>Commentaire(s):</strong>{" "}
            {quotation.comments}
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
            <strong>Montant total HT:</strong> {quotation.pre_tax_amount}€
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
              <th>Coût d'achat unit</th>
              <th>Marge total</th>
              <th> Marge en %</th>
            </tr>
          </thead>
          <tbody>
            {quotation.quotation_lines.map((line) => (
              <tr key={line.id}>
                <td>{line.product_name}</td>
                <td>{line.quantity}</td>
                <td>{line.price} €</td>
                <td>{line.pre_tax_amount} €</td>

                {/* //       margin: 25.14,
                //       unit_job_costing: 326.82, */}
                <td> {line.unit_job_costing} €</td>

                <td>{line.margin} €</td>
                <td> {line.margin / line.pre_tax_amount * 100} %</td>
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
            <strong>Marge totale :</strong> {quotation.margin} €
          </p>
          <p>
          <strong> Marge % :</strong> {quotation.margin / quotation.pre_tax_amount * 100} %
          
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
