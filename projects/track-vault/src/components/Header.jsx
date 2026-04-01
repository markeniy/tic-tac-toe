function Header({ trackCount, userEmail }) {
  return (
    <div className="header-block">
      <p className="auth-eyebrow">Track Vault</p>
      <h1 className="app-title">Private Release Suite</h1>
      <p className="header-subtitle">
        Premium control room for demos, mixes and release-ready records.
      </p>
      <div className="header-meta">
        <div className="header-chip">
          <span className="header-chip-label">Tracks</span>
          <strong>{trackCount}</strong>
        </div>
        <div className="header-chip">
          <span className="header-chip-label">Account</span>
          <strong>{userEmail}</strong>
        </div>
      </div>
    </div>
  );
}

export default Header;
