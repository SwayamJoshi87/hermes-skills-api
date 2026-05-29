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
  const [themeId, setThemeId] = useState(() => localStorage.getItem(THEME_KEY) || 'neon');
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [view, setView] = useState('browse'); // browse | detail
  const [tab, setTab] = useState('installed'); // installed | available
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [installing, setInstalling] = useState(null);

  const theme = themes[themeId] || themes.neon;

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

  // Search marketplace when tab changes to "available"
  useEffect(() => {
    if (tab === 'available' && !searchResults) {
      handleMarketSearch('');
    }
  }, [tab]);

  // Search handler
  const handleMarketSearch = useCallback(async (q) => {
    setSearchQuery(q);
    setSearching(true);
    try {
      const data = await searchSkills(q || ' ');
      setSearchResults(data.results || []);
    } catch (e) {
      setActionMsg({ type: 'error', text: `Search failed: ${e.message}` });
    } finally {
      setSearching(false);
    }
  }, []);

  // Install handler
  const handleInstall = useCallback(async (identifier) => {
    setInstalling(identifier);
    setActionMsg({ type: 'info', text: 'Installing...' });
    try {
      await installSkill(identifier);
      setActionMsg({ type: 'success', text: 'Skill installed' });
      // Refresh list
      const data = await getAllSkills();
      setSkills(data.skills || []);
      // Mark as installed in search results
      if (searchResults) {
        setSearchResults(prev =>
          prev.map(r => r.identifier === identifier ? { ...r, installed: true } : r)
        );
      }
    } catch (e) {
      setActionMsg({ type: 'error', text: `Install failed: ${e.message}` });
    } finally {
      setInstalling(null);
    }
  }, [searchResults]);

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

  const installedSkills = skills.filter(s => s.installed !== false);
  const enabledCount = installedSkills.length;

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
            <span className="masthead-sub">SKILLS HUB</span>
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
                  {t.label}
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

        {/* Tab bar */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${tab === 'installed' ? 'active' : ''}`}
            onClick={() => { setTab('installed'); setSearchQuery(''); setSearchResults(null); }}
          >
            INSTALLED ({enabledCount})
          </button>
          <button
            className={`tab-btn ${tab === 'available' ? 'active' : ''}`}
            onClick={() => setTab('available')}
          >
            AVAILABLE
          </button>
        </div>

        <div className="section-rule" />

        {/* Main content */}
        <main className="content-area">
          {view === 'browse' && tab === 'installed' && (
            <SkillList
              skills={installedSkills}
              searchResults={null}
              onView={handleViewSkill}
              onInstall={handleInstall}
            />
          )}

          {view === 'browse' && tab === 'available' && (
            <>
              <div className="marketplace-search">
                <div className={`search-box ${searching ? 'searching' : ''}`}>
                  <input
                    type="text"
                    placeholder="SEARCH MARKETPLACE..."
                    value={searchQuery}
                    onChange={(e) => handleMarketSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Escape' && handleMarketSearch('')}
                  />
                  {searching && <span className="search-spinner" />}
                  <span className="search-icon">§</span>
                </div>
              </div>

              <div className="section-rule" style={{ marginBottom: 16 }} />

              {searchResults && searchResults.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">⚡</span>
                  <span>NO SKILLS FOUND</span>
                  <span className="empty-hint">Try a different search term</span>
                </div>
              ) : (
                <SkillList
                  skills={searchResults || []}
                  searchResults={null}
                  onView={null}
                  onInstall={handleInstall}
                  installing={installing}
                  marketplace
                />
              )}
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

        {/* Footer */}
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
