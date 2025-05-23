import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import styles from "./style.module.scss";

const container = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.4,
      staggerChildren: 0.3,
    },
  },
};

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
  },
};

function Homepage() {
  return (
    <motion.div
      className={styles.homepageContainer}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <div className={styles.logos}>
        {/* Animation spéciale pour l'image */}
        <motion.img
          src="assets/logo-clear.png"
          alt=""
          initial={{ scale: 0 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        />
        <p className={styles.cross}>X</p>
        {/* Animation spéciale pour l'image */}
        <motion.img
          src="assets/axo.png"
          alt=""
          initial={{ scale: 0 }}
          animate={{ rotate: 360, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        />
      </div>

      <motion.div className={styles.categories} variants={container}>
        <motion.div variants={item}>
          <Link to="/companies">Entreprises</Link>
        </motion.div>
        <motion.div variants={item}>
          <Link to="/quotations">
            Commmandes <br />& <br />
            Projets
          </Link>
        </motion.div>
        <motion.div variants={item}>
          <Link to="/billing">Facturation (beta)</Link>
        </motion.div>
        <motion.div variants={item}>
          <Link to="/">*</Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Homepage;
