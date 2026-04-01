import { useEffect, useState } from 'react';
import './App.css';
import Header from './components/Header';
import StatusFilter from './components/StatusFilter';
import TrackList from './components/TrackList';
import { supabase } from './lib/supabase';

const initialForm = {
  title: '',
  bpm: '',
  status: 'idea',
};

function App() {
  const [tracks, setTracks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingTrackId, setEditingTrackId] = useState(null);

  useEffect(function () {
    async function loadTracks() {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tracks:', error);
        return;
      }

      setTracks(data || []);
    }

    loadTracks();
  }, []);

  function handleToggleForm() {
    setIsFormOpen(function (currentValue) {
      return !currentValue;
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData(function (currentForm) {
      return {
        ...currentForm,
        [name]: value,
      };
    });
  }

  function handleEdit(track) {
    setEditingTrackId(track.id);
    setFormData({
      title: track.title,
      bpm: String(track.bpm),
      status: track.status,
    });
    setIsFormOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (editingTrackId) {
      const { data, error } = await supabase
        .from('tracks')
        .update({
          title: formData.title,
          bpm: Number(formData.bpm),
          status: formData.status,
        })
        .eq('id', editingTrackId)
        .select()
        .single();

      if (error) {
        console.error('Error updating track:', error);
        return;
      }

      setTracks((prev) =>
        prev.map((track) =>
          track.id === editingTrackId ? data : track
        )
      );
    } else {
      const newTrack = {
        title: formData.title,
        bpm: Number(formData.bpm),
        status: formData.status,
      };

      const { data, error } = await supabase
        .from('tracks')
        .insert([newTrack])
        .select()
        .single();

      if (error) {
        console.error('Error adding track:', error);
        return;
      }

      setTracks(function (currentTracks) {
        return [data, ...currentTracks];
      });
    }

    setFormData(initialForm);
    setEditingTrackId(null);
    setIsFormOpen(false);
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('tracks').delete().eq('id', id);

    if (error) {
      console.error('Error deleting track:', error);
      return;
    }

    setTracks(function (previousTracks) {
      return previousTracks.filter(function (track) {
        return track.id !== id;
      });
    });
  }

  const filteredTracks =
    activeFilter === 'all'
      ? tracks
      : tracks.filter(function (track) {
          return track.status === activeFilter;
        });

  return (
    <main className="app-shell">
      <div className="app-card">
        <div className="app-topbar">
          <Header />
          <button type="button" className="add-track-button" onClick={handleToggleForm}>
            Add Track
          </button>
        </div>

        {isFormOpen ? (
          <form className="track-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter track title"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="bpm">BPM</label>
              <input
                id="bpm"
                name="bpm"
                type="number"
                value={formData.bpm}
                onChange={handleChange}
                placeholder="Enter BPM"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="idea">Idea</option>
                <option value="draft">Draft</option>
                <option value="mix">Mix</option>
                <option value="released">Released</option>
              </select>
            </div>

            <button type="submit" className="save-track-button">
              Save
            </button>
          </form>
        ) : null}

        <StatusFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <TrackList tracks={filteredTracks} onDelete={handleDelete} onEdit={handleEdit} />
      </div>
    </main>
  );
}

export default App;
