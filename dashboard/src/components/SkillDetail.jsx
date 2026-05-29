import React, { useState, useEffect } from 'react';
import { getSkill } from '../api';

export default function SkillDetail({ skill, onBack, onInstall, onUninstall }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSkill(skill.name);
        setDetail(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [skill.name]);

  if (loading) {
    return (
      <div className="detail-loading">
        <span className="loading-dot" />
        LOADING SKILL: {skill.name}
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <button className="btn-back" onClick={onBack}>← BACK</button>
        <div className="error-screen">
          <h1>LOAD FAILED</h1>
          <code>{error}</code>
        </div>
      </div>
    );
  }

  const fm = detail?.frontmatter || {};
  const body = detail?.body || '';

  return (
    <div className="skill-detail">
      <button className="btn-back" onClick={onBack}>← INDEX</button>

      <div className="detail-header">
        <div className="detail-title-row">
          <h1 className="detail-title">
            {skill.name}
            <span className="accent-dot">.</span>
          </h1>
          <span className={`skill-source-tag-large ${skill.source === 'official' ? 'tag-official' : skill.source === 'builtin' ? 'tag-builtin' : 'tag-community'}`}>
            {skill.source}
          </span>
        </div>

        <div className="detail-meta-grid">
          {fm.name && (
            <div className="meta-item">
              <span className="meta-label">NAME</span>
              <span className="meta-value">{fm.name}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">CATEGORY</span>
            <span className="meta-value">{skill.category}</span>
          </div>
          {fm.version && (
            <div className="meta-item">
              <span className="meta-label">VERSION</span>
              <span className="meta-value">{fm.version}</span>
            </div>
          )}
          {fm.author && (
            <div className="meta-item">
              <span className="meta-label">AUTHOR</span>
              <span className="meta-value">{fm.author}</span>
            </div>
          )}
          {fm.license && (
            <div className="meta-item">
              <span className="meta-label">LICENSE</span>
              <span className="meta-value">{fm.license}</span>
            </div>
          )}
          {fm.description && (
            <div className="meta-item meta-item-full">
              <span className="meta-label">DESCRIPTION</span>
              <span className="meta-value">{fm.description}</span>
            </div>
          )}
          {fm.metadata?.hermes?.tags && (
            <div className="meta-item meta-item-full">
              <span className="meta-label">TAGS</span>
              <div className="tags-list">
                {fm.metadata.hermes.tags.map(tag => (
                  <span key={tag} className="tag-pill">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {fm.metadata?.hermes?.related_skills && (
            <div className="meta-item meta-item-full">
              <span className="meta-label">RELATED SKILLS</span>
              <div className="tags-list">
                {fm.metadata.hermes.related_skills.map(rs => (
                  <span key={rs} className="tag-pill tag-pill-related">{rs}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="detail-actions">
          {skill.source === 'builtin' && (
            <span className="action-note">BUILT-IN — NO INSTALL NEEDED</span>
          )}
          {(skill.source === 'official' || skill.source === 'hub') && (
            <>
              <button className="btn-install" onClick={() => onInstall(skill.identifier || skill.name)}>
                REINSTALL
              </button>
              <button className="btn-danger" onClick={() => onUninstall(skill.name)}>
                UNINSTALL
              </button>
            </>
          )}
          {skill.identifier && skill.source === 'community' && (
            <button className="btn-install" onClick={() => onInstall(skill.identifier)}>
              INSTALL
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="detail-body">
        <div className="section-rule" />
        <pre className="skill-body">{body}</pre>
        <div className="section-rule" />
      </div>
    </div>
  );
}
