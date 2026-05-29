import React from 'react';

const sourceColors = {
  official: 'tag-official',
  builtin: 'tag-builtin',
  community: 'tag-community',
  local: 'tag-community',
};

const trustLabels = {
  builtin: 'OFFICIAL',
  trusted: 'TRUSTED',
  community: 'COMMUNITY',
};

export default function SkillList({ skills, searchResults, onView, onInstall, installing, marketplace }) {
  if (!skills || skills.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">{marketplace ? '⚡' : '—'}</span>
        <span>{marketplace ? 'SEARCH THE MARKETPLACE ABOVE' : 'NO SKILLS INSTALLED'}</span>
        {!marketplace && (
          <span className="empty-hint">Switch to the AVAILABLE tab to browse and install skills</span>
        )}
      </div>
    );
  }

  return (
    <div className="skills-grid">
      {skills.map((item, i) => {
        const isMarketplace = marketplace || item.identifier;
        const isInstalling = installing === item.identifier;

        return (
          <div
            key={item.name + (item.identifier || '')}
            className={`skill-card ${isMarketplace ? 'skill-card-marketplace' : ''}`}
            style={{ animationDelay: `${i * 30}ms` }}
            onClick={() => onView && onView(item)}
          >
            <div className="skill-card-header">
              <span className="skill-name">{item.name}</span>
              <span className={`skill-source-tag ${sourceColors[item.source] || 'tag-community'}`}>
                {item.source || 'marketplace'}
              </span>
            </div>

            {(item.category || item.description) && (
              <div className="skill-card-meta">
                {item.category && <span className="skill-category">{item.category}</span>}
                {item.description && (
                  <span className="skill-desc">{item.description.slice(0, 80)}{item.description.length > 80 ? '...' : ''}</span>
                )}
              </div>
            )}

            {isMarketplace && item.trust_level && (
              <div className="skill-card-meta">
                <span className={`skill-trust ${item.trust_level}`}>
                  {trustLabels[item.trust_level] || item.trust_level.toUpperCase()}
                </span>
                {item.identifier && (
                  <span className="skill-identifier">{item.identifier}</span>
                )}
              </div>
            )}

            <div className="skill-card-actions">
              {isMarketplace ? (
                item.installed ? (
                  <span className="action-installed">INSTALLED ✓</span>
                ) : (
                  <button
                    className="btn-install"
                    disabled={isInstalling}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInstall(item.identifier);
                    }}
                  >
                    {isInstalling ? 'INSTALLING...' : 'INSTALL'}
                  </button>
                )
              ) : (
                <span className="action-hint">CLICK FOR DETAILS →</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
