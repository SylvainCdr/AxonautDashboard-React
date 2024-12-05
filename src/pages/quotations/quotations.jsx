import styles from "./style.module.scss";
import { fetchQuotations } from "../../services/api/quotations";
import React, { useEffect, useState } from "react";
import { ClipLoader } from "react-spinners"; // Importer le composant du loader

export default function Quotations() {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const loadQuotationsData = async () => {
            setLoading(true); // Mettre le loading à true avant de commencer l'appel
            try {
                const data = await fetchQuotations(page);
                setQuotations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false); // Mettre le loading à false une fois les données chargées
            }
        };
        loadQuotationsData();
    }, [page]);

    const handleNextPage = () => setPage((prev) => prev + 1);
    const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

    if (loading) {
        return (
            <div className={styles.loaderContainer}>
                {/* Affichage du loader pendant le chargement */}
                <ClipLoader color="#3498db" loading={loading} size={70} />
                <p>Chargement des devis...</p>
            </div>
        );
    }

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
