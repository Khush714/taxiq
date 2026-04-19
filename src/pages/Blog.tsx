import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  author_name: string | null;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Blog — TaxSmart AI | Tax Strategies & Insights for India';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Expert tax-saving strategies, regime comparisons, and compliance insights for high-income Indian professionals.');

    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, tags, published_at, author_name')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-lg">TaxSmart <span className="gold-gradient-text">AI</span></span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <div className="font-mono text-primary text-xs mb-3 uppercase tracking-[0.3em]">Insights</div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3">
            Tax <span className="gold-gradient-text">Intelligence</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Strategies, regime guidance, and compliance updates for India's high-income professionals.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">No posts yet. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group border border-border rounded-sm overflow-hidden bg-card/30 hover:border-primary/40 transition-colors"
              >
                {post.cover_image_url && (
                  <div className="aspect-video overflow-hidden bg-secondary">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px] uppercase tracking-wider">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.excerpt}</p>}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {post.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {post.author_name && <span>· {post.author_name}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
