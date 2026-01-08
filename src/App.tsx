import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicRoutes, companyRoutes, employeeRoutes, adminRoutes } from "./router";
import PublicRoute from "./components/auth/PublicRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";


function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {[...PublicRoutes, ...companyRoutes, ...employeeRoutes, ...adminRoutes].map(
          ({ path, Component, isPublic, isProtected, userType }) => {
          const normalizedPath = path ? `/${path}` : "/";
          
            // Choose wrapper based on route type
          let element = <Component />;
          
            if (isPublic) {
              // Public pages: login, register, etc. Redirect authenticated users away.
              element = (
                <PublicRoute userType={userType}>
                  <Component />
                </PublicRoute>
              );
            } else if (isProtected && userType) {
              // Protected pages: dashboards. Redirect unauthenticated users to login.
            element = (
              <ProtectedRoute userType={userType}>
                <Component />
              </ProtectedRoute>
            );
          }
          
          return (
            <Route
              key={normalizedPath}
              path={normalizedPath}
              element={element}
            />
          );
          }
        )}
        <Route path="*" element={<div>Page not found</div>} />
       
      </Routes>
    </Suspense>
  );
}

export default App;
