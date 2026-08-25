export function DesignationsPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Designations</h1>
      <p className="text-sm text-muted-foreground">
        Designation list shell — create/list designations used by staff next.
      </p>
    </div>
  )
}

/** @deprecated Prefer DesignationsPage — kept for older imports */
export const Designations = DesignationsPage
export default DesignationsPage
