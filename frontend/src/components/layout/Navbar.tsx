import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, Heart, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";
import LoginBtn from "../buttons/LoginBtn";
import SignupBtn from "../buttons/SignupBtn";
import SearchInput from "../common/SearchInput";
import { LanguageSwitcher } from "../common/LanguageSwitcher";
import { isAuthenticated, logOut } from "../../utils/auth";
import { LogOut } from "../buttons/LogOut";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useFavorite } from "../../context/useFavorite";


//put login and signup buttons in the hamburger menu

const Navbar = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { getTotalItems, syncCartToDbOnLogout } = useCart();
  const { favorites, syncFavoritesToDbOnLogout } = useFavorite();

  const navLinks = [
    { name: t("nav.allProducts"), href: "/products" },
    { name: t("nav.newIn"), href: "#new" },
    { name: t("nav.bestSellers"), href: "/products?type=best-sellers" },
  ];

  const handleLogout = async () => {
    await syncCartToDbOnLogout();
    await syncFavoritesToDbOnLogout();
    logOut();
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
 
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed px-4 top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
        ? "bg-background/95 backdrop-blur-lg py-3 shadow-lg"
        : "bg-transparent py-5"
        }`}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl md:text-3xl tracking-wider text-foreground">
            PHT<span className="text-primary">.</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:underline underline-offset-4 underline-orange-500 text-sm font-medium text-muted-foreground hover:text-orange-500 transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative">

            <SearchInput />

          </div>

          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => navigate(isAuthenticated() ? '/profile' : '/login')}>
            <User className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex relative"
            onClick={() => navigate('/favorite')}
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                {favorites.length}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
              {getTotalItems()}
            </span>
          </Button>
          
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          {isAuthenticated() ? (
            <LogOut handleLogout={handleLogout} />
          ) : (
            <>
              <LoginBtn />
              <SignupBtn />
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background/95 backdrop-blur-lg border-t border-border"
          >
            <div className="container-custom py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              {/* Search Form */}
              <SearchInput />

              <div className="flex flex-col gap-6 pt-6 border-t border-border items-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{t('common.language')}</span>
                  <LanguageSwitcher />
                </div>

                <div className="flex justify-center gap-4 w-full items-center">
                  {isAuthenticated() ? (
                    <LogOut handleLogout={handleLogout} />
                  ) : (
                    <>
                      <LoginBtn />
                      <SignupBtn />
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
