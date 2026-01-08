import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from 'jwt-decode';

interface ICompany {
  name: string;
  email: string;
  logo: string;
  count: number;
  address: string;
  code: number;
  accessToken: string;
}

// Load initial state from localStorage
const loadCompanyFromStorage = (): ICompany => {
  try {
    const storedToken = localStorage.getItem('company_accessToken');
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        return {
          name: decoded.name ?? "",
          email: decoded.email ?? "",
          logo: decoded.logo ?? "",
          count: decoded.count ?? 0,
          address: decoded.address ?? "",
          code: decoded.code ?? 0,
          accessToken: storedToken,
        };
      } catch (error) {
        console.error("Error decoding stored company token:", error);
        localStorage.removeItem('company_accessToken');
      }
    }
  } catch (error) {
    console.error("Error loading company from storage:", error);
  }
  
  return {
    name: "",
    email: "",
    logo: "",
    count: 0,
    address: "",
    code: 0,
    accessToken: "",
  };
};

const initialState: ICompany = loadCompanyFromStorage();

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      const token = action.payload;

      try {
        const decoded: any = jwtDecode(token);

        // Verify the token has the correct role (company)
        const tokenRole = decoded.role;
        if (tokenRole !== 'company') {
          console.error(`Invalid token role for company login: expected 'company', got '${tokenRole}'`);
          return; // Don't set the token if role doesn't match
        }

        state.name = decoded.name ?? state.name;
        state.email = decoded.email ?? state.email;
        state.logo = decoded.logo ?? state.logo;
        state.count = decoded.count ?? state.count;
        state.address = decoded.address ?? state.address;
        state.code = decoded.code ?? state.code;

        state.accessToken = token;
        
        // Persist token to localStorage
        localStorage.setItem('company_accessToken', token);
        
        // Clear admin token to prevent confusion
        localStorage.removeItem('admin_accessToken');
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    },

    logout: (state) => {
      Object.assign(state, {
        name: "",
        email: "",
        logo: "",
        count: 0,
        address: "",
        password: "",
        code: 0,
        accessToken: "",
      });
      
      // Remove token from localStorage
      localStorage.removeItem('company_accessToken');
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      localStorage.setItem('company_accessToken', action.payload);
    },
  },
});

export const { login, logout, setAccessToken } = companySlice.actions;
export default companySlice.reducer;
