
import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PublicRoutes, companyRoutes, employeeRoutes } from "./router";

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {[...PublicRoutes, ...companyRoutes, ...employeeRoutes].map(({ path, Component }) => {
          const normalizedPath = path ? `/${path}` : "/";
          return (
            <Route
              key={normalizedPath}
              path={normalizedPath}
              element={<Component />}
            />
          );
        })}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Suspense>
  );
}

export default App;
