import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
  ArrowUp
} from "lucide-react";
import { Button } from "../ui/button";

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
];

const Footer = () => {
  const { t } = useTranslation();

  const footerLinks = {
    about: [
      { name: t("footer.ourStory"), href: "#" },
      { name: t("footer.careers"), href: "#" },
      { name: t("footer.press"), href: "#" },
      { name: t("footer.sustainability"), href: "#" },
    ],
    quickLinks: [
      { name: t("footer.newArrivals"), href: "#" },
      { name: t("footer.bestSellers"), href: "/products?type=best-sellers" },
      { name: t("footer.sale"), href: "#" },
      { name: t("footer.lookbook"), href: "#" },
    ],
    categories: [
      { name: t("footer.tShirts"), href: "#" },
      { name: t("footer.hoodies"), href: "#" },
      { name: t("footer.pants"), href: "#" },
      { name: t("footer.accessories"), href: "#" },
    ],
    support: [
      { name: t("footer.faq"), href: "#" },
      { name: t("footer.shipping"), href: "#" },
      { name: t("footer.returns"), href: "#" },
      { name: t("footer.sizeGuide"), href: "#" },
    ],
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-card border-t border-border">
      {/* Main Footer */}
      <div className="container-custom py-16 px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <a href="/" className="inline-block mb-6">
              <span className="font-display text-3xl tracking-wider text-foreground">
                PHT<span className="text-primary">.</span>
              </span>
            </a>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              {t("footer.brandDescription")}
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-display text-lg mb-4">{t("footer.about")}</h4>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">{t("footer.categories")}</h4>
            <ul className="space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">{t("footer.contact")}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>123 Fashion Street, Style City, SC 12345</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>hello@phtfashion.com</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container-custom py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 PHT Fashion. {t("footer.copyright")}.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</a>
              <a href="#" className="hover:text-primary transition-colors">{t("footer.terms")}</a>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={scrollToTop}
            className="rounded-full border-orange-500 text-orange-500 border-2 hover:bg-orange-500 hover:text-white"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Large Brand Text */}
      <div className="container-custom pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="font-display text-6xl md:text-8xl lg:text-9xl text-muted/20 tracking-widest">
            PHT FASHION
          </span>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
