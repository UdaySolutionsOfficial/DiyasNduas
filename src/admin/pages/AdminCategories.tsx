import React, { useEffect, useState } from 'react';
import { categoriesService } from '../../services/categories.service';
import { Category, CategoryDraft } from '../../types/category';
import { CategoryModal } from '../components/CategoryModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Plus, Edit2, FolderTree } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.warn('[AdminCategories]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSaveCategory = async (draft: CategoryDraft, categoryId?: string) => {
    try {
      if (categoryId) {
        await categoriesService.updateCategory(categoryId, draft);
        toast.success('Category Updated', `"${draft.name}" updated successfully.`);
      } else {
        await categoriesService.createCategory(draft);
        toast.success('Category Created', `"${draft.name}" created successfully.`);
      }
      loadCategories();
    } catch (err) {
      console.error('[Save Category Error]', err);
    }
  };

  if (loading) {
    return <Loading message="Loading product categories..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Category Management</h1>
          <p className="text-sm text-slate-500">Organize diyas and lamps into browsing categories.</p>
        </div>

        <Button
          onClick={() => {
            setSelectedCategory(null);
            setIsModalOpen(true);
          }}
          variant="primary"
          size="md"
          className="font-bold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Category</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} glass className="p-4 flex flex-col justify-between space-y-3 rounded-2xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                    <FolderTree className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">{cat.name}</h3>
                </div>
                <Badge variant={cat.isActive ? 'success' : 'neutral'}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 line-clamp-2">{cat.description}</p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Sequence: #{cat.displayOrder || 1}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedCategory(cat);
                  setIsModalOpen(true);
                }}
                className="font-bold text-xs"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                <span>Edit</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
      />
    </div>
  );
};
