import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home/Home";
import Login from "./components/pages/Login/Login";
import Register from "./components/pages/Register/Register";
import Sidebar from "./components/ui/Sidebar/Sidebar";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
import { AuthenticatedRoutes } from "./utils/AuthenticatedRoutes";
import { detect } from "detect-browser";
const browser = detect();

function App() {
  const sidebar = useSelector((state: RootState) => state.sidebar);
  const user = useSelector((state: RootState) => state.user);
  const theme = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  // alert(`${browser?.name} ${browser?.os} ${browser?.version} ${browser?.type}`);

  if (browser?.name === "safari" || browser?.name === "ios" || browser?.name === "crios")
    return (
      <div className="wrong-browser-view">
        <div className="wrong-browser-container">
          <h1>Oops!</h1>
          <p>
            It looks like you're using a browser that has disabled third-party cookies
            from cross-origin domains. This breaks this app's authentication, rendering it
            unusable. The only way around this is to purchase a yearly domain.
          </p>
          <p>
            Since this is a portfolio project (not a for-profit app), I ask you to view
            this on a non-webkit browser (like chrome or firefox on desktop) to ensure the
            optimal experience.
          </p>
          <strong>
            By the way, i'm sorry about this. Thanks in advance for checking out the
            project.
          </strong>
        </div>
      </div>
    );

  return (
    <div className="App">
      {user && <Sidebar />}
      <main style={{ marginLeft: user ? `${sidebar.width}px` : "0" }}>
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<AuthenticatedRoutes />}>
            <Route element={<Login />} path="/login" />
          </Route>
          <Route element={<Register />} path="/register" />
          <Route element={<p>Page not found </p>} path="*" />
        </Routes>
      </main>
    </div>
  );
}

export default App;
