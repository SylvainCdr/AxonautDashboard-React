import styles from "./style.module.scss";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCompanyById } from "../../services/api/companies";
import { useEffect, useState } from "react";
import { fetchQuotationsByCompanyId, fetchInvoicesByCompanyId } from "../../services/api/companies";

import { Link } from "react-router-dom";

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
        console.log("invoices", data);
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des factures de l'entreprise :",
          err.message
        );
      }
    };
    loadInvoices();
  }, [companyId]);



  // {
  //     "id": 55,
  //     "name": "foo",
  //     "creation_date": "2022-05-31\\T18:56:22P",
  //     "address_street": "5 rue de la gare",
  //     "address_zip_code": "31500",
  //     "address_city": "Toulouse",
  //     "address_country": "France",
  //     "comments": "string",
  //     "is_prospect": true,
  //     "is_customer": false,
  //     "currency": "EUR",
  //     "language": "fr",
  //     "thirdparty_code": "411000",
  //     "supplier_thirdparty_code": "401000",
  //     "intracommunity_number": "FR1X123456789",
  //     "siret": "1234567891012",
  //     "internal_id": "A254-5851-486H-HEA5",
  //     "isB2C": false,
  //     "business_manager": {
  //       "id": 55,
  //       "name": "Claire Rousseau",
  //       "email": "claire@axonaut.com"
  //     },
  //     "custom_fields": {
  //       "myCustomField": 1
  //     },
  //     "categories": {
  //       "id": 55,
  //       "name": "B2B"
  //     },
  //     "employees": [
  //       {
  //         "id": 55,
  //         "gender": 1,
  //         "firstname": "Claire",
  //         "lastname": "Rousseau",
  //         "email": "claire@axonaut.com",
  //         "phone_number": "0102030405",
  //         "cellphone_number": "0605040302",
  //         "job": "CEO",
  //         "is_billing_contact": true,
  //         "company_id": 33,
  //         "custom_fields": {
  //           "myCustomField": 1
  //         }
  //       }
  //     ],
  //     "documents": [
  //       0
  //     ]
  //   }

  return (
    <div className={styles.companyDetailsContainer}>
      <div className={styles.section1}>
        <h1>Company details</h1>
        <p>Company name: {company.name}</p>
        <p>
          Creation date: {new Date(company.creation_date).toLocaleDateString()}
        </p>
        <p>Address: {company.address_street}</p>
        <p>Zip code: {company.address_zip_code}</p>
        <p>City: {company.address_city}</p>
        <p>Country: {company.address_country}</p>
        <p>Comments: {company.comments}</p>
        <p>Is prospect: {company.is_prospect ? "Yes" : "No"}</p>
        <p>Is customer: {company.is_customer ? "Yes" : "No"}</p>
        <p>Currency: {company.currency}</p>
        <p>Language: {company.language}</p>
        <p>Thirdparty code: {company.thirdparty_code}</p>
        <p>Supplier thirdparty code: {company.supplier_thirdparty_code}</p>
        <p>Intracommunity number: {company.intracommunity_number}</p>
        <p>Siret: {company.siret}</p>
        <p>Internal id: {company.internal_id}</p>
        <p>Is B2C: {company.isB2C ? "Yes" : "No"}</p>
        <p>Business manager: {company.business_manager?.name}</p>
        <p>Custom fields: {JSON.stringify(company.custom_fields)}</p>
        <p>Categories: {company.categories?.name}</p>
        <p>
          Employees:{" "}
          {company.employees?.map((employee) => employee.firstname).join(", ")}
        </p>
        <p>Documents: {company.documents?.length}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <div className={styles.section2}>
        <h2>Quotations</h2>
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
                <td>{quotation.title}</td>
                <td>{quotation.pre_tax_amount}</td>
                <td>{quotation.status}</td>
                <td>
                  <button
                    onClick={() => navigate(`/quotations/${quotation.id}`)}
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

        <h2>Invoices</h2>

        {/* {
    "id": 55,
    "number": "FAC2022-08-00001",
    "date": "1653955200",
    "sent_date": "1653955200",
    "due_date": "1653955200",
    "paid_date": "1653955200",
    "delivery_date": "1653955200",
    "last_update_date": "1653955200",
    "tax_amount": 55.02,
    "total": 552,
    "deposits": {
      "deposit_percent": 50,
      "deposit_flat": 250
    },
    "discounts": {
      "amount": 50,
      "amount_with_tax": 52,
      "comments": "commercial gesture"
    },
    "taxes": [
      {
        "rate": 5.5,
        "amount": 105.25
      }
    ],
    "currency": "EUR",
    "margin": 0,
    "mandatory_mentions": "string",
    "payment_terms": "string",
    "theme_id": 1020,
    "outstanding_amount": 0,
    "frequency_in_months": 0,
    "business_user": "Claire Rousseau",
    "public_path": "https://axonaut.com/public/invoice/pdf/XDJC51321",
    "paid_invoice_pdf": "https://axonaut.com/utilities/invoice/paidDownload/XDJC51321",
    "customer_portal_url": "https://axonaut.com/document/XDJC51321",
    "contract_id": 995,
    "project_id": 995,
    
  }
] */}

        <table>

          <thead>
            <tr>
              <th>Number</th>
              <th>Date</th>
              <th>Montant HT</th>
              <th>Statut</th>
              <th>Voir </th>

            </tr>
          </thead>

          <tbody>

      {invoices.map((invoice) => (
        <tr key={invoice.id}>
          <td>{invoice.number}</td>
          <td>{new Date(invoice.date).toLocaleDateString()}</td>
          <td>{invoice.pre_tax_amount}</td>
          <td>{invoice.status}</td>
          <td>
            <Link  to={invoice.paid_invoice_pdf}>Voir</Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

        





    </div>

    </div>

  );
}
