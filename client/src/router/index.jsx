import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { PATHS, INVENTORY_ROLES, BRANCH_ROLES, profilePathForRole } from '@/router/paths'
import { AuthGate } from '@/router/guards/AuthGate'
import { RoleGate } from '@/router/guards/RoleGate'
import { InventoryLayout } from '@/layouts/InventoryLayout'
import { BranchManagerLayout } from '@/layouts/BranchManagerLayout'
import { SplashPage } from '@/pages/splash/SplashPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { ProfilePage } from '@/pages/shared/ProfilePage'
import { DashboardPage as InventoryDashboardPage } from '@/pages/inventory/DashboardPage'
import { ProductsPage } from '@/pages/inventory/ProductsPage'
import { InventoryControlPage } from '@/pages/inventory/InventoryControlPage'
import { SuppliersPage } from '@/pages/inventory/SuppliersPage'
import { PurchaseOrdersPage } from '@/pages/inventory/PurchaseOrdersPage'
import { DashboardPage as BranchDashboardPage } from '@/pages/branch/DashboardPage'
import { StaffPage } from '@/pages/branch/StaffPage'
import { useAuthSession } from '@/hooks/useAuthSession'
import CategoriesPage from '@/pages/inventory/CategoriesPage'

function ProfileRedirect() {
  const { role } = useAuthSession()
  return <Navigate to={profilePathForRole(role)} replace />
}

const router = createBrowserRouter([
  { path: PATHS.splash, element: <SplashPage /> },
  { path: PATHS.login, element: <LoginPage /> },
  {
    element: <AuthGate />,
    children: [
      { path: PATHS.profile, element: <ProfileRedirect /> },
      {
        element: <RoleGate roles={INVENTORY_ROLES} />,
        children: [
          {
            path: PATHS.inventory.root,
            element: <InventoryLayout />,
            children: [
              { index: true, element: <InventoryDashboardPage /> },
              { path: 'products', element: <ProductsPage /> },
              { path: 'control', element: <InventoryControlPage /> },
              { path: 'suppliers', element: <SuppliersPage /> },
              { path: 'orders', element: <PurchaseOrdersPage /> },
              { path: 'categories', element: <CategoriesPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      {
        element: <RoleGate roles={BRANCH_ROLES} />,
        children: [
          {
            path: PATHS.branch.root,
            element: <BranchManagerLayout />,
            children: [
              { index: true, element: <BranchDashboardPage /> },
              { path: 'staff', element: <StaffPage /> },
              { path: 'profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
