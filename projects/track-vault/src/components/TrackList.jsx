import EmptyState from './EmptyState';

function TrackList({ tracks, onDelete, onEdit }) {
  if (tracks.length === 0) {
    return (
      <section className="track-list">
        <EmptyState />
      </section>
    );
  }

  return (
    <section className="track-list">
      <div className="track-items">
        {tracks.map(function (track) {
          const statusClassName = 'track-status-badge track-status-' + track.status;

          return (
            <article key={track.id} className="track-item">
              <div className="track-item-header">
                <div>
                  <h2 className="track-item-title">{track.title}</h2>
                  <p className="track-item-text">BPM: {track.bpm}</p>
                </div>
                <span className={statusClassName}>{track.status}</span>
              </div>

              <div className="track-item-actions">
                <button
                  type="button"
                  className="edit-track-button"
                  onClick={function () {
                    onEdit(track);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="delete-track-button"
                  onClick={function () {
                    onDelete(track.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TrackList;
