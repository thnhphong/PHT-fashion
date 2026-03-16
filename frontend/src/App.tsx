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
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrder from './pages/admin/AdminOrder';
import AdminCustomer from './pages/admin/AdminCustomer';
import ProductDetail from './pages/ProductDetail';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Search from './pages/Search';
import CartPopup from './pages/CartPopup';
import Cart from './pages/Cart';
import Products from './pages/Products';
import { FavoriteProvider } from './context/FavoriteContext';
import { CartProvider } from './context/CartContext';
import { ChatProvider } from './context/ChatContext';
import Favorite from './pages/Favorite';
import { AdminRoute } from './components/routes/AdminRoute';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminCoupon from './pages/admin/AdminCoupon';
import AdminProduct from './pages/admin/AdminProduct';
import CheckoutSuccess from './pages/CheckoutSuccess';
import FloatingChatButton from './components/chat/FloatingChatButton';
import ChatPopup from './components/chat/ChatPopup';

const Layout = () => {
  return (
    <>
      <CartPopup />
      <ChatPopup />
      <FloatingChatButton />
      <Outlet />
    </>
  );
};

function App() {
  return (
    <Router>
      <FavoriteProvider>
        <CartProvider>
          <ChatProvider>
            <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              {/* immediately show the cart popup when the user adds a product to the cart no specific route needed*/}
              <Route path="/cart-popup" element={<CartPopup />} />
              <Route path="/products" element={<Products />} />
              <Route path="/favorite" element={<Favorite />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/search" element={<Search />} />
            </Route>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProduct />} />
              <Route path="products/create" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="categories" element={<AdminCategory />} />
              <Route path="suppliers" element={<AdminSupplier />} />
              <Route path="orders" element={<AdminOrder />} />
              <Route path="customers" element={<AdminCustomer />} />
              <Route path="coupons" element={<AdminCoupon />} />
            </Route>
            </Routes>
          </ChatProvider>
        </CartProvider>
      </FavoriteProvider>
    </Router>
  );
}

export default App;
