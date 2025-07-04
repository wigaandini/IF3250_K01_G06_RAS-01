import { menuItems } from "@/lib/constants";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

export const MobileSidebar = ({ isOpen, closeMenu }: { isOpen: boolean; closeMenu: () => void }) => {
  const pathname = usePathname();
  const router = useRouter();


  return (
    <div
      className={`fixed inset-0 z-50 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:hidden transition-transform duration-300 ease-in-out`}
    >
      <div className="relative w-80 max-w-[80%] h-full bg-gradient-to-b from-[#FCB82E] to-[#07B0C8] shadow-xl">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-[#ffffff]">Menu</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => {
                    router.push(item.href);
                    closeMenu();
                  }}
                  className={`flex items-center w-full p-3 font-bold rounded-lg ${
                    pathname === item.href
                      ? "bg-white text-[#07B0C8]" // Selected state (white bg with teal text)
                      : "text-white hover:bg-white hover:bg-opacity-20" // Default state (white text with semi-transparent hover)
                  }`}
                  >
                  <Image
                    src={pathname === item.href ? item.iconActive : item.iconDefault}
                    alt={item.title}
                    width={20}
                    height={20}
                    className="w-5 h-5 mr-3"
                  />
                  <span>{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 mt-1 rounded-full hover:bg-gray-100"
          aria-label="Close menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};