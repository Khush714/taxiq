import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
  author_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true);
        } else {
          setPost(data as Post);
          document.title = `${data.seo_title || data.title} — TaxSmart AI`;
          const meta = document.querySelector('meta[name="description"]');
          if (meta && (data.seo_description || data.excerpt)) {
            meta.setAttribute('content', (data.seo_description || data.excerpt || '').slice(0, 160));
          }
        }
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-lg">TaxSmart <span className="gold-gradient-text">AI</span></span>
          </Link>
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> All Posts
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : notFound || !post ? (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Post not found</h1>
            <Link to="/blog" className="text-primary hover:underline">← Back to blog</Link>
          </div>
        ) : (
          <article>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] uppercase tracking-wider">{t}</Badge>
                ))}
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground uppercase tracking-wider mb-8">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
              {post.author_name && <span>· By {post.author_name}</span>}
            </div>
            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full rounded-sm border border-border mb-8"
              />
            )}
            {post.excerpt && (
              <p className="text-lg text-muted-foreground italic border-l-2 border-primary pl-4 mb-8">{post.excerpt}</p>
            )}
            <div
              className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground/90"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </main>
    </div>
  );
};

export default BlogPost;
