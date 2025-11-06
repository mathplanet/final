import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import "../App.css";

/**
 * @param {Array} concepts - [{ id, title, description, imageUrl }]
 * @param {Function} onSelectionChange - callback(selectedIds)
 * @param {number} maxSelectable - maximum cards that can be selected
 * @param {Function} onRequestRefine - callback(conceptIndex)
 */
function DesignResultsGallery({
  concepts = [],
  onSelectionChange,
  maxSelectable = 9,
  defaultSelectedIds = [],
  onRequestRefine,
}) {
  const [selectedIds, setSelectedIds] = useState(defaultSelectedIds);

  useEffect(() => {
    setSelectedIds(defaultSelectedIds);
  }, [defaultSelectedIds]);

  const visibleConcepts = useMemo(
    () => concepts.slice(0, maxSelectable),
    [concepts, maxSelectable]
  );

  const toggleCard = (conceptId) => {
    setSelectedIds((prev) => {
      const already = prev.includes(conceptId);
      const next = already
        ? prev.filter((id) => id !== conceptId)
        : [...prev, conceptId];
      if (onSelectionChange) {
        onSelectionChange(next);
      }
      return next;
    });
  };

  return (
    <div className="design-results">
      <aside className="design-results__guide">
        <motion.div
          className="design-results__guide-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span className="design-results__guide-index">01.</span>
          <h3>생성된 디자인 프리뷰</h3>
          <p>고객 요청 조건을 반영해 생성된 최대 9개의 이미지를 제공합니다.</p>
        </motion.div>
        <motion.div
          className="design-results__guide-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="design-results__guide-index">02.</span>
          <h3>다중 선택 비교</h3>
          <p>마음에 드는 이미지를 복수로 선택해 비교하고 결과를 공유하세요.</p>
        </motion.div>
      </aside>

      <section className="design-results__panel">
        <header className="design-results__header">
          <div>
            <p className="design-results__step">Step 2 / 4 · 복수 선택 지원</p>
            <h2>Review &amp; Select Design Concepts</h2>
            <p className="design-results__description">
              원하는 카드를 선택하고 &lsquo;선택 완료&rsquo; 버튼을 눌러 다음 단계로
              이동하세요. 이미지를 클릭하면 Before/After 비교를 확인할 수 있습니다.
            </p>
          </div>
          <span className="design-results__badge">
            {selectedIds.length} / {Math.min(maxSelectable, concepts.length)}
          </span>
        </header>

        <motion.div
          className="design-results__grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {visibleConcepts.map((concept) => {
            const isSelected = selectedIds.includes(concept.id);
            const conceptIndex = concepts.findIndex((item) => item.id === concept.id);
            return (
              <motion.article
                key={concept.id}
                className={`design-card ${isSelected ? "is-selected" : ""}`}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                whileHover={{ y: -6 }}
                onClick={() => toggleCard(concept.id)}
              >
                <div className="design-card__image">
                  {concept.imageUrl ? (
                    <img src={concept.imageUrl} alt={concept.title} />
                  ) : (
                    <div className="design-card__placeholder">
                      <span role="img" aria-label="placeholder">
                        🖼️
                      </span>
                      이미지 준비 중
                    </div>
                  )}
                  <button
                    type="button"
                    className="design-card__checkbox"
                    aria-pressed={isSelected}
                  >
                    {isSelected ? "선택됨" : "선택"}
                  </button>
                </div>
                <div className="design-card__info">
                  <h3>{concept.title}</h3>
                  {concept.description && <p>{concept.description}</p>}
                  <div className="design-card__actions">
                    <button
                      type="button"
                      className="design-card__action"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (onRequestRefine && conceptIndex !== -1) {
                          onRequestRefine(conceptIndex);
                        }
                      }}
                    >
                      수정
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
          {visibleConcepts.length === 0 && (
            <div className="design-results__empty">
              생성된 디자인이 없습니다. 프로젝트를 생성하면 결과가 표시됩니다.
            </div>
          )}
        </motion.div>

        <footer className="design-results__footer">
          <button
            type="button"
            className="design-results__primary"
            disabled={selectedIds.length === 0}
          >
            선택 완료
          </button>
        </footer>
      </section>
    </div>
  );
}

export default DesignResultsGallery;
