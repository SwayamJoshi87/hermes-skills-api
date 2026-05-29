import React from 'react';

const sourceColors = {
  official: 'tag-official',
  builtin: 'tag-builtin',
  community: 'tag-community',
  local: 'tag-community',
};

export default function SkillList({ skills, searchResults, onView, onInstall }) {
  return (
    <div className="skills-grid">
      {/* Installed / built-in skills */}
      {skills.map((skill, i) => (
        <div
          key={skill.name}
          className="skill-card"
          style={{ animationDelay: `${i * 30}ms` }}
          onClick={() => onView(skill)}
        >
          <div className="skill-card-header">
            <span className="skill-name">{skill.name}</span>
            <span className={`skill-source-tag ${sourceColors[skill.source] || 'tag-community'}`}>
              {skill.source}
            </span>
          </div>
          <div className="skill-card-meta">
            <span className="skill-category">{skill.category}</span>
          </div>
          <div className="skill-card-actions">
            <span className="action-hint">CLICK FOR DETAILS →</span>
          </div>
        </div>
      ))}

      {/* Marketplace search results — only show ones not already installed */}
      {searchResults && searchResults
        .filter(r => !skills.some(s => s.name === r.name))
        .map((result, i) => (
          <div
            key={`sr-${result.name}`}
            className="skill-card skill-card-marketplace"
            style={{ animationDelay: `${(skills.length + i) * 30}ms` }}
          >
            <div className="skill-card-header">
              <span className="skill-name">{result.name}</span>
              <span className={`skill-source-tag ${sourceColors[result.source] || 'tag-community'}`}>
                {result.source}
              </span>
            </div>
            <div className="skill-card-meta">
              <span className="skill-identifier">{result.identifier}</span>
            </div>
            <div className="skill-card-actions">
              <button
                className="btn-install"
                onClick={(e) => {
                  e.stopPropagation();
                  onInstall(result.identifier);
                }}
              >
                INSTALL
              </button>
            </div>
          </div>
        ))}
    </div>
  );
}
