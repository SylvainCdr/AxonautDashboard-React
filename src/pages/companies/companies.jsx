import React, { useEffect, useState } from "react";
import { fetchCompanies } from "../../services/api/companies";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";
import { useNavigate } from "react-router-dom";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all"); // Filtre actif: 'all', 'supplier', 'prospect', 'customer'

  const navigate = useNavigate();

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const data = await fetchCompanies(page);
        setCompanies(data);
        setFilteredCompanies(data); // Par défaut, aucune filtration
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [page]);

  useEffect(() => {
    // Filtrage des données en fonction du filtre actif
    const filterData = () => {
      if (filter === "all") {
        setFilteredCompanies(companies);
      } else if (filter === "supplier") {
        setFilteredCompanies(companies.filter((c) => c.is_supplier));
      } else if (filter === "prospect") {
        setFilteredCompanies(companies.filter((c) => c.is_prospect));
      } else if (filter === "customer") {
        setFilteredCompanies(companies.filter((c) => c.is_customer));
      }
    };

    filterData();
  }, [filter, companies]);

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des entreprises...</p>
      </div>
    );
  }
  if (error) return <p>Erreur : {error}</p>;

  return (
    <div className={styles.companiesContainer}>
      <h1>Liste des entreprises</h1>

      {/* Toggle pour le filtrage */}
      <div className={styles.filterContainer}>
        <button
          onClick={() => setFilter("all")}
          className={filter === "all" ? styles.active : ""}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter("supplier")}
          className={filter === "supplier" ? styles.active : ""}
        >
          Fournisseurs
        </button>
        <button
          onClick={() => setFilter("prospect")}
          className={filter === "prospect" ? styles.active : ""}
        >
          Prospects
        </button>
        <button
          onClick={() => setFilter("customer")}
          className={filter === "customer" ? styles.active : ""}
        >
          Clients
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Adresse</th>
            <th>Code postal</th>
            <th>Ville</th>
            <th>Création</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredCompanies.map((company) => (
            <tr key={company.id}>
              <td>{company.name}</td>
              <td>{company.address_street}</td>
              <td>{company.address_zip_code}</td>
              <td>{company.address_city}</td>
              <td>{new Date(company.creation_date).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => navigate(`/companies/${company.id}`)}
                  className={styles.actionButton}
                >
                  Voir
                </button>
                
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={handlePreviousPage}>Page précédente</button>
        <button onClick={handleNextPage}>Page suivante</button>
      </div>
    </div>
  );
}
