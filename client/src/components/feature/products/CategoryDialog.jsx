import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogCancelButton,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUploadField } from '@/components/shared/ImageUploadField'
import { BRAND } from '@/lib/constants'
import { useFormBaseline } from '@/hooks/useFormBaseline'

export function CategoryDialog({
  open,
  onOpenChange,
  mode = 'create',
  initial = null,
  title = 'Category',
  loading = false,
  onSubmit,
}) {
  const isEdit = mode === 'edit'
  const [name, setName] = useState('')
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const { captureBaseline, isDirty } = useFormBaseline(open)

  useEffect(() => {
    if (!open) return
    setError(null)
    const snapshot = { name: initial?.name || '', image: null }
    setImage(null)
    setName(snapshot.name)
    captureBaseline(snapshot)
  }, [open, initial, captureBaseline])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    const result = await onSubmit?.({ name: name.trim(), image })
    if (result?.success) onOpenChange?.(false)
    else if (result?.error) setError(result.error)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} dirty={isDirty({ name, image })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Edit ${title.toLowerCase()}` : `Add ${title.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>Set a name and optional image.</DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={`${title} name`}
            />
          </div>
          <ImageUploadField
            id="category-image"
            label="Image"
            optionalLabel="(optional)"
            value={image}
            existingImageUrl={isEdit ? initial?.imageUrl : null}
            onChange={setImage}
          />
          <DialogFooter>
            <DialogCancelButton className="cursor-pointer" />
            <Button
              type="submit"
              className="cursor-pointer text-white"
              style={{ background: BRAND.purple }}
              disabled={loading}
            >
              {loading ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SubCategoryDialog(props) {
  return <CategoryDialog {...props} title="Sub category" />
}
