import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, Tag, Type, Image as ImageIcon, Loader2, Edit3 } from 'lucide-react';
import { cn } from '../lib/utils';

const CATEGORIES = ['Electronics', 'Documents', 'Books', 'Clothing', 'Keys', 'Wallets', 'Others'];

export default function PostItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    location: '',
    type: 'lost' as 'lost' | 'found'
  });
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (image) data.append('image', image);

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: data
      });
      if (res.ok) {
        navigate('/listings');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="p-8 space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Report an Item</h1>
            <p className="text-muted-foreground">Provide as many details as possible to help others identify it.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex p-1 bg-muted rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'lost' })}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                  formData.type === 'lost' ? "bg-background shadow-sm text-red-600" : "text-muted-foreground"
                )}
              >
                LOST
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'found' })}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                  formData.type === 'found' ? "bg-background shadow-sm text-green-600" : "text-muted-foreground"
                )}
              >
                FOUND
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center text-foreground"><Package className="w-4 h-4 mr-2" /> Item Title</label>
                <input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-4 bg-secondary border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                  placeholder="e.g. Blue Backpack, iPhone 13"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center text-foreground"><Tag className="w-4 h-4 mr-2" /> Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-4 bg-secondary border border-border rounded-2xl outline-none text-foreground"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center text-foreground"><MapPin className="w-4 h-4 mr-2" /> Location</label>
                  <input
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-4 bg-secondary border border-border rounded-2xl outline-none text-foreground"
                    placeholder="e.g. Library, Cafeteria"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center text-foreground"><Edit3 className="w-4 h-4 mr-2" /> Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-4 bg-secondary border border-border rounded-2xl h-32 outline-none text-foreground"
                  placeholder="Describe the item, including any unique marks or features..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center text-foreground"><ImageIcon className="w-4 h-4 mr-2" /> Photo</label>
                <div 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full aspect-video bg-secondary border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-all overflow-hidden"
                >
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                    </>
                  )}
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImage(file);
                      setPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
