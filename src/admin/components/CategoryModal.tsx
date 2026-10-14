import React, { useEffect, useState } from 'react';
import { Category, CategoryDraft } from '../../types/category';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Toggle } from '../../components/ui/Toggle';
import { Button } from '../../components/ui/Button';
import { FolderTree } from 'lucide-react';

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (draft: CategoryDraft, categoryId?: string) => Promise<void>;
  category?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setDisplayOrder(category.displayOrder || 1);
      setIsActive(category.isActive);
    } else {
      setName('');
      setDescription('');
      setDisplayOrder(1);
      setIsActive(true);
    }
    setError('');
  }, [category, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter category name.');
      return;
    }

    try {
      setSaving(true);
      const draft: CategoryDraft = {
        name: name.trim(),
        description: description.trim(),
        displayOrder: Number(displayOrder),
        isActive,
      };
      await onSave(draft, category?.id);
      onClose();
    } catch (err) {
      console.error('[CategoryModal]', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Edit Category' : 'Add New Category'}>
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Category Name *"
          placeholder="e.g. Terracotta Diyas, Brass Lamps, Sacred Puja Sets"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          leftIcon={<FolderTree className="w-4 h-4" />}
        />

        <Input
          label="Display Sequence Order"
          type="number"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(Number(e.target.value))}
        />

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief category description..."
            className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5"
          />
        </div>

        <Toggle label="Active Category" checked={isActive} onChange={setIsActive} />

        <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={saving} className="font-bold">
            {category ? 'Update Category' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
