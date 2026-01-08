import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from 'jwt-decode';

interface IAdmin {
  email: string;
  role: string;
  accessToken: string;
}

// Load initial state from localStorage
const loadAdminFromStorage = (): IAdmin => {
  try {
    const storedToken = localStorage.getItem('admin_accessToken');
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        return {
          email: decoded.email ?? "",
          role: decoded.role ?? "",
          accessToken: storedToken,
        };
      } catch (error) {
        console.error("Error decoding stored admin token:", error);
        localStorage.removeItem('admin_accessToken');
      }
    }
  } catch (error) {
    console.error("Error loading admin from storage:", error);
  }
  
  return {
    email: "",
    role: "",
    accessToken: "",
  };
};

const initialState: IAdmin = loadAdminFromStorage();

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      const token = action.payload;

      if (!token) {
        console.error("Admin login: No token provided");
        return;
      }

      try {
        const decoded: any = jwtDecode(token);

        // Verify the token has the correct role (admin)
        const tokenRole = decoded.role;
        if (!tokenRole) {
          console.error("Admin login: Token has no role field", decoded);
          return;
        }

        if (tokenRole !== 'admin') {
          console.error(`Invalid token role for admin login: expected 'admin', got '${tokenRole}'`);
          console.error("Full token payload:", decoded);
          return; // Don't set the token if role doesn't match
        }

        state.email = decoded.email ?? state.email;
        state.role = tokenRole;
        state.accessToken = token;
        
        // Persist token to localStorage
        localStorage.setItem('admin_accessToken', token);
        
        // Clear company token to prevent confusion
        localStorage.removeItem('company_accessToken');
        
        console.log("Admin login successful, token stored with role:", tokenRole);
      } catch (error) {
        console.error("Error decoding admin token:", error);
        console.error("Token value:", token?.substring(0, 50) + "...");
      }
    },

    logout: (state) => {
      Object.assign(state, {
        email: "",
        role: "",
        accessToken: "",
      });
      
      // Remove token from localStorage
      localStorage.removeItem('admin_accessToken');
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('admin_accessToken', action.payload);
    },
  },
});

export const { login, logout, setAccessToken } = adminSlice.actions;
export default adminSlice.reducer;

