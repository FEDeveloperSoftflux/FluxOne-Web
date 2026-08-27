// Redux store — Express → RTK slices → hooks → components
import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/rtk/features/auth/authSlice'
import productsReducer from '@/rtk/features/products/productsSlice'
import controlReducer from '@/rtk/features/control/controlSlice'
import inventoryDashboardReducer from '@/rtk/features/dashboard/inventoryDashboardSlice'
import suppliersReducer from '@/rtk/features/suppliers/suppliersSlice'
import ordersReducer from '@/rtk/features/orders/ordersSlice'
import branchStaffReducer from '@/rtk/features/branch/branchStaffSlice'
import branchDashboardReducer from '@/rtk/features/branch/branchDashboardSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    control: controlReducer,
    inventoryDashboard: inventoryDashboardReducer,
    suppliers: suppliersReducer,
    orders: ordersReducer,
    branchStaff: branchStaffReducer,
    branchDashboard: branchDashboardReducer,
  },
})
