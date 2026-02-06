import './App.css';
import './index.css';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Admin from './pages/admin/Admin';
import AdminCategory from './pages/admin/AdminCategory';
import AdminSupplier from './pages/admin/AdminSupplier';
import AdminProduct from './pages/admin/AdminProduct';
import AdminProductForm from './pages/admin/AdminProductForm';
import ProductDetail from './pages/ProductDetail';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/product/:id" element={<ProductDetail />} />
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
