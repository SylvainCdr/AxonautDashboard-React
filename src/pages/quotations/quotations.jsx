import styles from "./style.module.scss";
import { fetchQuotations } from "../../services/api/quotations";
import React, { useEffect, useState } from "react";

export default function Quotations() {

    // [
    //     {
    //       "id": 55,
    //       "number": "QUO-2022-02",
    //       "title": "QUO-2022-02 Title",
    //       "date": "2022-05-28T18:05:35+02:00",
    //       "expiry_date": "2022-05-28T18:05:35+02:00",
    //       "sent_date": "2022-05-28T18:05:35+02:00",
    //       "last_update_date": "2022-05-28T18:05:35+02:00",
    //       "status": "accepted",
    //       "date_customer_answer": "2022-05-28T18:05:35+02:00",
    //       "user_id": 58962,
    //       "company_id": 58962,
    //       "company_name": "My customer",
    //       "project_id": 9842,
    //       "contract_id": 69874,
    //       "global_discount_amount": 489.6,
    //       "global_discount_amount_with_tax": 589.6,
    //       "global_discount_unit_is_percent": true,
    //       "pre_tax_amount": 5896.1,
    //       "tax_amount": 569,
    //       "total_amount": 6465.1,
    //       "margin": 256.45,
    //       "payments_to_display_in_pdf": [
    //         {
    //           "amount": 10.5,
    //           "payment_nature_id": 3,
    //           "payment_nature_name": "string",
    //           "reference": "string"
    //         }
    //       ],
    //       "electronic_signature_date": "2022-05-28T18:05:35+02:00",
    //       "global_discount_comments": "string",
    //       "public_path": "https://axonaut.com/public/quotation/pdf/5eac5b8de0aac1225598e5c2a5b906f3f177a208136bb985723de032cc10bc30",
    //       "customer_portal_url": "https://axonaut.com/document/9DTW7ZBP28AMV296",
    //       "quotation_lines": [
    //         {
    //           "product_id": 489,
    //           "product_internal_id": "FZR48-4545A-515SA",
    //           "product_code": "PRT-12-896",
    //           "product_name": "My Product",
    //           "title": "quotation line",
    //           "details": "line details",
    //           "quantity": 2,
    //           "unit": "KG",
    //           "price": 4482,
    //           "tax_rates": [
    //             {
    //               "rate": 5.5,
    //               "name": "5.5%"
    //             }
    //           ],
    //           "chapter": "product and services",
    //           "line_discount_amount": 120.2,
    //           "line_discount_amount_with_tax": 155.5,
    //           "line_discount_unit_is_percent": true,
    //           "tax_amount": 55.5,
    //           "pre_tax_amount": 789.5,
    //           "total_amount": 845,
    //           "margin": 55,
    //           "unit_job_costing": 23.2
    //         }
    //       ]
    //     }
    //   ]

    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const loadQuotationsData = async () => {
            try {
                setLoading(true);
                const data = await fetchQuotations(page);
                setQuotations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadQuotationsData();
    }, [page]);

    const handleNextPage = () => setPage((prev) => prev + 1);
    const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

    if (loading) return <p>Chargement des devis...</p>;
    if (error) return <p>Erreur : {error}</p>;

    return (

        <div className={styles.quotationsContainer}>
            <header className={styles.header}>
                <h1>Gestion des Devis</h1>
            </header>
            <main className={styles.quotationsList}>
                {quotations.map((quotation) => (
                    <div key={quotation.id} className={styles.quotationCard}>
                        <h2>{quotation.title}</h2>
                        <p>
                            <strong>ID : </strong> {quotation.id} <br />
                            <strong>Numéro : </strong> {quotation.number} <br />
                            <strong>Entreprise : </strong> {quotation.company_name || "Inconnue"}
                        </p>
                        <div className={styles.dates}>
                            <span>
                                <strong>Date : </strong> {quotation.date}
                            </span>
                            <span>
                                <strong>Statut : </strong> {quotation.status}
                            </span>
                        </div>
                        <div className={styles.amounts}>
                            <span>
                                <strong>Montant HT : </strong> {quotation.pre_tax_amount} €
                            </span>
                            <span>
                                <strong>Montant TTC : </strong> {quotation.total_amount} €
                            </span>
                        </div>
                    </div>
                ))}
            </main>
            <footer className={styles.footer}>
                <button onClick={handlePreviousPage} disabled={page === 1}>
                    Page précédente
                </button>
                <button onClick={handleNextPage}>Page suivante</button>
            </footer>

        </div>

    );
}