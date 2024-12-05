import React, { useState, useEffect } from "react";
import { fetchProjects } from "../../services/api/projects";

export default function SearchProjects() {
  const [allProjects, setAllProjects] = useState([]); // Tous les projets
  const [filteredProjects, setFilteredProjects] = useState([]); // Projets filtrés
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10; // Nombre de projets par page

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProjects();
        setAllProjects(data); // Charger tous les projets
        setFilteredProjects(data); // Initialement, pas de filtre
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  useEffect(() => {
    // Filtrer les projets lorsque la recherche change
    const lowerSearch = search.toLowerCase();
    const filtered = allProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(lowerSearch) ||
        project.number.toLowerCase().includes(lowerSearch)
    );
    setFilteredProjects(filtered);
    setPage(1); // Réinitialiser la pagination
  }, [search, allProjects]);

  const paginatedProjects = filteredProjects.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleSearch = (e) => {
    setSearch(e.target.value); // Met à jour le texte de recherche
  };

  const handlePageChange = (direction) => {
    setPage((prevPage) => Math.max(1, prevPage + direction)); // Pagination (1 minimum)
  };

  return (
    <div>
      <h1>Rechercher des projets</h1>
      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Nom ou numéro du projet"
      />
      <button onClick={() => handlePageChange(-1)} disabled={page <= 1}>
        Page précédente
      </button>
      <button
        onClick={() => handlePageChange(1)}
        disabled={page * itemsPerPage >= filteredProjects.length}
      >
        Page suivante
      </button>

      {loading && <p>Chargement...</p>}
      {error && <p>Erreur : {error}</p>}

      <div>
        {paginatedProjects.length > 0 ? (
          paginatedProjects.map((project) => (
            <div key={project.id}>
              <h2>{project.name}</h2>
              <p>Numéro : {project.number}</p>
            </div>
          ))
        ) : (
          !loading && <p>Aucun projet trouvé.</p>
        )}
      </div>
    </div>
  );
}
