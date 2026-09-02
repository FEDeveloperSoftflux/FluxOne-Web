import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Pick existing catalog items to include in a bundle.
 
export function BundleItemPicker({
  catalogItems = [],
  value = [],
  onChange,
  excludeId = null,
  className,
}) {
  const options = catalogItems.filter(
    (item) => item.id !== excludeId && item.type !== 'bundle',
  )

  const usedItemIds = new Set(value.map((row) => row.itemId).filter(Boolean))

  function optionsForRow(rowIndex) {
    const currentId = value[rowIndex]?.itemId
    return options.filter((item) => item.id === currentId || !usedItemIds.has(item.id))
  }

  function addRow() {
    if (!options.length) return
    onChange?.([...value, { itemId: '', quantity: 1 }])
  }

  function patch(index, field, nextValue) {
    const next = value.map((row, i) =>
      i === index ? { ...row, [field]: nextValue } : row,
    )
    onChange?.(next)
  }

  function remove(index) {
    onChange?.(value.filter((_, i) => i !== index))
  }

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label>Bundle items</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer"
          onClick={addRow}
          disabled={!options.length || usedItemIds.size >= options.length}
        >
          <Plus className="size-3.5" />
          Add item
        </Button>
      </div>

      {!options.length ? (
        <p className="text-xs text-slate-400">
          Create at least one single item before building a bundle.
        </p>
      ) : null}

      <div className="space-y-2">
        {value.map((row, index) => (
          <div key={`bundle-row-${index}`} className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <NativeSelect
                value={row.itemId || ''}
                onChange={(event) => patch(index, 'itemId', event.target.value)}
              >
                <option value="">Select item…</option>
                {optionsForRow(index).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.itemCode})
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="w-24 space-y-1">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={row.quantity}
                onChange={(event) => patch(index, 'quantity', Number(event.target.value))}
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="cursor-pointer text-red-600"
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
