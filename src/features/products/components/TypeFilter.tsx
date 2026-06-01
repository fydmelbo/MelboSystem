import React, { useState, useRef, useEffect } from 'react';

interface TypeFilterProps {
    types: string[];
    selectedTypes: string[];
    onTypeChange: (types: string[]) => void;
    onFilter: () => void;
}

export default function TypeFilter({ types, selectedTypes, onTypeChange, onFilter }: TypeFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredTypes = types.filter(type =>
        type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleTypeClick = (type: string) => {
        const newSelectedTypes = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];
        onTypeChange(newSelectedTypes);
    };

    return (
        <div className="flex gap-2 items-start">
            <div className="relative" ref={dropdownRef}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={() => setIsOpen(true)}
                    placeholder="Buscar por tipo..."
                    className="px-3 py-2 border rounded-md text-gray-700 w-full"
                />
                {selectedTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {selectedTypes.map(type => (
                            <span
                                key={type}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                                {type}
                                <button
                                    onClick={() => handleTypeClick(type)}
                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredTypes.map((type) => (
                            <div
                                key={type}
                                className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedTypes.includes(type) ? 'bg-blue-50' : ''
                                    }`}
                                onClick={() => {
                                    handleTypeClick(type);
                                    setSearchTerm('');
                                }}
                            >
                                {type}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button
                onClick={() => {
                    onFilter();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={selectedTypes.length === 0}
            >
                Filtrar
            </button>
        </div>
    );
}