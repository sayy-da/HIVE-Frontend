import {configureStore} from "@reduxjs/toolkit"
import company from "./features/company/companySlice"
import employee from "./features/employee/employeeSlice"

const store = configureStore({
    reducer:{
        company,
        employee
    }
})

export default store
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch