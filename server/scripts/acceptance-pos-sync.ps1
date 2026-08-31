$base = "https://fluxone-b2b.onrender.com/api"
$wahBranch = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
$haripurBranch = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"

function Invoke-Api($Method, $Path, $Body = $null, $Token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $uri = "$base$Path"
  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body ($Body | ConvertTo-Json -Depth 10)
  }
  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

Write-Host "=== TEST 1 BM login ==="
$login = Invoke-Api POST "/auth/login" @{ id = "branch.wah@companya.local"; password = "password" }
$login | ConvertTo-Json -Depth 6
if (-not $login.data.accessToken) { throw "Test 1 failed: missing accessToken" }
if ($login.data.branches.Count -ne 1) { throw "Test 1 failed: branches length != 1" }
$bmToken = $login.data.accessToken

Write-Host "`n=== TEST 2 BM bootstrap Wah ==="
$bootstrap = Invoke-Api GET "/sync/bootstrap?branchId=$wahBranch" $null $bmToken
$bootstrap | ConvertTo-Json -Depth 4 -Compress
if (-not $bootstrap.success) { throw "Test 2 failed" }
$bmUsers = @($bootstrap.data.users | Where-Object { $_.role -eq "branch_manager" })
if ($bmUsers.Count -lt 1) { throw "Test 2 failed: no branch_manager in users" }
if (-not $bootstrap.data.users[0].passwordHash) { throw "Test 2 failed: missing passwordHash" }

Write-Host "`n=== TEST 3 BM cross-branch blocked ==="
try {
  Invoke-Api GET "/sync/bootstrap?branchId=$haripurBranch" $null $bmToken | Out-Null
  throw "Test 3 failed: expected 403"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -ne 403) { throw "Test 3 failed: expected 403, got $($_.Exception.Message)" }
  Write-Host "403 Branch access denied (expected)"
}

Write-Host "`n=== TEST 4 Delta ==="
$delta = Invoke-Api GET "/sync/delta?branchId=$wahBranch&since=2026-01-01T00:00:00.000Z" $null $bmToken
$delta | ConvertTo-Json -Depth 3 -Compress
if (-not $delta.success) { throw "Test 4 failed" }

$productId = $null
if ($bootstrap.data.products.Count -gt 0) {
  $productId = $bootstrap.data.products[0].id
} elseif ($delta.data.products.Count -gt 0) {
  $productId = $delta.data.products[0].id
}

if (-not $productId) {
  Write-Host "WARN: no products in bootstrap/delta - skipping push tests 5/6"
  exit 0
}

$clientEventId = "pos-acceptance-" + [guid]::NewGuid().ToString()
$pushBody = @{
  deviceId = "acceptance-terminal"
  branchId = $wahBranch
  events = @(
    @{
      clientEventId = $clientEventId
      eventType = "sale"
      payload = @{
        invoiceId = "INV-ACC-001"
        soldAt = (Get-Date).ToUniversalTime().ToString("o")
        counterCode = "C1"
        cashierId = $login.data.user.id
        paymentMethod = "cash"
        subtotal = 100
        tax = 17
        discount = 0
        total = 117
        tendered = 200
        changeDue = 83
        status = "completed"
        items = @(
          @{
            productId = $productId
            quantity = 1
            scale = "piece"
            unitPrice = 100
            discount = 0
            tax = 17
            lineTotal = 117
            isExchange = $false
          }
        )
      }
    }
  )
}

Write-Host "`n=== TEST 5 POS-shaped push ==="
$push1 = Invoke-Api POST "/sync/push" $pushBody $bmToken
$push1 | ConvertTo-Json -Depth 6
if ($push1.data.accepted -notcontains $clientEventId) { throw "Test 5 failed: clientEventId not in accepted" }

Write-Host "`n=== TEST 6 Idempotent replay ==="
$push2 = Invoke-Api POST "/sync/push" $pushBody $bmToken
$push2 | ConvertTo-Json -Depth 6
if ($push2.data.accepted -notcontains $clientEventId) { throw "Test 6 failed: replay not in accepted" }
if ($push2.data.events[0].skipped -ne $true) { throw "Test 6 failed: expected skipped true on replay" }

Write-Host "`nAll acceptance tests passed."
