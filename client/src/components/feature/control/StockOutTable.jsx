import {
  MovementHistoryTable,
  movementImageNameColumns,
} from '@/components/feature/control/MovementHistoryTable'

export function StockOutTable({
  items,
  loading,
  pagination,
  onPageChange,
  className,
}) {
  const columns = [
    ...movementImageNameColumns(),
    {
      key: 'type',
      label: 'Type',
      render: (row) => <span className="capitalize text-slate-700">{row.type || '—'}</span>,
    },
    {
      key: 'qty',
      label: 'Stock-out qty',
      render: (row) => (
        <span className="font-semibold text-red-600">−{Math.abs(Number(row.quantity || 0))}</span>
      ),
    },
  ]

  return (
    <MovementHistoryTable
      title="Stock out history"
      description="Outbound stock removals"
      items={items}
      loading={loading}
      pagination={pagination}
      columns={columns}
      onPageChange={onPageChange}
      emptyTitle="No stock-out records"
      emptyHint="Record a stock-out when inventory leaves the warehouse."
      className={className}
    />
  )
}
