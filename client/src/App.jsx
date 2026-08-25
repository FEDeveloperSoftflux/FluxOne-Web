import { AppRouter } from '@/router/index'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { BRAND } from '@/lib/constants'

function App() {
  return (
    <>
      <AppRouter />
      <ToastContainer
        position="top-right"
        autoClose={2800}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
        toastStyle={{
          fontFamily: 'inherit',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(65, 34, 131, 0.12)',
        }}
        progressStyle={{ background: BRAND.purple }}
      />
    </>
  )
}

export default App
