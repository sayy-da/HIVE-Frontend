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
  status: "requested" | "approved" | "rejected";
  active: boolean;
  isEmailVerified: boolean;
  accessToken: string;
}

const initialState: IEmployee = {
  _id: "",
  name: "",
  email: "",
  position: "",
  address: "",
  role: "user",
  companyId: "",
  status: "requested",
  active: false,
  isEmailVerified: false,
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

        state._id = decoded._id || decoded.sub || state._id;
        state.name = decoded.name ?? state.name;
        state.email = decoded.email ?? state.email;
        state.position = decoded.position ?? state.position;
        state.address = decoded.address ?? state.address;
        state.role = decoded.role ?? state.role;
        state.companyId = decoded.companyId ?? state.companyId;
        state.status = decoded.status ?? state.status;
        state.active = decoded.active ?? state.active;
        state.isEmailVerified = decoded.isEmailVerified ?? state.isEmailVerified;

        state.accessToken = token;
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
        status: "requested",
        active: false,
        isEmailVerified: false,
        accessToken: "",
      });
    },

    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },

    setEmployeeData: (state, action: PayloadAction<Partial<IEmployee>>) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { login, logout, setAccessToken, setEmployeeData } = employeeSlice.actions;
export default employeeSlice.reducer;

