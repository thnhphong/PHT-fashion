import { Button } from "../ui/button"

export const LogOut = ({ handleLogout }: { handleLogout: () => void }) => {
  return (
    <div className="border-gray-200">
      <Button
        onClick={() => handleLogout()}
        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors rounded-full"
      >
        Logout
      </Button>
    </div>
  )
}