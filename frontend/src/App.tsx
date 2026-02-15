import { useState, useEffect, useCallback } from 'react';
import { KanbanCard, KanbanStatus, Column } from './types';
import { initOctokit, fetchIssues, updateIssueStatus, createStatusLabels } from './github';

const COLUMNS: { id: KanbanStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' },
];

function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('gh_token') || '');
  const [repo, setRepo] = useState<string>(() => localStorage.getItem('gh_repo') || '');
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(!token || !repo);
  const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);

  const loadIssues = useCallback(async () => {
    if (!token || !repo) return;
    
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      setError('Invalid repo format. Use owner/repo');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      initOctokit(token);
      const issues = await fetchIssues(owner, repoName);
      setCards(issues);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [token, repo]);

  useEffect(() => {
    if (token && repo && !showSetup) {
      loadIssues();
    }
  }, [token, repo, showSetup, loadIssues]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_repo', repo);
    setShowSetup(false);
  };

  const handleDragStart = (card: KanbanCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: KanbanStatus) => {
    if (!draggedCard || draggedCard.status === targetStatus) {
      setDraggedCard(null);
      return;
    }

    const [owner, repoName] = repo.split('/');
    
    // Optimistic update
    setCards(prev => 
      prev.map(card => 
        card.id === draggedCard.id 
          ? { ...card, status: targetStatus }
          : card
      )
    );

    try {
      await updateIssueStatus(
        owner,
        repoName,
        draggedCard.number,
        draggedCard.labels.map(l => l.name),
        targetStatus
      );
    } catch (err: unknown) {
      // Revert on error
      setCards(prev => 
        prev.map(card => 
          card.id === draggedCard.id 
            ? { ...card, status: draggedCard.status }
            : card
        )
      );
      const error = err as { message?: string };
      setError(error.message || 'Failed to update issue');
    }

    setDraggedCard(null);
  };

  const handleCreateLabels = async () => {
    const [owner, repoName] = repo.split('/');
    try {
      await createStatusLabels(owner, repoName);
      alert('Status labels created successfully!');
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to create labels');
    }
  };

  const columns: Column[] = COLUMNS.map(col => ({
    ...col,
    cards: cards.filter(card => card.status === col.id),
  }));

  if (showSetup) {
    return (
      <div className="setup-modal">
        <div className="setup-content">
          <h2>🎯 Kanban Dashboard Setup</h2>
          <p>
            Connect your GitHub repository to visualize issues as a Kanban board.
            Your token is stored locally and never sent to any server.
          </p>
          <form onSubmit={handleSetup}>
            <div className="form-group">
              <label>GitHub Personal Access Token</label>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                required
              />
            </div>
            <div className="form-group">
              <label>Repository (owner/repo)</label>
              <input
                type="text"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="mike-bottini-00/kanban-dashboard"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Connect Repository
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📋 Kanban Dashboard</h1>
        <div className="header-actions">
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            {repo}
          </span>
          <button className="btn btn-secondary" onClick={loadIssues} disabled={loading}>
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
          <button className="btn btn-secondary" onClick={handleCreateLabels}>
            🏷️ Create Labels
          </button>
          <button className="btn btn-secondary" onClick={() => setShowSetup(true)}>
            ⚙️ Settings
          </button>
        </div>
      </header>

      {error && (
        <div className="error">
          ❌ {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 10, background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && cards.length === 0 ? (
        <div className="loading">Loading issues...</div>
      ) : (
        <div className="kanban-board">
          {columns.map(column => (
            <div
              key={column.id}
              className="column"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className={`column-header ${column.id.toLowerCase().replace('_', '-')}`}>
                <span className="column-title">{column.title}</span>
                <span className="column-count">{column.cards.length}</span>
              </div>
              <div className="cards-container">
                {column.cards.map(card => (
                  <div
                    key={card.id}
                    className={`card ${draggedCard?.id === card.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={() => handleDragStart(card)}
                    onDragEnd={() => setDraggedCard(null)}
                  >
                    <div className="card-title">
                      <a 
                        href={card.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        {card.title}
                      </a>
                    </div>
                    <div className="card-meta">
                      <span className="card-number">#{card.number}</span>
                      {card.assignee && <span>@{card.assignee}</span>}
                    </div>
                    {card.labels.length > 0 && (
                      <div className="card-labels">
                        {card.labels
                          .filter(l => !l.name.startsWith('status:'))
                          .slice(0, 3)
                          .map(label => (
                            <span
                              key={label.name}
                              className="label"
                              style={{ backgroundColor: `#${label.color}` }}
                            >
                              {label.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
                {column.cards.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'rgba(255,255,255,0.3)',
                    padding: '40px 20px',
                    fontSize: '0.9rem'
                  }}>
                    No issues
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <footer style={{ 
        marginTop: 40, 
        textAlign: 'center', 
        color: 'rgba(255,255,255,0.3)',
        fontSize: '0.85rem'
      }}>
        Drag cards between columns to update GitHub issues • Built with ❤️
      </footer>
    </div>
  );
}

export default App;
