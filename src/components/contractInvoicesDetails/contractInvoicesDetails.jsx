import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import { fetchContractById } from "../../services/api/contracts";
import { fetchInvoiceById } from "../../services/api/invoices";
import { DotLoader } from "react-spinners";
import styles from "./style.module.scss";
import { db, auth } from "../../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getUserByUid } from "../../utils/getUserByUid";

export default function ContractInvoicesDetails() {
  const { quotationId } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [contract, setContract] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [quotation, setQuotation] = useState(null);
  const [generating, setGenerating] = useState(false);
  // const [showBillingModal, setShowBillingModal] = useState(false);
  const user = auth.currentUser;
  const [hasBillingPlan, setHasBillingPlan] = useState(false);
  const navigate = useNavigate();

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

        setQuotation(data);
        setContract(contractData);
        setInvoices(invoicesData);

        if (contractData.comments && contractData.comments.trim() !== "") {
          setShowPopup(true);
        }

        // Vérifie si un plan existe
        const planRef = doc(db, "billingPlans", data.id.toString());
        const planSnapshot = await getDoc(planRef);
        setHasBillingPlan(planSnapshot.exists());

        await getUserByUid(data.created_by);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données du projet.");
      } finally {
        setLoading(false);
      }
    };

    loadQuotationData();
  }, [quotationId]);

  console.log("ContractInvoicesDetails - Invoices:", invoices);

  const isPaidInvoice = (invoice) =>
    invoice.paid_date && new Date(invoice.paid_date) >= new Date(invoice.date)
      ? "green"
      : "red";

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <DotLoader color="#C60F7B" loading={loading} size={60} />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;

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
    totalInvoiceAmount === 0
      ? 0
      : (totalPaidAmount / quotation.pre_tax_amount) * 100;

  return (
    <div className={styles.contractInvoicesDetailsContainer}>
      {/* Pop-up si commentaire */}
      {showPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <h2>🔔 Information importante</h2>
            <h3>Veuillez prendre note de ce commentaire ajouté à l'affaire</h3>
            <p dangerouslySetInnerHTML={{ __html: contract.comments }}></p>
            <button onClick={() => setShowPopup(false)}>Fermer</button>
          </div>
        </div>
      )}

      <h1>Détails de la facturation</h1>

      <div style={{ marginTop: "1rem" }}>
        {hasBillingPlan ? (
          <button
            onClick={() => navigate(`/quotation/${quotation.id}/billing-plan`)}
          >
            Voir le plan de facturation
          </button>
        ) : (
          <button
            onClick={() => navigate(`/quotation/${quotation.id}/billing-plan`)}
          >
            Créer un plan de facturation
          </button>
        )}
      </div>

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
          {quotation.pre_tax_amount?.toFixed(2)} €
        </p>

        <div className={styles.progressBarContainer}>
          <p>Avancement du paiement :</p>
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
              <th>Numéro facture</th>
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
