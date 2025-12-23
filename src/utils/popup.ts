import { toast } from "sonner";

export const successPopup = (message: string) => {
  toast.success("", {
    description: message, 
    duration: 2000,      
  });
};

export const errorPopup = (message: string) => {
  toast.error("",{
    description: message,
    duration: 2000,
  });
};
