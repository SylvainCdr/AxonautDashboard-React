import styles from "./style.module.scss";
import React, { useEffect, useState } from "react";
import { fetchCompanies } from "../../services/api/companies";
import { ScaleLoader } from "react-spinners";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1); // Gestion de la pagination

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const data = await fetchCompanies(page);
        setCompanies(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [page]);

  console.log("Données des entreprises :", companies);

  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        {/* Affichage du loader pendant le chargement */}
        <ScaleLoader color="#3498db" loading={loading} size={70} />
        <p>Chargement des entreprises...</p>
      </div>
    );
  }
  if (error) return <p>Erreur : {error}</p>;

  // {
  //   id: 29040704,
  //   name: 'ATEC MULTISERVICES',
  //   creation_date: '2024-10-29T10:59:27+01:00',
  //   address_street: '12 bis, rue Martin Deleuze ',
  //   address_zip_code: '93200',
  //   address_city: 'SAINT-DENIS ',
  //   address_region: null,
  //   address_country: '',
  //   comments: '',
  //   is_supplier: true,
  //   is_prospect: false,
  //   is_customer: false,
  //   currency: 'EUR',
  //   language: 'fr',
  //   thirdparty_code: null,
  //   intracommunity_number: 'FR44877736165',
  //   supplier_thirdparty_code: null,
  //   siret: '877 736 165 00011',
  //   internal_id: '',
  //   isB2C: false,
  //   business_manager: {
  //     id: 126982,
  //     name: 'Jessica FILIALI',
  //     email: 'jessica.filiali@pixecurity.com'
  //   },
  //   custom_fields: [],
  //   categories: [],
  //   employees: [],
  //   documents: []
  // },

  return (
    <div className={styles.companiesContainer}>
      <h1>Liste des entreprises</h1>

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
          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.name}</td>
              <td>{company.address_street}</td>
              <td>{company.address_zip_code}</td>
              <td>{company.address_city}</td>
              <td>{new Date(company.creation_date).toLocaleDateString()}</td>
              <td>
                <button>Voir</button>
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
