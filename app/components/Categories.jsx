import { categories } from '@/app/utils/constants';
import { useState } from 'react';

export default function Categories({ onSelectCategory }) {
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    onSelectCategory(category);
  };

  return (
    <div className="flex overflow-x-auto gap-4 py-4 px-6 border-b">
      <button 
        onClick={() => handleCategoryClick('')}
        className={`whitespace-nowrap px-4 py-2 rounded-full ${
          selectedCategory === '' ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryClick(category)}
          className={`whitespace-nowrap px-4 py-2 rounded-full ${
            selectedCategory === category ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}