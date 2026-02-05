import { Button } from "../ui/button"
interface ButtonProps {
  text: string
}
const ViewLookBook = ({ text }: ButtonProps) => {
  return (
    <Button className="font-bold text-orange-700 bg-white border-orange-500 hover:bg-orange-500 hover:text-white rounded-lg ring-orange-500 ring-2 px-10 py-6">
      {text}
    </Button>
  )
}

export default ViewLookBook