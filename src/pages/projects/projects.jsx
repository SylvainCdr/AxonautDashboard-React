import styles from "./style.module.scss";
import React, { useEffect, useState } from "react";
import { fetchProjects } from "../../services/api/projects";
import { useNavigate } from "react-router-dom";
import SearchProject from "../../components/searchProject/searchProject";
import { ScaleLoader } from "react-spinners";

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
        // Appel API sans limit, on gère cela côté client
        const data = await fetchProjects(page); // L'API retourne 500 éléments par page
        // On ne garde que les 50 premiers éléments
        const limitedData = data.slice(0, 50); // On limite à 50 éléments
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
      <header className={styles.header}>
        <h1>Gestion des Projets</h1>
        <SearchProject />
      </header>
      <main className={styles.projectList}>
        {projects.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <h2>{project.name}</h2>
            <p>
              <strong>ID : </strong> {project.id} <br />
              <strong>Numéro : </strong> {project.number} <br />
              <strong>Entreprise : </strong>{" "}
              {companies[project.company_id] || "Inconnue"}
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
