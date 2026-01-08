import {configureStore} from "@reduxjs/toolkit"
import company from "./features/company/companySlice"
import employee from "./features/employee/employeeSlice"
import admin from "./features/admin/adminSlice"

const store = configureStore({
    reducer:{
        company,
        employee,
        admin
    }
})

export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch