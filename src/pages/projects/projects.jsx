import styles from "./style.module.scss";
import React, { useEffect, useState } from "react";
import { fetchProjects } from "../../services/api/projects";
import { useNavigate } from "react-router-dom";
import SearchProject from "../../components/searchProject/searchProject";



export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState({});

  const navigate = useNavigate();

  const handleClickProject = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  useEffect(() => {
    const loadProjectsData = async () => {
      try {
        setLoading(true);
        const data = await fetchProjects(page);
        setProjects(data);
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

  if (loading) return <p>Chargement des projets...</p>;


  return (
    <div className={styles.projectsContainer}>
      <header className={styles.header}>
        <h1>Gestion des Projets</h1>

        <SearchProject />
        <p>Découvrez tous les projets en cours et finalisés.</p>
      </header>
      <main className={styles.projectList}>
        {projects.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <h2>{project.name}</h2>
            <p>
              <strong>ID : </strong> {project.id} <br />
              <strong>Numéro : </strong> {project.number} <br />
              <strong>Entreprise : </strong> {companies[project.company_id] || "Inconnue"}
            </p>
            <div className={styles.dates}>
              <span>
                <strong>Début : </strong> {project.estimated_start}
              </span>
              <span>
                <strong>Fin : </strong> {project.estimated_end}
              </span>
            </div>
            <div className={styles.financials}>
              <span>
                <strong>Revenus estimés : </strong> {project.estimated_revenue}€
              </span>
              <span>
                <strong>Revenus réels : </strong> {project.actual_revenue}€
              </span>
              <span>
                <strong>Dépenses : </strong> {project.actual_expenses_cost}€
              </span>
            </div>
            <button
              onClick={() => handleClickProject(project.id)}
              className={styles.detailsButton}
            >
              Voir les détails
            </button>
          </div>
        ))}
      </main>
      <footer className={styles.pagination}>
        <button onClick={handlePreviousPage} disabled={page === 1}>
          Page précédente
        </button>
        <button onClick={handleNextPage}>Page suivante</button>
      </footer>
    </div>
  );
}
