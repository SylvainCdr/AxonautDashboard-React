import { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { NavLink } from "react-router-dom";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false); // État pour contrôler le menu burger

  // Gère l'ouverture et la fermeture du menu burger
  const burgerToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // Gère la fermeture du menu lorsque l'utilisateur clique sur un lien
  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  // Ferme le menu si on clique en dehors
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const nav = document.querySelector(`.${styles.nav}`);
      if (menuOpen && nav && !nav.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [menuOpen]);

  return (
    <div className={styles.headerContainer}>
      <nav className={`${styles.nav} ${menuOpen ? styles.active : ""}`}>
        <NavLink to="/" onClick={handleLinkClick}>
          <img
    src="https://files.pixecurity.com/wp-content/uploads/sites/2/2024/07/fav-pix.png"
    alt="ACCUEIL"
    className={styles.logo}
    loading="lazy"
    
  />
        </NavLink>
        <ul className={styles.navUl}>
          <li className={styles.navLi}>
            <NavLink
              to="/companies"
              onClick={handleLinkClick}
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
            >
              Entreprises
            </NavLink>
          </li>
          <li className={styles.navLi}>
            <NavLink
              to="/projects"
              onClick={handleLinkClick}
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
            >
              Projets
            </NavLink>
          </li>
          <li className={styles.navLi}>
            <NavLink
              to="/quotations"
              onClick={handleLinkClick}
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
            >
              Devis
            </NavLink>
          </li>
          <li className={styles.navLi}>
            <NavLink
              to="/test4"
              onClick={handleLinkClick}
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
            >
              test4
            </NavLink>
          </li>
        </ul>
        <div
          className={`${styles.header__burgerMenu} ${
            menuOpen ? styles.active : ""
          }`}
          onClick={burgerToggle}
        />
      </nav>
    </div>
  );
}

export default Header;
