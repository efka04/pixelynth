'use client'
import React, { useState } from 'react'
import { BsArrowsExpand, BsArrowBarRight, BsArrowBarDown } from 'react-icons/bs'

const orientationOptions = [
  { value: 'all', label: 'Any', icon: <BsArrowsExpand size={20} /> },
  { value: 'vertical', label: 'Vertical', icon: <BsArrowBarDown size={20} /> },
  { value: 'horizontal', label: 'Horizontal', icon: <BsArrowBarRight size={20} /> },
];

const SortOrientation = ({ selectedOrientation, onOrientationChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getCurrentOption = () => {
    return orientationOptions.find(option => option.value === selectedOrientation) || orientationOptions[0];
  };

  const handleSelect = (option) => {
    onOrientationChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-block w-[120px]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white border border-grey text-black px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <div className="flex items-center gap-2 truncate">
            {getCurrentOption().icon}
            <span className="truncate">{getCurrentOption().label}</span>
          </div>
        </button>

        <div className={`
          absolute left-0 right-0 top-full mt-2
          bg-white rounded-lg shadow-lg
          w-full
          transition-all duration-200 z-50
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}>
          <div className="py-2">
            {orientationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100
                  ${selectedOrientation === option.value ? 'text-black font-medium' : 'text-gray-600'}
                `}
              >
                {option.icon}
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortOrientation;
