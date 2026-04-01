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
          return (
            <article key={track.id} className="track-item">
              <h2 className="track-item-title">{track.title}</h2>
              <p className="track-item-text">BPM: {track.bpm}</p>
              <p className="track-item-text">Status: {track.status}</p>
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
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TrackList;
