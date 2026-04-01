const statuses = [
  { value: 'all', label: 'All' },
  { value: 'idea', label: 'Idea' },
  { value: 'draft', label: 'Draft' },
  { value: 'mix', label: 'Mix' },
  { value: 'released', label: 'Released' },
];

function StatusFilter({ activeFilter, onFilterChange }) {
  return (
    <div className="status-filter-wrap">
      <div className="section-heading">
        <p className="section-label">Filter Library</p>
        <h2 className="section-title">Track Status</h2>
      </div>

      <div className="status-filter">
      {statuses.map(function (status) {
        return (
          <button
            key={status.value}
            type="button"
            className={
              activeFilter === status.value ? 'filter-button active' : 'filter-button'
            }
            onClick={function () {
              onFilterChange(status.value);
            }}
          >
            {status.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}

export default StatusFilter;
