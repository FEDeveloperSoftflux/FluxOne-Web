import { listBranchesForLookup, listEmployeesForLookup, listBranchInventory } from './lookup.model.js'
import { success } from '../../../utils/response.util.js'
import { paginatedResult } from '../../../utils/pagination.util.js'

export async function employees(req, res) {
  const result = await listEmployeesForLookup(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}

export async function branches(req, res) {
  return success(res, await listBranchesForLookup(req.tenantId))
}

export async function branchInventory(req, res) {
  const result = await listBranchInventory(req.tenantId, req.validated.query)
  return success(res, paginatedResult(result.items, result))
}
