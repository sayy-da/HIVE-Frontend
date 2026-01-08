import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from 'jwt-decode';

interface IEmployee {
  _id: string;
  name: string;
  email: string;
  position: string;
  address: string;
  role: "admin" | "user";
  companyId: string;
  status: "pending" | "active" | "inactive";
  isEmailVerified: boolean;
  accessToken: string;
  characterTexture?: string; // Avatar: 'adam', 'ash', 'lucy', 'nancy'
}

// Memory-only storage - no localStorage for security
const initialState: IEmployee = {
    _id: "",
    name: "",
    email: "",
    position: "",
    address: "",
    role: "user",
    companyId: "",
    status: "pending",
    isEmailVerified: false,
    characterTexture: "adam",
    accessToken: "",
  };

const employeeSlice = createSlice({
  name: "employee",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      const token = action.payload;

      try {
        const decoded: any = jwtDecode(token);

        // Debug logging in development
        if (import.meta.env.DEV) {
          console.log('[EmployeeSlice] Decoding token payload:', {
            hasCompanyId: !!decoded.companyId,
            companyId: decoded.companyId,
            hasEmail: !!decoded.email,
            hasStatus: !!decoded.status,
            allKeys: Object.keys(decoded)
          });
        }

        state._id = decoded._id || decoded.sub || state._id;
        state.name = decoded.name ?? state.name;
        state.email = decoded.email ?? state.email;
        state.position = decoded.position ?? state.position;
        state.address = decoded.address ?? state.address;
        state.role = decoded.role ?? state.role;
        // Only update companyId if it exists in token, otherwise keep existing value
        if (decoded.companyId) {
          state.companyId = decoded.companyId;
        } else if (!state.companyId) {
          // If companyId is missing from token and state, log warning
          console.warn('[EmployeeSlice] CompanyId missing from token and state');
        }
        state.status = decoded.status ?? state.status;
        state.isEmailVerified = decoded.isEmailVerified ?? state.isEmailVerified;
        state.characterTexture = decoded.characterTexture ?? state.characterTexture ?? "adam";

        state.accessToken = token;
        
        // Memory-only storage - no localStorage for security
      } catch (error) {
        console.error("Error decoding employee token:", error);
      }
    },

    logout: (state) => {
      Object.assign(state, {
        _id: "",
        name: "",
        email: "",
        position: "",
        address: "",
        role: "user",
        companyId: "",
        status: "pending",
        isEmailVerified: false,
        characterTexture: "adam",
        accessToken: "",
      });
      
    // Memory-only storage - no localStorage cleanup needed
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      // Memory-only storage - no localStorage
    },

    setEmployeeData: (state, action: PayloadAction<Partial<IEmployee>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { login, logout, setAccessToken, setEmployeeData } = employeeSlice.actions;
export default employeeSlice.reducer;

