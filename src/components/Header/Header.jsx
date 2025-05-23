import { useState, useEffect } from "react";
import styles from "./style.module.scss";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebase";
import { toast } from "react-toastify";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false); // État pour contrôler le menu burger
  const navigate = useNavigate();

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Vous avez été déconnecté.");
      navigate("/"); // Redirige vers la page de connexion
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err.message);
      toast.error("Erreur lors de la déconnexion. Veuillez réessayer.", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  return (
    <div className={styles.headerContainer}>
      <nav className={`${styles.nav} ${menuOpen ? styles.active : ""}`}>
        <NavLink to="/home" onClick={handleLinkClick}>
          <img
            // src="https://uploads.pixecurity.com/files/fav-pix-shop_1.png"
            src="https://uploads.pixecurity.com/files/axopix.png"
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
              to="/quotations"
              onClick={handleLinkClick}
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
            >
              Commandes / Projets
            </NavLink>
          </li>
          <li className={styles.navLi}>
            <NavLink
              to="/billing"
              onClick={handleLinkClick}
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
            >
              Facturation
            </NavLink>
          </li>
          <button
            onClick={handleSignOut}
            className={styles.logoutButton}
            title="Déconnexion"
          >
            <img src="https://img.icons8.com/?size=30&id=24337&format=png&color=FFFFFF" alt="déconnexion" />
          </button>
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
