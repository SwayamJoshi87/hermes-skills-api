import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import themes from './themes';
import SkillList from './components/SkillList';
import SkillDetail from './components/SkillDetail';
import { getAllSkills, getHealth, searchSkills, installSkill, uninstallSkill } from './api';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

const THEME_KEY = 'hermes-dashboard-theme';

export default function App() {
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_KEY) || 'dossier');
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [view, setView] = useState('browse'); // browse | detail
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [apiStatus, setApiStatus] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const theme = themes[themeId];

  // Apply CSS variables
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
    localStorage.setItem(THEME_KEY, themeId);
  }, [themeId, theme.vars]);

  // Load all skills on mount
  useEffect(() => {
    (async () => {
      try {
        const [healthData, skillsData] = await Promise.all([
          getHealth().catch(() => null),
          getAllSkills(),
        ]);
        setApiStatus(healthData);
        setSkills(skillsData.skills || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Search handler
  const handleSearch = useCallback(async (q) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await searchSkills(q);
      setSearchResults(data.results || []);
    } catch (e) {
      setActionMsg({ type: 'error', text: `Search failed: ${e.message}` });
    } finally {
      setSearching(false);
    }
  }, []);

  // Install handler
  const handleInstall = useCallback(async (identifier) => {
    setActionMsg({ type: 'info', text: 'Installing...' });
    try {
      await installSkill(identifier);
      setActionMsg({ type: 'success', text: 'Skill installed' });
      // Refresh list
      const data = await getAllSkills();
      setSkills(data.skills || []);
    } catch (e) {
      setActionMsg({ type: 'error', text: `Install failed: ${e.message}` });
    }
  }, []);

  // Uninstall handler
  const handleUninstall = useCallback(async (name) => {
    if (!window.confirm(`Uninstall "${name}"?`)) return;
    setActionMsg({ type: 'info', text: 'Uninstalling...' });
    try {
      await uninstallSkill(name);
      setActionMsg({ type: 'success', text: 'Skill uninstalled' });
      const data = await getAllSkills();
      setSkills(data.skills || []);
      if (selectedSkill?.name === name) {
        setSelectedSkill(null);
        setView('browse');
      }
    } catch (e) {
      setActionMsg({ type: 'error', text: `Uninstall failed: ${e.message}` });
    }
  }, [selectedSkill]);

  // View skill detail
  const handleViewSkill = useCallback((skill) => {
    setSelectedSkill(skill);
    setView('detail');
  }, []);

  // Back to browse
  const handleBack = useCallback(() => {
    setView('browse');
    setSelectedSkill(null);
  }, []);

  // Clear action message after 4s
  useEffect(() => {
    if (actionMsg) {
      const t = setTimeout(() => setActionMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionMsg]);

  // Filter skills
  const categories = [...new Set(skills.map(s => s.category))].sort();
  const filteredSkills = skills.filter(s => {
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (sourceFilter !== 'all' && s.source !== sourceFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes }}>
        <div className="app">
          <div className="loading-screen">
            <span className="loading-dot" />
            INITIALIZING HERMES SKILLS DATABASE
            <span className="loading-dot" />
          </div>
        </div>
      </ThemeContext.Provider>
    );
  }

  if (error) {
    return (
      <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes }}>
        <div className="app">
          <div className="error-screen">
            <h1>CONNECTION FAILED</h1>
            <p>Cannot reach API at /api/health</p>
            <code>{error}</code>
          </div>
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes }}>
      <div className="app">
        {/* Masthead */}
        <header className="masthead">
          <div className="masthead-left">
            <span className="masthead-title">HERMES<span className="accent-dot">.</span></span>
            <span className="masthead-sub">SKILLS DASHBOARD</span>
          </div>
          <div className="masthead-center">
            <div className={`search-box ${searching ? 'searching' : ''}`}>
              <input
                type="text"
                placeholder="SEARCH SKILLS..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setSearchQuery('') && setSearchResults(null)}
              />
              {searching && <span className="search-spinner" />}
              <span className="search-icon">§</span>
            </div>
          </div>
          <div className="masthead-right">
            <span className={`status-indicator ${apiStatus ? 'online' : 'offline'}`} />
            <span className="status-label">{apiStatus ? 'ONLINE' : 'OFFLINE'}</span>
            <span className="divider">|</span>
            <span className="stat">{skills.length} SKILLS</span>
            <span className="divider">|</span>
            {/* Theme Switcher */}
            <div className="theme-switcher">
              {Object.values(themes).map(t => (
                <button
                  key={t.id}
                  className={`theme-btn ${themeId === t.id ? 'active' : ''}`}
                  onClick={() => setThemeId(t.id)}
                  title={t.description}
                >
                  {t.id === 'dossier' ? 'DOS' : t.id === 'industrial' ? 'IND' : 'CHS'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Action message toast */}
        {actionMsg && (
          <div className={`toast toast-${actionMsg.type}`}>
            {actionMsg.text}
          </div>
        )}

        {/* Section rule */}
        <div className="section-rule" />

        {/* Main content */}
        <main className="content-area">
          {view === 'browse' && (
            <>
              {/* Filters bar */}
              <div className="filters-bar">
                <div className="filter-group">
                  <span className="filter-label">CATEGORY</span>
                  <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="all">ALL ({skills.length})</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c.toUpperCase()} ({skills.filter(s => s.category === c).length})</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <span className="filter-label">SOURCE</span>
                  <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
                    <option value="all">ALL</option>
                    <option value="official">OFFICIAL</option>
                    <option value="builtin">BUILT-IN</option>
                    <option value="community">COMMUNITY</option>
                  </select>
                </div>
                {searchResults && (
                  <span className="search-count">
                    MARKETPLACE: {searchResults.length} RESULTS
                  </span>
                )}
              </div>

              {/* Skills grid */}
              <SkillList
                skills={filteredSkills}
                searchResults={searchResults}
                onView={handleViewSkill}
                onInstall={handleInstall}
              />
            </>
          )}

          {view === 'detail' && selectedSkill && (
            <SkillDetail
              skill={selectedSkill}
              onBack={handleBack}
              onInstall={handleInstall}
              onUninstall={handleUninstall}
            />
          )}
        </main>

        {/* Footer rule */}
        <div className="section-rule" />
        <footer className="footer">
          <span>REV. {new Date().toISOString().slice(0, 10)}</span>
          <span>API: {apiStatus?.status || 'UNKNOWN'}</span>
          <span>INDEX: {String(skills.length).padStart(4, '0')}</span>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
}
