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

const initialState: ICompany = {
  name: "",
  email: "",
  logo: "",
  count: 0,
  address: "",
  code: 0,
  accessToken: "",
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<string>) => {
      const token = action.payload;

      try {
        const decoded: any = jwtDecode(token);

        state.name = decoded.name ?? state.name;
        state.email = decoded.email ?? state.email;
        state.logo = decoded.logo ?? state.logo;
        state.count = decoded.count ?? state.count;
        state.address = decoded.address ?? state.address;
        state.code = decoded.code ?? state.code;

        state.accessToken = token;
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
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
  },
});

export const { login, logout, setAccessToken } = companySlice.actions;
export default companySlice.reducer;
