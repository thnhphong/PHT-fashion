import { Button } from "../ui/button"
import { ArrowRight } from "lucide-react"
interface ButtonProps {
  text: string
}
const ExploreNow = ({ text }: ButtonProps) => {
  return (
    <Button className="font-bold text-white bg-orange-500 hover:scale-105 transition-all duration-300 hover:bg-orange-600 rounded-lg px-10 py-6">
      {text}  
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Button>
  )
}

export default ExploreNow