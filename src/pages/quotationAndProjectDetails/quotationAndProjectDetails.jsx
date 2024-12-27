import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchQuotationById } from "../../services/api/quotations";
import QuotationDetails from "../../components/quotationDetails/quotationDetails";
import ProjectDetails from "../../components/projectDetails/projectDetails";
import ContractInvoicesDetails from "../../components/contractInvoicesDetails/contractInvoicesDetails";
import DeliveryNotesDetails from "../../components/deliveryNotesDetails/deliveryNotesDetails";
import styles from "./style.module.scss";
import { GridLoader } from "react-spinners";


export default function QuotationAndProjectDetails() {
  const { quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuotationData = async () => {
      try {
        setLoading(true);
        const quotationData = await fetchQuotationById(quotationId);
        
        setQuotation(quotationData);
      } catch (err) {
        console.error(err);
        setError("Impossible de charger les données du devis.");
      } finally {
        setLoading(false);
      }
    };

    loadQuotationData();
  }, [quotationId]);

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
    <div className={styles.quotationAndProjectContainer}>


      <div className={styles.test}>

      

      </div>
      <div className={styles.section}>
        <QuotationDetails quotation={quotation} />
      </div>
    
      <div className={styles.section}>
      <ProjectDetails projectId={quotation.project_id} />
      </div>
      <div className={styles.section}>
        <ContractInvoicesDetails contractId={quotation.contract_id} />
        </div>
      <div className={styles.section}>
        <DeliveryNotesDetails projectId={quotation.project_id} />
        </div>

    </div>
  );
}
