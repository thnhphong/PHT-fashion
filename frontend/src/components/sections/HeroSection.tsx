import { motion } from 'framer-motion'
import heroModel from '../../assets/images/hero-model.jpg'
import ExploreNow from "../buttons/ExploreNow"
import ViewLookBook from "../buttons/ViewLookBook"
const HeroSection = () => {
  return (
    <div className="flex justify-between items-center w-full h-screen px-20 mt-12">
      <div className="max-w-2xl text-left">
        <div className="text-4xl font-bold ">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-none"
          >
            The Ultimate
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="font-serif text-red-500 italic text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-primary"
          >
            Fashion Playground
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-none"
          >
            for Fashion Lovers
          </motion.h1>
          </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-lg text-muted-foreground max-w-md"
        >
        Discover a diverse range of clothing styles that lets you express your individuality and embrace confidence.
        </motion.p>
        <div className="flex gap-4 mt-2">
          <ExploreNow text="Explore Now"/>
          <ViewLookBook text="View Lookbook"/>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-8 pt-4"
        >
        <div className="flex gap-6 mt-10">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-orange-500">200+</h1>
            <p className="text-sm text-gray-500">Collections</p>
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-orange-500">50K+</h1>
            <p className="text-sm text-gray-500">Happy Customers</p>
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-orange-500">4.9</h1>
            <p className="text-sm text-gray-500">Rating</p>
          </div>
        </div>
        </motion.div>
      </div>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative order-1 lg:order-2"
          >
      <div className="w-1/2 ">
        <img src={heroModel} alt="Hero Model" className="relative w-[100%] h-full object-cover rounded-lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
      </div>
        {/* Floating Cards */}
        <motion.div
          initial={{ opacity: 0, x: 50, y: 50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute -right-4 lg:-right-8 bottom-32 glass p-4 rounded-2xl hidden md:block"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="font-semibold">Trending Now</p>
              <p className="text-sm text-muted-foreground">2.5k items sold</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -50, y: -50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 1.2 }}
          className="absolute -left-4 lg:-left-8 top-32 glass p-4 rounded-2xl hidden md:block"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary" />
              <div className="w-8 h-8 rounded-full bg-secondary" />
              <div className="w-8 h-8 rounded-full bg-accent" />
            </div>
            <div>
              <p className="font-semibold text-sm">+500</p>
              <p className="text-xs text-muted-foreground">joined today</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default HeroSection