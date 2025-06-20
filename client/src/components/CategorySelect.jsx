import React from 'react';

export default function CategorySelect({ categories, onSelect }) {
  return (
    <div className="category-select-container">
      <h2>Select a Category</h2>
      <div className="category-buttons">
        {categories.map((cat) => (
          <button key={cat} onClick={() => onSelect(cat)}>
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
