"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { updateProductAction } from "./actions";

type Product = {
  id: string;
  name: string;
  category: string;
  durationDays: number;
  price: number;
  isActive: boolean;
};

export default function ProductEditModal({ product }: { product: Product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProductAction(formData);
      setIsOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        Edit
      </button>

      <Dialog isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Edit Product: ${product.name}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={product.id} />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              defaultValue={product.name}
              required
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category Tag
              </label>
              <input
                type="text"
                name="category"
                defaultValue={product.category}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Price (NPR)
              </label>
              <input
                type="number"
                step="0.01"
                name="price"
                defaultValue={product.price}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                name="durationDays"
                defaultValue={product.durationDays}
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                name="isActive"
                defaultValue={product.isActive ? "true" : "false"}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
