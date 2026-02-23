import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User, Tag, Info } from 'lucide-react';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import { blogPosts, BlogPost as BlogPostType } from '../data/blogPosts';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BlogPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPostType | null>(null);

    useEffect(() => {
        // In a real app, this might be an API call
        const foundPost = blogPosts.find(p => p.slug === slug) || null;
        setPost(foundPost);
        window.scrollTo(0, 0);
    }, [slug]);

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <div className="container mx-auto px-4 py-32 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">The health article you are looking for does not exist or has been moved.</p>
                    <Link to="/blog" className="inline-flex items-center gap-2 bg-pharma-600 text-white px-6 py-3 rounded-full hover:bg-pharma-700 transition-colors">
                        <ArrowLeft size={18} /> Back to Knowledge Base
                    </Link>
                </div>
            </div>
        );
    }

    // Creating JSON-LD schema for the Article
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        "headline": post.title,
        "description": post.excerpt,
        "author": {
            "@type": "Organization",
            "name": post.author
        },
        "datePublished": post.date,
        "image": post.imageUrl ? post.imageUrl : "https://pharmalens.tech/og-image.jpg"
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 md:pb-0">
            <SEOHead
                title={`${post.title} | PharmaLens Health`}
                description={post.excerpt}
                canonicalUrl={`https://pharmalens.tech/blog/${post.slug}`}
                structuredData={schemaData}
            />

            <Header />

            <main className="mt-16 md:mt-24 pb-16">
                {/* Hero section */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 py-12 md:py-20 mb-10">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <Link to="/blog" className="inline-flex items-center gap-2 text-pharma-600 dark:text-pharma-400 font-medium hover:underline mb-8">
                            <ArrowLeft size={16} /> Back to all articles
                        </Link>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="bg-pharma-100 text-pharma-700 dark:bg-pharma-900/30 dark:text-pharma-300 px-3 py-1 rounded-full text-sm font-semibold">
                                {post.category}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <User size={16} /> <span className="font-medium text-gray-900 dark:text-gray-200">{post.author}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} /> <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} /> <span>{post.readTime}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 max-w-4xl">
                    {post.imageUrl && (
                        <div className="w-full aspect-[21/9] bg-gray-100 rounded-2xl overflow-hidden mb-12 shadow-sm">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <article className="prose prose-lg dark:prose-invert prose-pharma max-w-none mb-16
                        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-a:text-pharma-600 dark:prose-a:text-pharma-400 prose-a:no-underline hover:prose-a:underline
                        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                        prose-li:text-gray-700 dark:prose-li:text-gray-300
                        prose-strong:text-gray-900 dark:prose-strong:text-white">
                        <Markdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg my-8 not-prose" {...props}>
                                        <div className="flex items-start gap-3">
                                            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-blue-900 dark:text-blue-100 text-lg italic">
                                                {props.children}
                                            </div>
                                        </div>
                                    </blockquote>
                                ),
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm not-prose">
                                        <table className="w-full text-left border-collapse" {...props} />
                                    </div>
                                ),
                                th: ({ node, ...props }) => (
                                    <th className="bg-gray-50 dark:bg-gray-800/80 p-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                    <td className="p-4 border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 last:border-0" {...props} />
                                ),
                                h2: ({ node, ...props }) => (
                                    <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-6 text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800" {...props} />
                                ),
                                h3: ({ node, ...props }) => (
                                    <h3 className="text-xl md:text-2xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-100" {...props} />
                                )
                            }}
                        >
                            {post.content}
                        </Markdown>
                    </article>

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-3 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <Tag size={18} className="text-gray-400" />
                        {post.tags.map(tag => (
                            <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BlogPost;
