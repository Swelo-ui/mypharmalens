import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';

const Blog = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
            <SEOHead
                title="Healthcare Knowledge Base & articles | PharmaLens"
                description="Expert articles and guides on medication safety, drug combinations, pill identification, and general health advice."
                canonicalUrl="https://pharmalens.tech/blog"
            />

            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl mt-16 md:mt-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
                        Health <span className="text-pharma-600">Knowledge Base</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Expert guides and articles on medication safety, drug combinations, and understanding your prescriptions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {blogPosts.map((post) => (
                        <article key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                            <Link to={`/blog/${post.slug}`} className="block overflow-hidden relative group aspect-video">
                                {post.imageUrl ? (
                                    <img
                                        src={post.imageUrl}
                                        alt={post.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-pharma-100 dark:bg-pharma-900/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                        <BookOpen size={48} className="text-pharma-500 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-sm font-semibold px-3 py-1 rounded-full text-pharma-700 dark:text-pharma-300">
                                    {post.category}
                                </div>
                            </Link>

                            <div className="p-6 flex flex-col flex-grow">
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <span>{new Date(post.date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {post.readTime}
                                    </span>
                                </div>

                                <Link to={`/blog/${post.slug}`} className="group-hover:text-pharma-600">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 hover:text-pharma-600 dark:hover:text-pharma-400 transition-colors">
                                        {post.title}
                                    </h2>
                                </Link>

                                <p className="text-gray-600 dark:text-gray-400 mb-6 line-clamp-3 text-sm flex-grow">
                                    {post.excerpt}
                                </p>

                                <Link
                                    to={`/blog/${post.slug}`}
                                    className="inline-flex items-center gap-2 font-semibold text-pharma-600 dark:text-pharma-400 hover:text-pharma-700 dark:hover:text-pharma-300 mt-auto group"
                                >
                                    Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Blog;
