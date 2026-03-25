import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Award,
  RefreshCw,
  Tag,
  Shield,
  Lightbulb,
  Leaf
} from "lucide-react";

const WhyChooseUs = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Award,
      title: t('whyChooseUs.craftsmanship'),
      description: t('whyChooseUs.craftsmanshipDesc'),
      bgClass: "bg-background",
    },
    {
      icon: RefreshCw,
      title: t('whyChooseUs.easyReturns'),
      description: t('whyChooseUs.easyReturnsDesc'),
      bgClass: "bg-muted/30",
    },
    {
      icon: Tag,
      title: t('whyChooseUs.affordable'),
      description: t('whyChooseUs.affordableDesc'),
      bgClass: "bg-background",
    },
    {
      icon: Shield,
      title: t('whyChooseUs.guaranteed'),
      description: t('whyChooseUs.guaranteedDesc'),
      bgClass: "bg-muted/30",
    },
    {
      icon: Lightbulb,
      title: t('whyChooseUs.innovative'),
      description: t('whyChooseUs.innovativeDesc'),
      bgClass: "bg-background",
    },
    {
      icon: Leaf,
      title: t('whyChooseUs.ecoFriendly'),
      description: t('whyChooseUs.ecoFriendlyDesc'),
      bgClass: "bg-muted/30",
    },
  ];

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
            {t('whyChooseUs.subtitle')}
          </span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mt-2">
            {t('whyChooseUs.title')}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t('whyChooseUs.community')}
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
