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
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Search from './pages/Search';
import CartPopup from './pages/CartPopup';
import Cart from './pages/Cart';

const Layout = () => {
  return (
    <>
      <CartPopup />
      <Outlet />
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {/* immediately show the cart popup when the user adds a product to the cart no specific route needed*/}
          <Route path="/cart-popup" element={<CartPopup />} />
          
        </Route>
        <Route path="/cart" element={<Cart />} /> 
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
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
