import React, { useState } from "react";
import { fetchProjects } from "../../services/api/projects";
import styles from "./style.module.scss";
import { BarLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";

export default function SearchProjects() {
  const [projects, setProjects] = useState([]); // Projets récupérés après recherche
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState(""); // Garde la recherche soumise
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // Nombre de projets par page
  const navigate = useNavigate(); // Hook pour la navigation

  const handleSearchSubmit = async () => {
    if (!search.trim()) return; // Ne rien faire si le champ est vide
    setLoading(true);
    setError(null);
    setSubmittedSearch(search); // Enregistre la recherche effectuée
    try {
      const data = await fetchProjects(); // Charger tous les projets
      const lowerSearch = search.toLowerCase();
      const filtered = data.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerSearch) ||
          project.number.toLowerCase().includes(lowerSearch)
      );
      setProjects(filtered);
      setPage(1); // Réinitialiser la pagination
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loaderContainer}>
        <BarLoader color="#4520ff" loading={loading} size={20} />
        <p>Recherche en cours...</p>
      </div>
    );
  }

  const handlePageChange = (direction) => {
    setPage((prevPage) => Math.max(1, prevPage + direction)); // Pagination (1 minimum)
  };

  const paginatedProjects = projects.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`); // Naviguer vers la page du projet
  };

  return (
    <div className={styles.searchProjectContainer}>
      <div className={styles.searchBar}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={handleKeyPress} // Recherche au clavier (Enter)
          placeholder="Nom ou numéro du projet"
        />
        <button onClick={handleSearchSubmit}>Rechercher</button>
      </div>

      {error && <p>Erreur : {error}</p>}

      {/* {!submittedSearch && !loading && <p>Veuillez entrer un terme de recherche.</p>} */}

      <div className={styles.searchResults}>
        {paginatedProjects.length > 0
          ? paginatedProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={styles.projectRow}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Numéro</th>
                      <th>Date de début</th>
                      <th>Date de fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{project.name}</td>
                      <td>{project.number}</td>
                      <td>{project.estimated_start}</td>
                      <td>{project.estimated_end}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          : submittedSearch &&
            !loading && <p>Aucun projet trouvé pour "{submittedSearch}".</p>}
      </div>

      {projects.length > itemsPerPage && (
        <div>
          <button onClick={() => handlePageChange(-1)} disabled={page <= 1}>
            Page précédente
          </button>
          <button
            onClick={() => handlePageChange(1)}
            disabled={page * itemsPerPage >= projects.length}
          >
            Page suivante
          </button>
        </div>
      )}
    </div>
  );
}
