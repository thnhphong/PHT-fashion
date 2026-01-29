import './App.css';
import './index.css';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Admin from './pages/admin/Admin';
import AdminCategory from './pages/admin/category/AdminCategory';
import AdminSupplier from './pages/admin/supplier/AdminSupplier';
import AdminProduct from './pages/admin/product/AdminProduct';
import AdminProductForm from './pages/admin/product/AdminProductForm';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/*" element={<Admin />}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<AdminProduct />} />
          <Route path="products/create" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategory />} />
          <Route path="suppliers" element={<AdminSupplier />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
