import React, { useState, useEffect, useRef } from 'react';
import { searchLocation } from '../../api/weather';
import { MapPin, Search, Loader2 } from 'lucide-react';

export const LocationAutocomplete = ({ value, onChange, onCoordinatesSelect, placeholder = "Search location..." }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // If value prop changes externally (e.g. edit mode initialization)
    if (value && value !== query && !selected) {
      setQuery(value);
      setSelected(true);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length >= 2 && !selected) {
        setLoading(true);
        const results = await searchLocation(query);
        setSuggestions(results);
        setShowDropdown(true);
        setLoading(false);
      } else {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, selected]);

  const handleSelect = (loc) => {
    const locationName = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}${loc.country ? ', ' + loc.country : ''}`;
    setQuery(locationName);
    setSelected(true);
    setShowDropdown(false);
    
    onChange(locationName);
    onCoordinatesSelect(loc.latitude, loc.longitude);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setSelected(false);
    onChange(e.target.value);
    onCoordinatesSelect(null, null); // Clear coordinates if they change text manually
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '36px', paddingRight: '36px' }}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          required
        />
        {loading && (
          <Loader2 size={16} className="spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginTop: '4px',
          zIndex: 50,
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map((loc, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(loc)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                borderBottom: idx !== suggestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <MapPin size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{loc.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showDropdown && !loading && query.length >= 2 && suggestions.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginTop: '4px',
          zIndex: 50,
          padding: '12px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '0.9rem'
        }}>
          No locations found.
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
