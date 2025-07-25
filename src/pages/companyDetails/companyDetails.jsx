import React, { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCompanyById } from "../../services/api/companies";
import {
  fetchQuotationsByCompanyId,
  fetchInvoicesByCompanyId,
} from "../../services/api/companies";
import { Link } from "react-router-dom";
import { decodeHtmlEntities } from "../../utils/htmlDecoder";
import { BarLoader } from "react-spinners";

export default function CompanyDetails() {
  const [company, setCompany] = useState({});
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(true); // Pour le loader des quotations
  const [loadingInvoices, setLoadingInvoices] = useState(true); // Pour le loader des invoices
  const [loadingTotals, setLoadingTotals] = useState(true); // Pour le loader des totaux
  const [error, setError] = useState(null);

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
      setLoadingQuotations(true);
      try {
        const data = await fetchQuotationsByCompanyId(companyId);
        setQuotations(data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des devis de l'entreprise :",
          err.message
        );
        setError("Erreur lors de la récupération des devis.");
      } finally {
        setLoadingQuotations(false);
      }
    };
    loadQuotations();
  }, [companyId]);

  useEffect(() => {
    const loadInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const data = await fetchInvoicesByCompanyId(companyId);
        setInvoices(data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des factures de l'entreprise :",
          err.message
        );
        setError("Erreur lors de la récupération des factures.");
      } finally {
        setLoadingInvoices(false);
      }
    };
    loadInvoices();
  }, [companyId]);

  // **Nouveau useEffect pour arrêter le chargement de la section finance**
  useEffect(() => {
    if (!loadingQuotations && !loadingInvoices) {
      setLoadingTotals(false);
    }
  }, [loadingQuotations, loadingInvoices]);

  console.log(company);
  console.log(quotations);
  console.log("invoices", invoices);
  // Fonction pour regrouper les montants par année
  const groupByYear = (items, dateKey) => {
    return items.reduce((acc, item) => {
      const year = new Date(item[dateKey]).getFullYear();
      if (!acc[year]) {
        acc[year] = 0;
      }
      acc[year] += item.pre_tax_amount || 0;
      return acc;
    }, {});
  };

  // Regrouper les devis (CA prévisionnel) par année
  const quotationAmountsByYear = groupByYear(quotations, "date");

  // Regrouper les factures (CA réel) par année
  const invoiceAmountsByYear = groupByYear(invoices, "date");

  // Obtenir toutes les années uniques (triées)
  const allYears = [
    ...new Set([
      ...Object.keys(quotationAmountsByYear),
      ...Object.keys(invoiceAmountsByYear),
    ]),
  ]
    .map(Number)
    .sort((a, b) => b - a); // Trier de la plus récente à la plus ancienne

  // Définition des couleurs selon les statuts
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

        <div className={styles.companyLeft}>
          <img
            src="https://img.icons8.com/?size=200&id=113846&format=png&color=000000"
            alt="company illustration"
          />
        </div>

        <div className={styles.companyCenter}>
          <p>
            <strong>Nom :</strong> {company.name || "N/A"}
          </p>
          <p>
            <strong>Date de création :</strong>{" "}
            {company.creation_date
              ? new Date(company.creation_date).toLocaleDateString()
              : "N/A"}
          </p>
          <p>
            <strong>Adresse :</strong> {company.address_street},{" "}
            {company.address_city} ({company.address_zip_code || "N/A"},{" "}
            {company.address_country || "N/A"} )
          </p>
        </div>

        <div className={styles.companyRight}>
          <p>
            <strong>Responsable :</strong>{" "}
            {company.business_manager?.name || "N/A"}
          </p>
          <p>
            <strong>Employés :</strong>{" "}
            {company.employees?.length > 0
              ? company.employees
                  .map((employee) => employee.firstname || "Anonyme")
                  .join(", ")
              : "Aucun employé répertorié"}
          </p>
          <p>
            <strong>Documents :</strong>{" "}
            {company.documents?.length || "Aucun document disponible"}
          </p>
        </div>
      </div>

      {/* SECTION CA PRÉVISIONNEL ET RÉEL PAR ANNÉE */}
      <div className={styles.sectionFinance}>
        <h1>Chiffre d'affaires par année</h1>
        {loadingTotals ? (
          <div className={styles.loaderContainer}>
            <BarLoader color="#4520ff" loading={loadingTotals} size={60} />
            <p>Chargement du chiffre d'affaires...</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Année</th>
                <th>Total commandes</th>
                <th>Total facturé</th>
              </tr>
            </thead>
            <tbody>
              {allYears.map((year) => (
                <tr key={year}>
                  <td>{year}</td>
                  <td>{(quotationAmountsByYear[year] || 0).toFixed(2)} €</td>
                  <td>{(invoiceAmountsByYear[year] || 0).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.section2}>
        <h1>Commandes / Projets</h1>
        {loadingQuotations ? (
          <div className={styles.loaderContainer}>
            <BarLoader color="#4520ff" loading={loadingQuotations} size={60} />
            <p>Chargement des commandes / projets </p>
          </div>
        ) : quotations.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant HT</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((quotation) => (
                <tr key={quotation.id}>
                  <td>{quotation.number}</td>
                  <td>{decodeHtmlEntities(quotation.title)}</td>
                  <td>{new Date(quotation.date).toLocaleDateString()}</td>
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
        ) : (
          <p>Aucune commmande / projet trouvé(e).</p>
        )}
      </div>

      <div className={styles.section3}>
        <h1>Factures</h1>
        {loadingInvoices ? (
          <div className={styles.loaderContainer}>
            <BarLoader color="#4520ff" loading={loadingInvoices} size={60} />
            <p>Chargement des factures...</p>
          </div>
        ) : invoices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Date d'émission</th>
                <th>Date de paiement</th>
                <th>Statut</th>
                <th>Montant HT</th>
                <th>Voir</th>
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
        ) : (
          <p>Aucune facture trouvée.</p>
        )}
      </div>
    </div>
  );
}
