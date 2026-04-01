function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-orb" />
      <p className="empty-state-title">No tracks in your vault yet</p>
      <p className="empty-state-text">
        Add your first record to start building a private catalog of ideas, drafts,
        mixes and finished releases.
      </p>
    </div>
  );
}

export default EmptyState;
