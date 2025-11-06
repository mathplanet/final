import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./ProjectTable.css";

const ROWS_PER_PAGE = 5;

const normalizeStatus = (status) => {
  if (!status) return "pending";
  const value = status.toString().toLowerCase();
  if (value === "진행중" || value === "진행 중") return "progress";
  if (value === "완료") return "completed";
  if (value === "대기" || value === "대기중") return "pending";
  return value;
};

function ProjectTable({ projects = [], onStatusChange }) {
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sortConfig, setSortConfig] = useState({ column: "created_at", direction: "desc" });

  const getSortableValue = (project, column) => {
    const source = column === "created_at"
      ? project.created_at || project.createdAt
      : project.updated_at || project.updatedAt;

    if (!source) {
      return 0;
    }

    const date = new Date(source);
    const timestamp = date.getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  };

  const sortedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];
    const mapped = [...projects];

    if (!sortConfig?.column) {
      return mapped;
    }

    mapped.sort((a, b) => {
      const aValue = getSortableValue(a, sortConfig.column);
      const bValue = getSortableValue(b, sortConfig.column);

      if (aValue === bValue) return 0;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return sortConfig.direction === "asc" ? -1 : 1;
    });

    return mapped;
  }, [projects, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedProjects.length / ROWS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [sortedProjects.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return sortedProjects.slice(start, start + ROWS_PER_PAGE);
  }, [sortedProjects, page]);

  const handleSort = (column) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column, direction: "desc" };
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString();
    } catch (error) {
      return value;
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axios.patch(
        `http://127.0.0.1:8000/api/projects/${id}/update/`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (onStatusChange) {
        onStatusChange(id, newStatus);
      }
      console.log("✅ 상태 변경 완료:", res.data);
    } catch (error) {
      console.error("❌ 상태 변경 실패:", error);
    }
  };

  const closeModal = () => setSelectedProject(null);

  return (
    <div className="recent-section">
      <table className="project-table">
        <thead>
          <tr>
            <th>프로젝트명</th>
            <th>상태</th>
            <th>
              <button
                type="button"
                className={`sortable-header ${
                  sortConfig.column === "created_at" ? "active" : ""
                }`}
                onClick={() => handleSort("created_at")}
              >
                생성일
                <span className="sort-indicator">
                  {sortConfig.column === "created_at"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </span>
              </button>
            </th>
            <th>
              <button
                type="button"
                className={`sortable-header ${
                  sortConfig.column === "updated_at" ? "active" : ""
                }`}
                onClick={() => handleSort("updated_at")}
              >
                업데이트일
                <span className="sort-indicator">
                  {sortConfig.column === "updated_at"
                    ? sortConfig.direction === "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedProjects.map((p) => (
            <tr key={p.id}>
              <td>
                <button
                  type="button"
                  className="project-title-button"
                  onClick={() => setSelectedProject(p)}
                >
                  {p.title}
                </button>
              </td>
              <td>
                <select
                  value={normalizeStatus(p.status)}
                  onChange={(e) => handleStatusChange(p.id, e.target.value)}
                >
                  <option value="progress">진행 중</option>
                  <option value="completed">완료</option>
                  <option value="pending">대기</option>
                </select>
              </td>
              <td>
                {formatDate(p.created_at || p.createdAt)}
              </td>
              <td>
                {formatDate(p.updated_at || p.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedProject && (
        <div className="project-modal-overlay" onClick={closeModal}>
          <div
            className="project-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="project-modal__header">
              <div>
                <h3>{selectedProject.title}</h3>
                <p>{formatDate(selectedProject.created_at || selectedProject.createdAt)} 생성</p>
              </div>
              <button
                type="button"
                className="project-modal__close"
                onClick={closeModal}
                aria-label="닫기"
              >
                ✕
              </button>
            </header>

            <dl className="project-modal__content">
              <div>
                <dt>상태</dt>
                <dd>{selectedProject.status || "정보 없음"}</dd>
              </div>
              <div>
                <dt>주거 형태</dt>
                <dd>{selectedProject.residence_type || "-"}</dd>
              </div>
              <div>
                <dt>공간 타입</dt>
                <dd>{selectedProject.space_type || "-"}</dd>
              </div>
              <div>
                <dt>예산 범위</dt>
                <dd>{selectedProject.budget_range || "-"}</dd>
              </div>
              <div>
                <dt>가족 구성</dt>
                <dd>{selectedProject.family_type || "-"}</dd>
              </div>
              <div>
                <dt>디자인 스타일</dt>
                <dd>{selectedProject.design_style || "-"}</dd>
              </div>
              <div>
                <dt>업데이트</dt>
                <dd>{formatDate(selectedProject.updated_at || selectedProject.updatedAt)}</dd>
              </div>
            </dl>

            <footer className="project-modal__footer">
              <button type="button" onClick={closeModal}>
                닫기
              </button>
            </footer>
          </div>
        </div>
      )}

      {projects.length > ROWS_PER_PAGE && (
        <div className="pagination-controls">
          <button
            type="button"
            className="pagination-button dark"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            <span className="chevron">‹</span> 이전
          </button>
          <span className="pagination-info dark">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="pagination-button dark"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            다음 <span className="chevron">›</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ProjectTable;
