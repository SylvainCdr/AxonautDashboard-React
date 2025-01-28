import styles from "./style.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCompanyById } from "../../services/api/companies";
import { useEffect, useState } from "react";
import {
  fetchQuotationsByCompanyId,
  fetchInvoicesByCompanyId,
} from "../../services/api/companies";
import { Link } from "react-router-dom";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";

export default function CompanyDetails() {
  const [company, setCompany] = useState({});
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const data = await fetchCompanyById(companyId);
        setCompany(data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des données de l'entreprise :",
          err.message
        );
      }
    };
    loadCompany();
  }, [companyId]);

  useEffect(() => {
    const loadQuotations = async () => {
      try {
        const data = await fetchQuotationsByCompanyId(companyId);
        setQuotations(data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des devis de l'entreprise :",
          err.message
        );
      }
    };
    loadQuotations();
  }, [companyId]);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await fetchInvoicesByCompanyId(companyId);
        setInvoices(data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des factures de l'entreprise :",
          err.message
        );
      }
    };
    loadInvoices();
  }, [companyId]);

  console.log(company);
  console.log(invoices);

  const statusColor = (status) => {
    if (status === "accepted") return "green";
    if (status === "pending") return "orange";
    if (status === "refused") return "red";
    return "black";
  };

  return (
    <div className={styles.companyDetailsContainer}>
      <div className={styles.section1}>
        <h1>Détails de l'entreprise</h1>
        <p>Company name: {company.name}</p>
        <p>
          Creation date: {new Date(company.creation_date).toLocaleDateString()}
        </p>
        <p>Address: {company.address_street}</p>
        <p>Zip code: {company.address_zip_code}</p>
        <p>City: {company.address_city}</p>
        <p>Country: {company.address_country}</p>
      
        <p>Business manager: {company.business_manager?.name}</p>
       
        <p>
          Employees:{" "}
          {company.employees?.map((employee) => employee.firstname).join(", ")}
        </p>
        <p>Documents: {company.documents?.length}</p>
      </div>
      <div className={styles.section2}>
        <h1>commandes / projets </h1>
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Nom</th>
              <th>Date</th>
              <th> Montant HT </th>
              <th> Statut </th>
              <th> Action </th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quotation) => (
              <tr key={quotation.id}>
                <td>{quotation.number}</td>
                <td>{new Date(quotation.date).toLocaleDateString()}</td>
                <td>{decodeHtmlEntities(quotation.title)}</td>
                <td>{quotation.pre_tax_amount} €</td>
                <td>
                  <span style={{ color: statusColor(quotation.status) }}>
                    {quotation.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() =>
                      navigate(
                        `/quotations/${quotation.id}/project/${quotation.project_id}`
                      )
                    }
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.section3}>
        <h1>Factures </h1>

        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Date d'émission</th>
              <th>Date de paiement</th>
              <th>Statut</th>
              <th>Montant HT</th>
             
              <th>Voir </th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.number}</td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>{new Date(invoice.due_date).toLocaleDateString()}</td>
                <td>
                  <span style={{ color: statusColor(invoice.status) }}>
                    {invoice.status}
                  </span>
                </td>
                <td>{invoice.pre_tax_amount} €</td>
                <td>
                  <Link to={invoice.customer_portal_url}>Voir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => navigate(-1)}>Retour</button>

    </div>
  );
}
