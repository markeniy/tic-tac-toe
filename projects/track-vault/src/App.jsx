import { useEffect, useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
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
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingTrackId, setEditingTrackId] = useState(null);

  useEffect(function () {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error loading session:', error);
        setIsSessionLoading(false);
        return;
      }

      setSession(data.session);
      setIsSessionLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(function (_event, nextSession) {
      setSession(nextSession);
      setIsSessionLoading(false);
    });

    return function () {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(function () {
    async function loadTracks() {
      if (!session?.user) {
        setTracks([]);
        return;
      }

      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tracks:', error);
        return;
      }

      setTracks(data || []);
    }

    loadTracks();
  }, [session]);

  function handleToggleForm() {
    if (isFormOpen) {
      setIsFormOpen(false);
      setEditingTrackId(null);
      setFormData(initialForm);
      return;
    }

    setEditingTrackId(null);
    setFormData(initialForm);
    setIsFormOpen(true);
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

    if (!session?.user) {
      return;
    }

    if (editingTrackId) {
      const { data, error } = await supabase
        .from('tracks')
        .update({
          title: formData.title,
          bpm: Number(formData.bpm),
          status: formData.status,
        })
        .eq('id', editingTrackId)
        .eq('user_id', session.user.id)
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
        user_id: session.user.id,
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
    if (!session?.user) {
      return;
    }

    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

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

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
    }
  }

  const filteredTracks =
    activeFilter === 'all'
      ? tracks
      : tracks.filter(function (track) {
          return track.status === activeFilter;
        });

  if (isSessionLoading) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="app-title">Track Vault</h1>
          <p className="auth-text">Loading...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return (
      <main className="app-shell">
        <div className="app-card">
          <div className="app-topbar">
            <Header trackCount={tracks.length} userEmail={session.user.email} />
            <div className="topbar-actions">
              <button type="button" className="add-track-button" onClick={handleToggleForm}>
                {isFormOpen ? 'Close Form' : 'Add Track'}
              </button>
              <button type="button" className="secondary-button" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          </div>

          {isFormOpen ? (
            <form className="track-form" onSubmit={handleSubmit}>
              <div className="section-heading form-heading">
                <p className="section-label">Track Editor</p>
                <h2 className="section-title">
                  {editingTrackId ? 'Refine Track Details' : 'Add New Track'}
                </h2>
              </div>

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
                {editingTrackId ? 'Update Track' : 'Save Track'}
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
