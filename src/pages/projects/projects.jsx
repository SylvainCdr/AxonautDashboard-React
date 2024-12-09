import styles from "./style.module.scss";
import React, { useEffect, useState } from "react";
import { fetchProjects } from "../../services/api/projects";
import { ScaleLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import SearchProject from "../../components/searchProject/searchProject";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();

  const handleClickProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };
  
  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        setLoading(true);
        // Appel API sans limit, on gère cela côté client
        const data = await fetchProjects(page); // L'API retourne 500 éléments par page
        // On ne garde que les 50 premiers éléments
        const limitedData = data.slice(0, 25); // On limite à 50 éléments
        setProjects(limitedData);
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
        <ScaleLoader color="#3498db" loading={loading} size={70} />
        <p>Chargement des projets...</p>
      </div>
    );
  }

  if (error) return <p>Erreur : {error}</p>;

  return (
    <div className={styles.projectsContainer}>
      <h1>Gestion des Projets</h1>
      <SearchProject />
      <table >
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
              <td>{project.company_name || "Inconnue"}</td>
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
