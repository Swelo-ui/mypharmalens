import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import { loadAllDrugs } from '../data/drugDataLoader';
import { Search } from 'lucide-react';

const DrugDirectory = () => {
    const [drugs, setDrugs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeLetter, setActiveLetter] = useState<string>('A');

    // Alphabet array for the A-Z navigation
    const alphabet = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    useEffect(() => {
        const fetchDrugs = async () => {
            try {
                const allDrugs = await loadAllDrugs();
                // Sort drugs alphabetically by name to ensure consistent grouping
                const sortedDrugs = allDrugs.sort((a, b) =>
                    a.name.localeCompare(b.name)
                );
                setDrugs(sortedDrugs);
            } catch (error) {
                console.error("Error loading drugs for directory:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrugs();
    }, []);

    // Use memoization to group drugs by their starting letter to optimizing rendering performance
    const groupedDrugs = useMemo(() => {
        const groups: { [key: string]: typeof drugs } = {};

        // Initialize all letters to empty arrays to prevent undefined errors
        alphabet.forEach(letter => {
            groups[letter] = [];
        });

        drugs.forEach(drug => {
            if (drug?.name) {
                let firstLetter = drug.name.charAt(0).toUpperCase();

                // Handle names that don't start with a letter (e.g., numbers)
                if (!alphabet.includes(firstLetter)) {
                    firstLetter = '#';
                    if (!groups['#']) groups['#'] = [];
                }

                groups[firstLetter].push(drug);
            }
        });

        return groups;
    }, [drugs]);

    return (
        <div className="min-h-screen bg-transparent pb-20 md:pb-0">
            <SEOHead
                title="A-Z Drug Directory - Complete Medication List | PharmaLens"
                description="Browse our comprehensive A-Z directory of over 1000+ prescription and over-the-counter medications. Find clinical information, uses, and side effects."
                canonicalUrl="/drugs"
            />

            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl mt-16 md:mt-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                            Medical Directory
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Comprehensive A-Z index of medications and clinical information.
                        </p>
                    </div>

                    <Link
                        to="/search"
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-full font-medium shadow-sm hover:shadow-md hover:border-pharma-300 transition-all active:scale-95"
                    >
                        <Search size={18} className="text-pharma-500" />
                        Search specific drug
                    </Link>
                </div>

                {/* A-Z Navigation Bar (Premium Glass Design with Scroll Buttons) */}
                <div className="relative mb-10 sticky top-20 md:top-24 z-10 group">
                    {/* Left Scroll Button (Hidden on Mobile) */}
                    <button
                        onClick={() => {
                            const container = document.getElementById('alphabet-scroll-container');
                            if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-4 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-pharma-600 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Scroll left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    </button>

                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 dark:border-gray-700/60 p-2 md:p-3 overflow-hidden">
                        <div
                            id="alphabet-scroll-container"
                            className="flex bg-transparent rounded-xl overflow-x-auto snap-x hide-scrollbar py-1 px-1 scroll-smooth"
                        >
                            <div className="flex flex-nowrap gap-1.5 md:gap-2 justify-start min-w-max mx-auto px-2 md:px-0">
                                {alphabet.map((letter) => {
                                    const count = groupedDrugs[letter]?.length || 0;
                                    const isActive = activeLetter === letter;

                                    return (
                                        <button
                                            key={letter}
                                            onClick={() => {
                                                setActiveLetter(letter);
                                                // Center the clicked letter slightly
                                                const btn = document.getElementById(`letter-btn-${letter}`);
                                                if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                            }}
                                            id={`letter-btn-${letter}`}
                                            disabled={count === 0}
                                            className={`
                                                snap-center shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-sm md:text-base font-semibold transition-all duration-300
                                                ${isActive
                                                    ? 'bg-gradient-to-br from-pharma-500 to-pharma-600 text-white shadow-lg shadow-pharma-500/30 transform scale-110'
                                                    : count > 0
                                                        ? 'bg-gray-50/80 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-pharma-50 dark:hover:bg-gray-700 hover:text-pharma-600 border border-transparent hover:border-pharma-200 dark:hover:border-gray-600'
                                                        : 'opacity-30 cursor-not-allowed bg-transparent text-gray-400 border border-dashed border-gray-200 dark:border-gray-700'
                                                }
                                            `}
                                            aria-label={`Show drugs starting with ${letter}`}
                                            aria-current={isActive ? 'page' : undefined}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Scroll Button (Hidden on Mobile) */}
                    <button
                        onClick={() => {
                            const container = document.getElementById('alphabet-scroll-container');
                            if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-4 z-20 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 text-gray-500 hover:text-pharma-600 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                        aria-label="Scroll right"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </button>

                    {/* Add basic style to hide scrollbar cross-browser */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        .hide-scrollbar::-webkit-scrollbar { display: none; }
                        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    `}} />
                </div>

                {/* Drug List Content */}
                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pharma-600"></div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                            <span className="bg-gradient-to-br from-pharma-500 to-pharma-600 text-white w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-sm">
                                {activeLetter}
                            </span>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                    Browse by Letter
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Displaying {groupedDrugs[activeLetter]?.length || 0} medications
                                </p>
                            </div>
                        </div>

                        {groupedDrugs[activeLetter]?.length > 0 ? (
                            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {groupedDrugs[activeLetter].map((drug) => (
                                    <li key={drug.id}>
                                        <Link
                                            to={`/drug/${drug.id}`}
                                            className="group flex flex-col p-4 rounded-xl transition-all duration-300 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm"
                                        >
                                            <span className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-pharma-600 dark:group-hover:text-pharma-400 truncate">
                                                {drug.name}
                                            </span>
                                            {drug.genericName && drug.genericName !== drug.name && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                                    {drug.genericName}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <Search className="text-gray-400" size={24} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No medications found</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                    We couldn't find any drugs starting with the letter <span className="font-bold">{activeLetter}</span> in our database.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default DrugDirectory;
