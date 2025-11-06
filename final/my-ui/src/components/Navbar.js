import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import "../App.css";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  // 현재 경로가 활성 메뉴인지 확인
  const isActive = (path) => {
    return location.pathname === path;
  };

  // 로그아웃 처리
  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      logout();
      navigate("/");
      alert("로그아웃 되었습니다.");
    }
  };

  return (
    <motion.nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(10, 10, 10, 0.95)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        padding: "16px 40px",
        boxShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        borderBottom: "1px solid rgba(255, 107, 53, 0.2)",
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px" }}>
        <motion.div
          style={{
            width: "45px",
            height: "45px",
            background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            fontWeight: 900,
            color: "#fff",
            boxShadow: "0 4px 10px rgba(255, 107, 53, 0.3)",
            lineHeight: "0.85",
            paddingBottom: "2px",
          }}
          whileHover={{ scale: 1.05, boxShadow: "0 6px 15px rgba(255, 107, 53, 0.4)" }}
          whileTap={{ scale: 0.95 }}
        >
          A
        </motion.div>
        <motion.h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            margin: 0,
            background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            cursor: "pointer",
            letterSpacing: "-0.5px",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ASSEMBLE
        </motion.h1>
      </Link>

      {/* Navigation Menu */}
      <ul
        style={{
          display: "flex",
          gap: "8px",
          listStyle: "none",
          margin: 0,
          padding: 0,
          alignItems: "center",
        }}
      >
        {[
          { path: "/projects", label: "My Project" },
          { path: "/resources", label: "Resources" },
          { path: "/library", label: "Library" },
          { path: "/about", label: "About Us" },
          ...(isAdmin ? [{ path: "/admin", label: "Admin" }] : []),
        ].map((item) => (
          <li key={item.path}>
            <Link to={item.path} style={{ textDecoration: "none" }}>
              <motion.div
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: isActive(item.path) ? "#fff" : "rgba(255, 255, 255, 0.8)",
                  background: isActive(item.path)
                    ? "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  position: "relative",
                }}
                whileHover={{
                  scale: 1.05,
                  backgroundColor: isActive(item.path) ? undefined : "rgba(255, 255, 255, 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
                {isActive(item.path) && (
                  <motion.div
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "60%",
                      height: "3px",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: "2px",
                    }}
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Login/Logout Button */}
      {isAuthenticated ? (
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <span style={{ fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.8)", fontWeight: 500 }}>
            {(user?.name || user?.user_id || "사용자") + "님"}
          </span>
          <motion.button
            onClick={handleLogout}
            style={{
              padding: "10px 28px",
              border: "2px solid transparent",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
              transition: "all 0.3s ease",
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 6px 20px rgba(255, 107, 53, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Logout
          </motion.button>
        </div>
      ) : (
        <Link to="/login" style={{ textDecoration: "none" }}>
          <motion.button
            style={{
              padding: "10px 28px",
              border: "2px solid transparent",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
              transition: "all 0.3s ease",
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 6px 20px rgba(255, 107, 53, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
        </Link>
      )}
    </motion.nav>
  );
}

export default Navbar;
