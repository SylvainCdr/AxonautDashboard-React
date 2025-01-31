import React, { useEffect, useState } from "react";
import { fetchCompanies } from "../../services/api/companies";
import { GridLoader } from "react-spinners";
import styles from "./style.module.scss";
import { useNavigate } from "react-router-dom";
import SearchCompany from "../../components/searchCompany/searchCompany";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

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

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={15} />
        <p>Chargement des entreprises...</p>
      </div>
    );
  }
  if (error) return <p>Erreur : {error}</p>;

  return (
    <div className={styles.companiesContainer}>
      <h1> <i class="fas fa-list"></i> {" "}Liste des entreprises</h1>

      <SearchCompany cachedCompanies={companies} />

      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Adresse</th>
            <th>Création</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td> <i class="fa-regular fa-building"></i> {"  "} {company.name}</td>
              <td>
                {
                  `${company.address_street || "N/A"}, ${
                    company.address_city || "N/A"
                  } (${company.address_zip_code || "N/A"})`.slice(0, 80)
                }
              </td>
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

      <div className={styles.paginationButtons}>
        <button onClick={handlePreviousPage}>Page précédente</button>
        <button onClick={handleNextPage}>Page suivante</button>
      </div>
    </div>
  );
}
