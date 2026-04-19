import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Sparkles, LogOut, Plus, Edit, Trash2, ArrowLeft, Loader2, Upload, X } from 'lucide-react';

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  tags: string[];
  published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  author_name: string | null;
  published_at: string | null;
}

const empty: Omit<Post, 'id'> = {
  slug: '', title: '', excerpt: '', content: '', cover_image_url: '',
  tags: [], published: false, seo_title: '', seo_description: '',
  author_name: 'TaxSmart AI', published_at: null,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | (Omit<Post, 'id'> & { id?: string }) | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    else setPosts((data as Post[]) || []);
  };

  useEffect(() => { if (isAdmin) loadPosts(); }, [isAdmin]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        slug: editing.slug || slugify(editing.title),
        title: editing.title,
        excerpt: editing.excerpt,
        content: editing.content,
        cover_image_url: editing.cover_image_url,
        tags: editing.tags,
        published: editing.published,
        seo_title: editing.seo_title,
        seo_description: editing.seo_description,
        author_name: editing.author_name,
        published_at: editing.published ? (editing.published_at || new Date().toISOString()) : null,
      };
      if ('id' in editing && editing.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Post updated' });
      } else {
        const { error } = await supabase.from('blog_posts').insert(payload);
        if (error) throw error;
        toast({ title: 'Post created' });
      }
      setEditing(null);
      loadPosts();
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post permanently?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Post deleted' }); loadPosts(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('blog-images').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(path);
      setEditing({ ...editing, cover_image_url: publicUrl });
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const addTag = () => {
    if (!editing || !tagInput.trim()) return;
    setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    setTagInput('');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Not authorized</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            Your account ({user?.email}) doesn't have admin access. Ask the owner to grant you the admin role in the database.
          </p>
          <p className="text-xs font-mono text-muted-foreground mb-6 break-all">User ID: {user?.id}</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={signOut}>Sign out</Button>
            <Link to="/blog"><Button variant="ghost">Back to blog</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-serif font-bold text-lg">TaxSmart <span className="gold-gradient-text">Admin</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/blog"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" />Blog</Button></Link>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut className="w-4 h-4 mr-1" />Sign out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!editing ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-serif font-bold">Blog Posts</h1>
                <p className="text-sm text-muted-foreground">{posts.length} total</p>
              </div>
              <Button className="btn-gold" onClick={() => setEditing({ ...empty })}>
                <Plus className="w-4 h-4 mr-1" /> New Post
              </Button>
            </div>
            <div className="space-y-3">
              {posts.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">No posts yet. Create your first one.</Card>
              ) : posts.map((p) => (
                <Card key={p.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{p.title}</h3>
                      <Badge variant={p.published ? 'default' : 'secondary'} className="text-[10px]">
                        {p.published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">/{p.slug}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{('id' in editing && editing.id) ? 'Edit Post' : 'New Post'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                  placeholder="Your post title"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} placeholder="my-post-url" />
                <p className="text-xs text-muted-foreground mt-1">Will be: /blog/{editing.slug || 'your-slug'}</p>
              </div>
              <div>
                <Label>Excerpt</Label>
                <Textarea value={editing.excerpt || ''} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Short summary" rows={2} />
              </div>
              <div>
                <Label>Cover Image</Label>
                {editing.cover_image_url && (
                  <div className="relative w-full max-w-sm mb-2">
                    <img src={editing.cover_image_url} alt="Cover" className="w-full rounded border border-border" />
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, cover_image_url: '' })}
                      className="absolute top-2 right-2 bg-background/80 rounded-full p-1"
                    ><X className="w-4 h-4" /></button>
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded cursor-pointer hover:bg-secondary text-sm">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              <div>
                <Label>Content (HTML supported) *</Label>
                <Textarea
                  value={editing.content}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  placeholder="<h2>Heading</h2><p>Your content...</p>"
                  rows={14}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {editing.tags.map((t, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setEditing({ ...editing, tags: editing.tags.filter((_, j) => j !== i) })}>
                      {t} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SEO Title</Label>
                  <Input value={editing.seo_title || ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} placeholder="Optional, defaults to title" />
                </div>
                <div>
                  <Label>Author Name</Label>
                  <Input value={editing.author_name || ''} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>SEO Description</Label>
                <Textarea value={editing.seo_description || ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} placeholder="Max 160 chars" rows={2} maxLength={160} />
              </div>
              <div className="flex items-center gap-3 p-3 border border-border rounded">
                <Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                <div>
                  <p className="font-medium text-sm">{editing.published ? 'Published' : 'Draft'}</p>
                  <p className="text-xs text-muted-foreground">{editing.published ? 'Visible on the public blog' : 'Not visible to readers'}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="btn-gold flex-1" onClick={handleSave} disabled={saving || !editing.title || !editing.content}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Post
                </Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Admin;
