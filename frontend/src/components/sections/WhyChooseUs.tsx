import { motion } from "framer-motion";
import {
  Award,
  RefreshCw,
  Tag,
  Shield,
  Lightbulb,
  Leaf
} from "lucide-react";

const features = [
  {
    icon: Award,
    title: "Top-Notch Craftsmanship",
    description: "Every piece is carefully crafted with attention to detail and premium materials.",
    bgClass: "bg-background",
  },
  {
    icon: RefreshCw,
    title: "Easy Return & Exchange",
    description: "Hassle-free 30-day returns. If it doesn't fit, we've got you covered.",
    bgClass: "bg-muted/30",
  },
  {
    icon: Tag,
    title: "Affordable, Meets Quality",
    description: "Premium streetwear without the premium price tag. Style for everyone.",
    bgClass: "bg-background",
  },
  {
    icon: Shield,
    title: "Satisfaction Guaranteed",
    description: "We stand behind every product. Your satisfaction is our priority.",
    bgClass: "bg-muted/30",
  },
  {
    icon: Lightbulb,
    title: "Innovative Designs",
    description: "Fresh drops every month. Stay ahead with our cutting-edge styles.",
    bgClass: "bg-background",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly & Versatile",
    description: "Sustainable fashion that's good for you and the planet.",
    bgClass: "bg-muted/30",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary font-medium text-sm uppercase tracking-wider">
            Why PHT Fashion?
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-2">
            Why Choose Us
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            We're not just selling clothes – we're building a community of
            confident, style-conscious individuals.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`p-8 rounded-2xl ${feature.bgClass} border border-border hover:border-primary/50 transition-all duration-300 group`}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
