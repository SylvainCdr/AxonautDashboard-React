import styles from "./style.module.scss";
import React, { useEffect, useState } from "react";
import { fetchProjects } from "../../services/api/projects";
import { fetchCompanyById } from "../../services/api/companies";
import { GridLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import SearchProject from "../../components/searchProject/searchProject";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [companyCache, setCompanyCache] = useState(new Map());

  const navigate = useNavigate();

  const handleClickProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        setLoading(true);
        const data = await fetchProjects(page); // Charger les projets pour la page actuelle
        const limitedData = data.slice(0, 10); // Limiter à 15 projets
        setProjects(limitedData);

        // Charger les noms des entreprises
        const uniqueCompanyIds = [...new Set(limitedData.map((p) => p.company_id))];

        const companyPromises = uniqueCompanyIds.map(async (id) => {
          if (!companyCache.has(id)) {
            const companyData = await fetchCompanyById(id);
            companyCache.set(id, companyData.name); // Stocker le nom de l'entreprise
          }
        });

        await Promise.all(companyPromises);
        setCompanyCache(new Map(companyCache)); // Mettre à jour le cache
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjectsData();
  }, [page]);

 

  
  const handleNextPage = () => setPage((prev) => prev + 1);
  const handlePreviousPage = () => setPage((prev) => Math.max(prev - 1, 1));

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <GridLoader color="#4520ff" loading={loading} size={20} />
        <p>Chargement des projets...</p>
      </div>
    );
  }
  
  
  if (error) return <p>Erreur : {error}</p>;

  return (
    <div className={styles.projectsContainer}>
      <h1>Gestion des Projets</h1>
      <SearchProject />
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Numéro</th>
            <th>Entreprise</th>
            <th>Date Début</th>
            <th>Date Fin</th>
            <th>Revenus Estimés</th>
            <th>Revenus Réels</th>
            <th>Dépenses</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>{project.name}</td>
              <td>{project.number}</td>
              <td> {companyCache.get(project.company_id)}</td>
              <td>{new Date(project.estimated_start).toLocaleDateString()}</td>
              <td>{new Date(project.estimated_end).toLocaleDateString()}</td>
              <td>{project.estimated_revenue} €</td>
              <td>{project.actual_revenue.toFixed(2)} €</td>
              <td>{project.actual_expenses_cost.toFixed(2)} €</td>
              <td className={styles.actionCell}>
                <button onClick={() => handleClickProject(project.id)}>
                  Voir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className={styles.footer}>
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Page précédente
        </button>
        <button onClick={handleNextPage}>Page suivante</button>
      </footer>
    </div>
  );
}
