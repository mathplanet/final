// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import AboutPage from "./components/AboutPage";
import LoginPage from "./components/LoginPage";
import ResourcesPage from "./components/ResourcesPage";
import LibraryPage from "./components/LibraryPage";
import AdminPage from "./components/AdminPage";
import ResultsPage from "./components/ResultsPage";
import "./App.css";  // 전체 공통 스타일

function App() {
  return (
    // ✅ Router로 전체 앱 감싸기
    <Router>
      <AuthProvider>
        {/* ✅ Navbar는 Router 내부에 있어야 Link가 정상 작동 */}
        <Navbar />

        {/* ✅ 페이지 전환 영역 */}
        <Routes>
          {/* 메인 페이지 */}
          <Route path="/" element={<Hero />} />

          {/* My Project 페이지 - 로그인 필요 */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* 공개 페이지 */}
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 관리자 페이지 - 관리자 권한 필요 */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          {/* Results 페이지 - 로그인 필요 */}
          <Route
            path="/results/:projectId"
            element={
              <ProtectedRoute>
                <ResultsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
